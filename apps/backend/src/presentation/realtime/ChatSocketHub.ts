import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { AuthService } from '../../domain/services/AuthService';
import { logger } from '../../shared/utils/logger';
import { ChatConversationModel } from '../../infrastructure/database/models/ChatConversation.model';
import { ChatMessageModel } from '../../infrastructure/database/models/ChatMessage.model';
import { GENERAL_CHAT_PAIR_KEY } from './chat.constants';

interface AuthedSocket extends Socket {
  userId?: string;
}

export class ChatSocketHub {
  private static instance: ChatSocketHub;
  private io?: Server;
  private initialized = false;
  private readonly socketUserMap = new Map<string, string>();
  private readonly userSocketMap = new Map<string, Set<string>>();

  static getInstance(): ChatSocketHub {
    if (!ChatSocketHub.instance) {
      ChatSocketHub.instance = new ChatSocketHub();
    }
    return ChatSocketHub.instance;
  }

  initialize(server: HttpServer, authService: AuthService): void {
    if (this.initialized) return;

    this.io = new Server(server, {
      cors: {
        origin: true,
        credentials: true,
      },
      path: '/v2/ws',
    });

    this.io.use(async (socket: AuthedSocket, next) => {
      try {
        const token =
          (typeof socket.handshake.auth?.token === 'string'
            ? socket.handshake.auth.token
            : '') ||
          this.extractBearerToken(socket.handshake.headers.authorization);

        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const user = await authService.getSession(token);
        socket.userId = user.id;
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    this.io.on('connection', (socket: AuthedSocket) => {
      const userId = socket.userId;
      if (!userId) {
        socket.disconnect(true);
        return;
      }

      socket.join(this.userRoom(userId));
      socket.join(this.generalRoom());
      const becameOnline = this.registerPresence(userId, socket.id);
      this.emitPresenceSnapshot(socket);
      if (becameOnline) {
        this.emitPresenceChange(userId, true);
      }

      socket.on('chat:typing', async (payload: { conversationId?: string; isTyping?: boolean }) => {
        const conversationId = String(payload?.conversationId || '').trim();
        if (!conversationId) return;

        const conversation = await ChatConversationModel.findById(conversationId).lean().exec();
        if (!conversation) return;
        const isGeneral = this.isGeneralConversation(conversation.pairKey);

        if (isGeneral) {
          socket.to(this.generalRoom()).emit('chat:typing', {
            conversationId,
            userId,
            isTyping: Boolean(payload?.isTyping),
          });
          return;
        }

        const isParticipant = conversation.participants.some((participant) => String(participant) === userId);
        if (!isParticipant) return;

        const participantIds = conversation.participants
          .map((participant) => String(participant))
          .filter((participant) => participant !== userId);
        for (const participantId of participantIds) {
          this.io?.to(this.userRoom(participantId)).emit('chat:typing', {
            conversationId,
            userId,
            isTyping: Boolean(payload?.isTyping),
          });
        }
      });

      socket.on('chat:read', async (payload: { conversationId?: string }) => {
        const conversationId = String(payload?.conversationId || '').trim();
        if (!conversationId) return;

        const conversation = await ChatConversationModel.findById(conversationId).exec();
        if (!conversation) return;
        const isGeneral = this.isGeneralConversation(conversation.pairKey);
        if (!isGeneral) {
          const isParticipant = conversation.participants.some(
            (participant) => String(participant) === userId
          );
          if (!isParticipant) return;
        }

        const now = new Date();
        await ChatMessageModel.updateMany(
          {
            conversationId: conversation._id,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            readBy: { $ne: new mongoose.Types.ObjectId(userId) },
          },
          { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } }
        ).exec();

        if (!isGeneral) {
          const state = conversation.participantStates.find(
            (entry) => String(entry.userId) === userId
          );
          if (state) {
            state.lastReadAt = now;
          } else {
            conversation.participantStates.push({
              userId: new mongoose.Types.ObjectId(userId),
              lastReadAt: now,
            });
          }
          await conversation.save();
        }

        if (isGeneral) {
          this.io?.to(this.generalRoom()).emit('chat:read:updated', {
            conversationId,
            userId,
            readAt: now.toISOString(),
          });
          return;
        }

        this.io?.to(this.userRoom(userId)).emit('chat:read:updated', {
          conversationId,
          userId,
          readAt: now.toISOString(),
        });

        for (const participantId of conversation.participants.map((p) => String(p))) {
          if (participantId === userId) continue;
          this.io?.to(this.userRoom(participantId)).emit('chat:read:updated', {
            conversationId,
            userId,
            readAt: now.toISOString(),
          });
        }
      });

      socket.on('disconnect', () => {
        const { userId: disconnectedUserId, becameOffline } = this.unregisterPresence(socket.id);
        if (disconnectedUserId && becameOffline) {
          this.emitPresenceChange(disconnectedUserId, false);
        }
      });
    });

    this.initialized = true;
    logger.info('Chat socket hub initialized', { path: '/v2/ws' });
  }

  emitMessageNew(recipientIds: string[], payload: Record<string, unknown>): void {
    for (const recipientId of recipientIds) {
      this.io?.to(this.userRoom(recipientId)).emit('chat:message:new', payload);
    }
  }

  emitConversationUpdate(recipientIds: string[], payload: Record<string, unknown>): void {
    for (const recipientId of recipientIds) {
      this.io?.to(this.userRoom(recipientId)).emit('chat:conversation:update', payload);
    }
  }

  emitReadUpdated(recipientIds: string[], payload: Record<string, unknown>): void {
    for (const recipientId of recipientIds) {
      this.io?.to(this.userRoom(recipientId)).emit('chat:read:updated', payload);
    }
  }

  emitGeneralMessageNew(payload: Record<string, unknown>): void {
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

  getOnlineUserIds(): string[] {
    return Array.from(this.userSocketMap.keys());
  }

  getOnlineCount(): number {
    return this.userSocketMap.size;
  }

  isUserOnline(userId: string): boolean {
    return Boolean(this.userSocketMap.get(userId)?.size);
  }

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

  private registerPresence(userId: string, socketId: string): boolean {
    this.socketUserMap.set(socketId, userId);
    const current = this.userSocketMap.get(userId) || new Set<string>();
    const becameOnline = current.size === 0;
    current.add(socketId);
    this.userSocketMap.set(userId, current);
    return becameOnline;
  }

  private unregisterPresence(
    socketId: string
  ): { userId: string | null; becameOffline: boolean } {
    const userId = this.socketUserMap.get(socketId) || null;
    if (!userId) {
      return { userId: null, becameOffline: false };
    }

    this.socketUserMap.delete(socketId);
    const sockets = this.userSocketMap.get(userId);
    if (!sockets) {
      return { userId, becameOffline: false };
    }

    sockets.delete(socketId);
    if (sockets.size > 0) {
      return { userId, becameOffline: false };
    }

    this.userSocketMap.delete(userId);
    return { userId, becameOffline: true };
  }

  private emitPresenceSnapshot(socket: Socket): void {
    socket.emit('chat:presence:snapshot', {
      onlineUserIds: this.getOnlineUserIds(),
      onlineCount: this.userSocketMap.size,
    });
  }

  private emitPresenceChange(userId: string, isOnline: boolean): void {
    this.io?.emit('chat:presence', {
      userId,
      isOnline,
      onlineCount: this.userSocketMap.size,
    });
  }

  private isGeneralConversation(pairKey?: string): boolean {
    return String(pairKey || '').trim() === GENERAL_CHAT_PAIR_KEY;
  }
}
