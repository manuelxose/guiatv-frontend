import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { AuthService } from '../../domain/services/AuthService';
import { logger } from '../../shared/utils/logger';
import { ChatConversationModel } from '../../infrastructure/database/models/ChatConversation.model';
import { ChatMessageModel } from '../../infrastructure/database/models/ChatMessage.model';

interface AuthedSocket extends Socket {
  userId?: string;
}

export class ChatSocketHub {
  private static instance: ChatSocketHub;
  private io?: Server;
  private initialized = false;

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

      socket.on('chat:typing', async (payload: { conversationId?: string; isTyping?: boolean }) => {
        const conversationId = String(payload?.conversationId || '').trim();
        if (!conversationId) return;

        const conversation = await ChatConversationModel.findById(conversationId).lean().exec();
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (participant) => String(participant) === userId
        );
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
        const isParticipant = conversation.participants.some(
          (participant) => String(participant) === userId
        );
        if (!isParticipant) return;

        const now = new Date();
        await ChatMessageModel.updateMany(
          {
            conversationId: conversation._id,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            readBy: { $ne: new mongoose.Types.ObjectId(userId) },
          },
          { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } }
        ).exec();

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

  private extractBearerToken(header?: string): string {
    const value = String(header || '').trim();
    if (!value.toLowerCase().startsWith('bearer ')) return '';
    return value.slice(7).trim();
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
