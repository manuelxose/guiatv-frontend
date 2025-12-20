import { Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import { successResponse } from '../../shared/types/ApiResponse';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { ChatConversationModel } from '../../infrastructure/database/models/ChatConversation.model';
import { ChatMessageModel } from '../../infrastructure/database/models/ChatMessage.model';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { UserProfileModel } from '../../infrastructure/database/models/UserProfile.model';

export class ChatController {
  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const conversations = await ChatConversationModel.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();

      if (!conversations.length) {
        res.json(successResponse({ conversations: [] }));
        return;
      }

      const conversationIds = conversations.map((conv) => this.toObjectId(String(conv._id)));
      const userObjectId = this.toObjectId(userId);
      const participantIds = Array.from(
        new Set(conversations.flatMap((conv) => conv.participants.map((id) => String(id))))
      );

      const userMap = await this.buildUserSummaryMap(participantIds);

      const [lastMessagesAgg, unreadCountsAgg] = await Promise.all([
        ChatMessageModel.aggregate([
          { $match: { conversationId: { $in: conversationIds } } },
          { $sort: { createdAt: -1 } },
          { $group: { _id: '$conversationId', message: { $first: '$$ROOT' } } },
        ]),
        ChatMessageModel.aggregate([
          {
            $match: {
              conversationId: { $in: conversationIds },
              senderId: { $ne: userObjectId },
              readBy: { $ne: userObjectId },
            },
          },
          { $group: { _id: '$conversationId', count: { $sum: 1 } } },
        ]),
      ]);

      const lastMessageMap = new Map<string, any>();
      for (const entry of lastMessagesAgg) {
        lastMessageMap.set(String(entry._id), entry.message);
      }

      const unreadMap = new Map<string, number>();
      for (const entry of unreadCountsAgg) {
        unreadMap.set(String(entry._id), entry.count);
      }

      const mapped = conversations.map((conv) => {
        const convId = String(conv._id);
        const participants = conv.participants
          .map((participant) => userMap.get(String(participant)))
          .filter((participant) => participant !== null)
          .map((participant) => this.mapParticipant(participant));

        const lastMessage = lastMessageMap.get(convId);
        return {
          id: convId,
          participants,
          lastMessage: lastMessage ? this.mapMessage(lastMessage) : undefined,
          unreadCount: unreadMap.get(convId) || 0,
          updatedAt: conv.updatedAt,
          isGroup: conv.participants.length > 2,
        };
      });

      res.json(successResponse({ conversations: mapped }));
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const participantId = String(req.body?.participantId || '').trim();

      if (!participantId) {
        throw new ValidationError('participantId is required', [
          { field: 'participantId', message: 'participantId is required', value: participantId },
        ]);
      }
      if (participantId === userId) {
        throw new ValidationError('Cannot create conversation with yourself', [
          { field: 'participantId', message: 'Cannot create conversation with yourself', value: participantId },
        ]);
      }

      const participant = await UserModel.findById(participantId).lean().exec();
      if (!participant) {
        throw new NotFoundError('User not found');
      }

      const existing = await ChatConversationModel.findOne({
        participants: { $all: [userId, participantId] },
      })
        .lean()
        .exec();

      const conversation = existing
        ? existing
        : await ChatConversationModel.create({
            participants: [userId, participantId],
          });

      const participants = await this.buildUserSummaryMap([userId, participantId]);
      res.json(
        successResponse({
          conversation: {
            id: String(conversation._id),
            participants: Array.from(participants.values()).map((entry) => this.mapParticipant(entry)),
            unreadCount: 0,
            updatedAt: conversation.updatedAt,
            isGroup: false,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const conversationId = String(req.params.id || '').trim();
      if (!conversationId) {
        throw new ValidationError('conversation id is required', [
          { field: 'id', message: 'conversation id is required', value: conversationId },
        ]);
      }

      const conversation = await ChatConversationModel.findById(conversationId).lean().exec();
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const isParticipant = conversation.participants.some(
        (participant) => String(participant) === userId
      );
      if (!isParticipant) {
        throw new NotFoundError('Conversation not found');
      }

      const messages = await ChatMessageModel.find({ conversationId })
        .sort({ createdAt: 1 })
        .lean()
        .exec();

      res.json(successResponse({ messages: messages.map((message) => this.mapMessage(message)) }));
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const conversationId = String(req.params.id || '').trim();
      const { text, type, content } = req.body || {};

      if (!conversationId) {
        throw new ValidationError('conversation id is required', [
          { field: 'id', message: 'conversation id is required', value: conversationId },
        ]);
      }

      const conversation = await ChatConversationModel.findById(conversationId).exec();
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const isParticipant = conversation.participants.some(
        (participant) => String(participant) === userId
      );
      if (!isParticipant) {
        throw new NotFoundError('Conversation not found');
      }

      if ((!text || !String(text).trim()) && (!content || type === 'text')) {
        throw new ValidationError('Message text is required', [
          { field: 'text', message: 'Message text is required', value: text },
        ]);
      }

      const message = await ChatMessageModel.create({
        conversationId,
        senderId: userId,
        text: text ? String(text).trim() : undefined,
        type: type || 'text',
        content: content || undefined,
        readBy: [userId],
      });

      conversation.updatedAt = new Date();
      await conversation.save();

      res.json(successResponse({ message: this.mapMessage(message.toObject()) }));
    } catch (error) {
      next(error);
    }
  }

  private getUserId(req: Request): string {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      throw new NotFoundError('User not found');
    }
    return authReq.user.id;
  }

  private toObjectId(id: string): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }

  private async buildUserSummaryMap(userIds: string[]): Promise<Map<string, any>> {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    const userMap = new Map<string, any>();

    if (!uniqueIds.length) return userMap;

    const [users, profiles] = await Promise.all([
      UserModel.find({ _id: { $in: uniqueIds } }).lean().exec(),
      UserProfileModel.find({ userId: { $in: uniqueIds } }).lean().exec(),
    ]);

    const profileMap = new Map<string, any>();
    for (const profile of profiles) {
      profileMap.set(String(profile.userId), profile);
    }

    for (const user of users) {
      const id = String(user._id);
      const profile = profileMap.get(id);
      const emailPrefix =
        user.email?.split('@')[0] || profile?.username || `user${String(id).slice(-4)}`;

      userMap.set(id, {
        id,
        name: user.name || profile?.username || emailPrefix,
        username: profile?.username || emailPrefix,
        avatar: profile?.avatar || user.picture || '/assets/gpt-avatar.png',
        favoriteGenres: profile?.favoriteGenres || [],
        watchingNow: profile?.watchingNow,
        privacy: profile?.privacy,
      });
    }

    return userMap;
  }

  private mapParticipant(user: any) {
    const watchingTitle = user.watchingNow?.title;
    const isOnline = Boolean(user.privacy?.showOnline && watchingTitle);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isOnline,
      lastActivity: watchingTitle ? `Viendo "${watchingTitle}"` : 'Sin actividad reciente',
      favoriteGenres: user.favoriteGenres || [],
      following: true,
    };
  }

  private mapMessage(message: any) {
    return {
      id: String(message._id),
      conversationId: String(message.conversationId),
      senderId: String(message.senderId),
      text: message.text,
      type: message.type,
      content: message.content,
      createdAt: message.createdAt,
      readBy: Array.isArray(message.readBy)
        ? message.readBy.map((entry: any) => String(entry))
        : [],
    };
  }
}
