import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { AuthService } from '../../domain/services/AuthService';
import { logger } from '../../shared/utils/logger';
import { ChatConversationModel } from '../../infrastructure/database/models/ChatConversation.model';
import { ChatMessageModel } from '../../infrastructure/database/models/ChatMessage.model';
import { GENERAL_CHAT_PAIR_KEY } from './chat.constants';
import { InMemoryPresenceStore, PresenceStore } from './PresenceStore';
import { RealtimeStats } from './chat.types';

/**
 * Minimal repository contracts used by the hub. Kept separate from the
 * mongoose models so hub behavior can be tested with in-memory stubs.
 */
export interface HubConversationRecord {
  pairKey?: string;
  participants: string[];
}

export interface HubConversationRepository {
  findById(conversationId: string): Promise<HubConversationRecord | null>;
}

export interface HubMessageRepository {
  /** Adds readerId to readBy of every message the reader has not read yet. */
  markAllRead(conversationId: string, readerId: string): Promise<void>;
}

interface AuthedSocket extends Socket {
  userId?: string;
}

interface HubDependencies {
  presenceStore?: PresenceStore;
  conversationRepo?: HubConversationRepository;
  messageRepo?: HubMessageRepository;
  /** When true, use the Socket.IO Redis adapter (REALTIME_ADAPTER=redis). */
  useRedisAdapter?: boolean;
  redisUrl?: string;
}

class MongoConversationRepository implements HubConversationRepository {
  async findById(conversationId: string): Promise<HubConversationRecord | null> {
    const conversation = await ChatConversationModel.findById(conversationId)
      .lean()
      .exec();
    if (!conversation) return null;
    return {
      pairKey: conversation.pairKey,
      participants: (conversation.participants || []).map((entry: any) =>
        String(entry)
      ),
    };
  }
}

class MongoMessageRepository implements HubMessageRepository {
  async markAllRead(conversationId: string, readerId: string): Promise<void> {
    const readerObjectId = new mongoose.Types.ObjectId(readerId);
    await ChatMessageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: readerObjectId },
        readBy: { $ne: readerObjectId },
      },
      { $addToSet: { readBy: readerObjectId } }
    ).exec();
  }
}

const DEFAULT_PING_INTERVAL_MS = 25_000;
const DEFAULT_PING_TIMEOUT_MS = 20_000;
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_HTTP_BUFFER_SIZE = 1e6; // 1 MB payload cap

/** Server-side throttle: min interval between two typing emissions from the
 * same socket for the same conversation. */
const TYPING_MIN_INTERVAL_MS = 1_200;

export class ChatSocketHub {
  private static instance: ChatSocketHub;
  private io?: Server;
  private initialized = false;
  private presenceStore: PresenceStore = new InMemoryPresenceStore();
  private conversationRepo: HubConversationRepository =
    new MongoConversationRepository();
  private messageRepo: HubMessageRepository = new MongoMessageRepository();
  private metricsTimer: ReturnType<typeof setInterval> | null = null;
  private adapterMode: 'local' | 'redis' = 'local';
  private presenceMode: 'memory' | 'redis' = 'memory';

  /** socketId -> conversationId -> last typing emit timestamp */
  private readonly typingLastEmit = new Map<string, Map<string, number>>();
  /** socketId -> Set<conversationId> currently typing (cleared on disconnect) */
  private readonly typingActive = new Map<string, Set<string>>();

  // Lightweight operational counters (no message contents, no tokens).
  private readonly counters = {
    connections: 0,
    disconnections: 0,
    authFailures: 0,
    rejectedSockets: 0,
    messagesEmitted: 0,
    presenceEventsEmitted: 0,
    disconnectReasons: new Map<string, number>(),
  };

  static getInstance(): ChatSocketHub {
    if (!ChatSocketHub.instance) {
      ChatSocketHub.instance = new ChatSocketHub();
    }
    return ChatSocketHub.instance;
  }

  async initialize(
    server: HttpServer,
    authService: AuthService,
    deps?: HubDependencies
  ): Promise<void> {
    if (this.initialized) return;

    if (deps?.presenceStore) {
      this.presenceStore = deps.presenceStore;
      this.presenceMode = 'redis';
    }
    if (deps?.conversationRepo) {
      this.conversationRepo = deps.conversationRepo;
    }
    if (deps?.messageRepo) {
      this.messageRepo = deps.messageRepo;
    }

    this.io = new Server(server, {
      cors: {
        origin: (_origin, callback) => callback(null, true),
        credentials: true,
      },
      path: '/v2/ws',
      pingInterval: DEFAULT_PING_INTERVAL_MS,
      pingTimeout: DEFAULT_PING_TIMEOUT_MS,
      connectTimeout: DEFAULT_CONNECT_TIMEOUT_MS,
      maxHttpBufferSize: DEFAULT_MAX_HTTP_BUFFER_SIZE,
      // WebSocket preferred; polling retained as a safe fallback for
      // proxies that do not support upgrades.
      transports: ['websocket', 'polling'],
    });

    if (deps?.useRedisAdapter && deps?.redisUrl) {
      const attached = await this.attachRedisAdapter(deps.redisUrl);
      if (attached) this.adapterMode = 'redis';
    }

    this.io.use(async (socket: AuthedSocket, next) => {
      try {
        const token =
          (typeof socket.handshake.auth?.token === 'string'
            ? socket.handshake.auth.token
            : '') ||
          this.extractBearerToken(socket.handshake.headers.authorization);

        if (!token) {
          this.counters.authFailures += 1;
          logger.warn('Realtime socket rejected: missing token', {
            remoteAddress: socket.handshake.address,
          });
          return next(new Error('Unauthorized'));
        }

        const user = await authService.getSession(token);
        socket.userId = user.id;
        next();
      } catch (error) {
        this.counters.authFailures += 1;
        logger.warn('Realtime socket rejected: invalid token', {
          remoteAddress: socket.handshake.address,
        });
        next(new Error('Unauthorized'));
      }
    });

    this.io.on('connection', (socket: AuthedSocket) => {
      const userId = socket.userId;
      if (!userId) {
        this.counters.rejectedSockets += 1;
        socket.disconnect(true);
        return;
      }

      this.counters.connections += 1;
      socket.join(this.userRoom(userId));
      socket.join(this.generalRoom());

      void this.handleConnection(socket, userId);

      socket.on(
        'chat:typing',
        (raw: unknown) => void this.handleTyping(socket, userId, raw)
      );
      socket.on(
        'chat:read',
        (raw: unknown) => void this.handleRead(userId, raw)
      );
      socket.on('disconnect', (reason: string) => {
        this.counters.disconnections += 1;
        this.counters.disconnectReasons.set(
          reason,
          (this.counters.disconnectReasons.get(reason) || 0) + 1
        );
        void this.handleDisconnect(socket, reason);
      });
    });

    this.startMetricsReporter();
    this.initialized = true;
    logger.info('Chat socket hub initialized', {
      path: '/v2/ws',
      presenceStore: this.presenceMode,
      adapter: this.adapterMode,
    });
  }

  async close(): Promise<void> {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
    if (this.io) {
      await new Promise<void>((resolve) => this.io?.close(() => resolve()));
      this.io = undefined;
    }
    await this.presenceStore.dispose();
    this.initialized = false;
  }

  // ------------------------------------------------------------------
  // Presence (async facade over the presence store)
  // ------------------------------------------------------------------

  async getOnlineUserIds(): Promise<string[]> {
    return this.presenceStore.getOnlineUserIds();
  }

  async getOnlineCount(): Promise<number> {
    return this.presenceStore.getOnlineCount();
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.presenceStore.isUserOnline(userId);
  }

  async getSocketCount(userId: string): Promise<number> {
    return this.presenceStore.getSocketCount(userId);
  }

  // ------------------------------------------------------------------
  // Emissions
  // ------------------------------------------------------------------

  emitMessageNew(recipientIds: string[], payload: Record<string, unknown>): void {
    this.counters.messagesEmitted += recipientIds.length;
    for (const recipientId of recipientIds) {
      this.io?.to(this.userRoom(recipientId)).emit('chat:message:new', payload);
    }
  }

  emitConversationUpdate(
    recipientIds: string[],
    payload: Record<string, unknown>
  ): void {
    for (const recipientId of recipientIds) {
      this.io
        ?.to(this.userRoom(recipientId))
        .emit('chat:conversation:update', payload);
    }
  }

  emitReadUpdated(recipientIds: string[], payload: Record<string, unknown>): void {
    for (const recipientId of recipientIds) {
      this.io?.to(this.userRoom(recipientId)).emit('chat:read:updated', payload);
    }
  }

  emitGeneralMessageNew(payload: Record<string, unknown>): void {
    this.counters.messagesEmitted += 1;
    this.io?.to(this.generalRoom()).emit('chat:message:new', payload);
  }

  emitGeneralConversationUpdate(payload: Record<string, unknown>): void {
    this.io?.to(this.generalRoom()).emit('chat:conversation:update', payload);
  }

  emitGeneralReadUpdated(payload: Record<string, unknown>): void {
    this.io?.to(this.generalRoom()).emit('chat:read:updated', payload);
  }

  emitNotification(recipientId: string, payload: Record<string, unknown>): void {
    this.io?.to(this.userRoom(recipientId)).emit('notification:new', payload);
  }

  // ------------------------------------------------------------------
  // Diagnostics
  // ------------------------------------------------------------------

  getStats(): RealtimeStats {
    return {
      activeSockets: this.io?.engine.clientsCount ?? 0,
      onlineUsers: 0,
      totalConnections: this.counters.connections,
      totalDisconnections: this.counters.disconnections,
      authFailures: this.counters.authFailures,
      rejectedSockets: this.counters.rejectedSockets,
      messagesEmitted: this.counters.messagesEmitted,
      presenceEventsEmitted: this.counters.presenceEventsEmitted,
      disconnectReasons: Object.fromEntries(this.counters.disconnectReasons),
      adapter: this.adapterMode,
      presenceStore: this.presenceMode,
    };
  }

  async getDiagnostics(): Promise<RealtimeStats> {
    const stats = this.getStats();
    stats.onlineUsers = await this.presenceStore.getOnlineCount();
    return stats;
  }

  // ------------------------------------------------------------------
  // Connection / event handling
  // ------------------------------------------------------------------

  private async handleConnection(
    socket: AuthedSocket,
    userId: string
  ): Promise<void> {
    const becameOnline = await this.presenceStore.register(userId, socket.id);
    socket.emit('chat:presence:snapshot', {
      onlineUserIds: await this.presenceStore.getOnlineUserIds(),
      onlineCount: await this.presenceStore.getOnlineCount(),
    });
    if (becameOnline) {
      await this.emitPresenceChange(userId, true);
    }
    logger.info('Realtime socket connected', {
      userId,
      socketCount: await this.presenceStore.getSocketCount(userId),
    });
  }

  private async handleDisconnect(
    socket: AuthedSocket,
    reason: string
  ): Promise<void> {
    const userId = socket.userId;

    // Clear any typing indicators this socket had open.
    const activeConversations = this.typingActive.get(socket.id);
    if (activeConversations) {
      for (const conversationId of activeConversations) {
        if (userId) {
          this.io?.emit('chat:typing', {
            conversationId,
            userId,
            isTyping: false,
          });
        }
      }
      this.typingActive.delete(socket.id);
    }
    this.typingLastEmit.delete(socket.id);

    const result = await this.presenceStore.unregister(socket.id);
    if (result.userId && result.becameOffline) {
      await this.emitPresenceChange(result.userId, false);
    }
    logger.info('Realtime socket disconnected', {
      userId: userId || result.userId || null,
      reason,
    });
  }

  private async handleTyping(
    socket: AuthedSocket,
    userId: string,
    raw: unknown
  ): Promise<void> {
    const payload = (raw || {}) as {
      conversationId?: unknown;
      isTyping?: unknown;
    };
    const conversationId = String(payload?.conversationId || '').trim();
    if (!conversationId || conversationId.length > 64) return;

    // Server-side throttle: drop bursts instead of forwarding every event.
    const now = Date.now();
    let byConversation = this.typingLastEmit.get(socket.id);
    if (!byConversation) {
      byConversation = new Map<string, number>();
      this.typingLastEmit.set(socket.id, byConversation);
    }
    const isTyping = Boolean(payload?.isTyping);
    const lastEmit = byConversation.get(conversationId) || 0;
    if (isTyping && now - lastEmit < TYPING_MIN_INTERVAL_MS) return;
    byConversation.set(conversationId, now);

    try {
      const conversation = await this.conversationRepo.findById(conversationId);
      if (!conversation) return;

      const isGeneral = this.isGeneralConversation(conversation.pairKey);
      const emitPayload = { conversationId, userId, isTyping };

      if (isTyping) {
        const active = this.typingActive.get(socket.id) || new Set<string>();
        active.add(conversationId);
        this.typingActive.set(socket.id, active);
      } else {
        const active = this.typingActive.get(socket.id);
        if (active) {
          active.delete(conversationId);
          if (!active.size) this.typingActive.delete(socket.id);
        }
      }

      if (isGeneral) {
        socket.to(this.generalRoom()).emit('chat:typing', emitPayload);
        return;
      }

      if (!conversation.participants.includes(userId)) return;

      for (const participantId of conversation.participants) {
        if (participantId === userId) continue;
        this.io
          ?.to(this.userRoom(participantId))
          .emit('chat:typing', emitPayload);
      }
    } catch (error) {
      logger.warn('Typing handler failed', { error });
    }
  }

  private async handleRead(
    userId: string,
    raw: unknown
  ): Promise<void> {
    const payload = (raw || {}) as { conversationId?: unknown };
    const conversationId = String(payload?.conversationId || '').trim();
    if (!conversationId || conversationId.length > 64) return;

    try {
      const conversation = await this.conversationRepo.findById(conversationId);
      if (!conversation) return;
      const isGeneral = this.isGeneralConversation(conversation.pairKey);
      if (!isGeneral && !conversation.participants.includes(userId)) return;

      const now = new Date();
      await this.messageRepo.markAllRead(conversationId, userId);

      const readPayload = {
        conversationId,
        userId,
        readAt: now.toISOString(),
      };

      if (isGeneral) {
        this.io?.to(this.generalRoom()).emit('chat:read:updated', readPayload);
        return;
      }

      for (const participantId of conversation.participants) {
        if (participantId === userId) continue;
        this.io
          ?.to(this.userRoom(participantId))
          .emit('chat:read:updated', readPayload);
      }
    } catch (error) {
      logger.warn('Read handler failed', { error });
    }
  }

  private async emitPresenceChange(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    this.counters.presenceEventsEmitted += 1;
    const onlineCount = await this.presenceStore.getOnlineCount();
    this.io?.emit('chat:presence', { userId, isOnline, onlineCount });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private extractBearerToken(header?: string): string {
    const value = String(header || '').trim();
    if (!value.toLowerCase().startsWith('bearer ')) return '';
    return value.slice(7).trim();
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private generalRoom(): string {
    return 'chat:general';
  }

  private isGeneralConversation(pairKey?: string): boolean {
    return String(pairKey || '').trim() === GENERAL_CHAT_PAIR_KEY;
  }

  private async attachRedisAdapter(redisUrl: string): Promise<boolean> {
    try {
      const { createClient } = await import('redis');
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.io?.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter enabled', { url: redisUrl });
      return true;
    } catch (error) {
      logger.error(
        'Failed to enable Socket.IO Redis adapter, using local adapter',
        { error }
      );
      return false;
    }
  }

  private startMetricsReporter(): void {
    if (this.metricsTimer) return;
    this.metricsTimer = setInterval(() => {
      void (async () => {
        try {
          logger.info('Realtime metrics', {
            activeSockets: this.io?.engine.clientsCount ?? 0,
            onlineUsers: await this.presenceStore.getOnlineCount(),
            connections: this.counters.connections,
            disconnections: this.counters.disconnections,
            authFailures: this.counters.authFailures,
            messagesEmitted: this.counters.messagesEmitted,
            presenceEventsEmitted: this.counters.presenceEventsEmitted,
            disconnectReasons: Object.fromEntries(
              this.counters.disconnectReasons
            ),
          });
        } catch (error) {
          logger.warn('Realtime metrics reporter failed', { error });
        }
      })();
    }, 60_000);
    this.metricsTimer.unref?.();
  }
}
