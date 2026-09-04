import { Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import { successResponse } from '../../shared/types/ApiResponse';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { ChatConversationModel } from '../../infrastructure/database/models/ChatConversation.model';
import { ChatMessageModel } from '../../infrastructure/database/models/ChatMessage.model';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { UserProfileModel } from '../../infrastructure/database/models/UserProfile.model';
import { UserFollowModel } from '../../infrastructure/database/models/UserFollow.model';
import { UserBlockModel } from '../../infrastructure/database/models/UserBlock.model';
import { UserNotificationService } from '../../application/services/UserNotificationService';
import { ChatSocketHub } from '../realtime/ChatSocketHub';
import { GENERAL_CHAT_PAIR_KEY } from '../realtime/chat.constants';

export class ChatController {
  private notificationService = new UserNotificationService();
  private socketHub = ChatSocketHub.getInstance();

  async getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const blockedIds = await this.getBlockedUserIds(userId);
      const followSet = await this.getFollowingSet(userId);

      const [userConversations, generalConversation] = await Promise.all([
        ChatConversationModel.find({ participants: userId }).sort({ updatedAt: -1 }).lean().exec(),
        this.ensureGeneralConversation(),
      ]);

      const byId = new Map<string, any>();
      for (const conversation of userConversations) {
        byId.set(String(conversation._id), conversation);
      }
      byId.set(String(generalConversation._id), generalConversation);

      const conversations = Array.from(byId.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const filtered = conversations.filter((conversation) => {
        if (this.isGeneralConversation(conversation)) {
          return true;
        }

        const otherIds = conversation.participants
          .map((participant: mongoose.Types.ObjectId) => String(participant))
          .filter((participant: string) => participant !== userId);
        return otherIds.every((participant: string) => !blockedIds.has(participant));
      });

      if (!filtered.length) {
        res.json(successResponse({ conversations: [] }));
        return;
      }

      const conversationIds = filtered.map((conv) => this.toObjectId(String(conv._id)));
      const userObjectId = this.toObjectId(userId);
      const participantIds = Array.from(
        new Set(
          filtered.flatMap((conv) =>
            this.isGeneralConversation(conv)
              ? []
              : conv.participants.map((id: mongoose.Types.ObjectId) => String(id))
          )
        )
      );

      const userMap = await this.buildUserSummaryMap(participantIds);
      const onlineUserIds = new Set(await this.socketHub.getOnlineUserIds());
      const onlineCount = onlineUserIds.size;

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

      const mapped = filtered.map((conv) => {
        const convId = String(conv._id);
        const isGeneral = this.isGeneralConversation(conv);
        const participants = isGeneral
          ? [this.buildGeneralParticipant(onlineCount)]
          : conv.participants
              .map((participant: mongoose.Types.ObjectId) => userMap.get(String(participant)))
              .filter((participant: any) => Boolean(participant))
              .map((participant: any) =>
                this.mapParticipant(
                  participant,
                  followSet.has(participant.id),
                  onlineUserIds
                )
              );

        const lastMessage = lastMessageMap.get(convId);
        return {
          id: convId,
          participants,
          lastMessage: lastMessage ? this.mapMessage(lastMessage) : undefined,
          unreadCount: unreadMap.get(convId) || 0,
          updatedAt: conv.updatedAt,
          isGroup: Boolean(isGeneral || conv.isGroup || conv.participants.length > 2),
          groupName: isGeneral ? 'Chat general' : undefined,
        };
      });

      res.json(successResponse({ conversations: mapped }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Online users derive exclusively from live socket presence.
   * AuthSession data is intentionally NOT used here: an unexpired session
   * does not mean the user is online.
   */
  async getOnlineUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const blockedIds = await this.getBlockedUserIds(userId);
      const followSet = await this.getFollowingSet(userId);

      const onlineUserIds = (await this.socketHub.getOnlineUserIds())
        .filter((id) => id !== userId && !blockedIds.has(id))
        .slice(0, limit);
      const onlineIdSet = new Set(onlineUserIds);

      const userMap = await this.buildUserSummaryMap(onlineUserIds);
      const users = onlineUserIds
        .map((id) => userMap.get(id))
        .filter((entry: any) => Boolean(entry))
        .map((entry: any) =>
          this.mapParticipant(entry, followSet.has(entry.id), onlineIdSet)
        )
        .sort((a: any, b: any) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

      res.json(
        successResponse({
          users,
          onlineUserIds,
          connectedUsersNow: await this.socketHub.getOnlineCount(),
        })
      );
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

      const blocked = await this.isBlockedBetween(userId, participantId);
      if (blocked) {
        throw new ForbiddenError('Conversation is blocked');
      }

      const participant = await UserModel.findById(participantId).lean().exec();
      if (!participant) {
        throw new NotFoundError('User not found');
      }

      await this.assertDmPolicy(userId, participantId);

      const pairKey = this.buildPairKey(userId, participantId);
      const existing = await ChatConversationModel.findOne({
        pairKey,
        isGroup: false,
      })
        .lean()
        .exec();

      const conversation = existing
        ? existing
        : await ChatConversationModel.create({
            pairKey,
            isGroup: false,
            participants: [userId, participantId],
            participantStates: [
              {
                userId,
                lastReadAt: new Date(),
              },
              {
                userId: participantId,
              },
            ],
          });

      const participants = await this.buildUserSummaryMap([userId, participantId]);
      const followSet = await this.getFollowingSet(userId);
      const onlineUserIds = new Set(await this.socketHub.getOnlineUserIds());
      res.json(
        successResponse({
          conversation: {
            id: String(conversation._id),
            participants: Array.from(participants.values()).map((entry) =>
              this.mapParticipant(entry, followSet.has(entry.id), onlineUserIds)
            ),
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

      const isGeneralConversation = this.isGeneralConversation(conversation);
      if (!isGeneralConversation) {
        const isParticipant = conversation.participants.some(
          (participant) => String(participant) === userId
        );
        if (!isParticipant) {
          throw new NotFoundError('Conversation not found');
        }
      }

      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const beforeRaw = typeof req.query.before === 'string' ? req.query.before : '';
      const beforeDate = beforeRaw ? new Date(beforeRaw) : null;

      const filters: Record<string, any> = { conversationId };
      if (beforeDate && !Number.isNaN(beforeDate.getTime())) {
        filters.createdAt = { $lt: beforeDate };
      }

      const rows = await ChatMessageModel.find(filters)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean()
        .exec();

      const hasMore = rows.length > limit;
      const messages = (hasMore ? rows.slice(0, limit) : rows).reverse();

      res.json(
        successResponse({
          messages: messages.map((message) => this.mapMessage(message)),
          page: {
            hasMore,
            nextBefore: hasMore ? messages[0]?.createdAt : null,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const conversationId = String(req.params.id || '').trim();
      const { text, type, content } = req.body || {};
      const clientMessageIdRaw =
        typeof req.body?.clientMessageId === 'string' ? req.body.clientMessageId : '';
      const clientMessageId = clientMessageIdRaw.trim() || undefined;

      if (!conversationId) {
        throw new ValidationError('conversation id is required', [
          { field: 'id', message: 'conversation id is required', value: conversationId },
        ]);
      }

      const conversation = await ChatConversationModel.findById(conversationId).exec();
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const isGeneralConversation = this.isGeneralConversation(conversation);
      const participantIds = conversation.participants.map((participant) => String(participant));
      if (!isGeneralConversation) {
        const isParticipant = participantIds.includes(userId);
        if (!isParticipant) {
          throw new NotFoundError('Conversation not found');
        }
      }

      const peerIds = isGeneralConversation
        ? []
        : participantIds.filter((participant) => participant !== userId);
      for (const peerId of peerIds) {
        if (await this.isBlockedBetween(userId, peerId)) {
          throw new ForbiddenError('Conversation is blocked');
        }
      }

      if ((!text || !String(text).trim()) && (!content || type === 'text')) {
        throw new ValidationError('Message text is required', [
          { field: 'text', message: 'Message text is required', value: text },
        ]);
      }

      if (clientMessageId) {
        const existingByClientId = await ChatMessageModel.findOne({
          conversationId,
          senderId: userId,
          clientMessageId,
        })
          .lean()
          .exec();

        if (existingByClientId) {
          res.json(successResponse({ message: this.mapMessage(existingByClientId) }));
          return;
        }
      }

      let message: any;
      try {
        message = await ChatMessageModel.create({
          conversationId,
          senderId: userId,
          clientMessageId,
          text: text ? String(text).trim() : undefined,
          type: type || 'text',
          content: content || undefined,
          readBy: [userId],
        });
      } catch (error: any) {
        if (error?.code === 11000 && clientMessageId) {
          const duplicated = await ChatMessageModel.findOne({
            conversationId,
            senderId: userId,
            clientMessageId,
          })
            .lean()
            .exec();
          if (duplicated) {
            res.json(successResponse({ message: this.mapMessage(duplicated) }));
            return;
          }
        }
        throw error;
      }

      conversation.updatedAt = new Date();
      if (!isGeneralConversation) {
        const senderState = conversation.participantStates.find(
          (state) => String(state.userId) === userId
        );
        if (senderState) {
          senderState.lastReadAt = new Date();
        } else {
          conversation.participantStates.push({
            userId: new mongoose.Types.ObjectId(userId),
            lastReadAt: new Date(),
          });
        }
      }
      await conversation.save();

      const mappedMessage = this.mapMessage(message.toObject());

      if (isGeneralConversation) {
        this.socketHub.emitGeneralMessageNew({
          conversationId,
          message: mappedMessage,
        });
        this.socketHub.emitGeneralConversationUpdate({
          conversationId,
          updatedAt: conversation.updatedAt,
        });
      } else {
        this.socketHub.emitMessageNew(participantIds, {
          conversationId,
          message: mappedMessage,
        });
        this.socketHub.emitConversationUpdate(participantIds, {
          conversationId,
          updatedAt: conversation.updatedAt,
        });
      }

      if (!isGeneralConversation && peerIds.length) {
        const sender = await UserModel.findById(userId).lean().exec();
        const senderName = sender?.name || sender?.email?.split('@')[0] || 'Usuario';
        const preview =
          message.type === 'text'
            ? String(message.text || '').slice(0, 120)
            : 'Nuevo mensaje';

        for (const recipientId of peerIds) {
          const profile = await UserProfileModel.findOne({ userId: recipientId }).lean().exec();
          if (profile?.notifications?.chatMessages === false) continue;

          await this.notificationService.notifyMessage({
            recipientId,
            actorId: userId,
            actorName: senderName,
            conversationId,
            preview,
          });
        }
      }

      res.json(successResponse({ message: mappedMessage }));
    } catch (error) {
      next(error);
    }
  }

  async markConversationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const conversationId = String(req.params.id || '').trim();
      if (!conversationId) {
        throw new ValidationError('conversation id is required', [
          { field: 'id', message: 'conversation id is required', value: conversationId },
        ]);
      }

      const conversation = await ChatConversationModel.findById(conversationId).exec();
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      const isGeneralConversation = this.isGeneralConversation(conversation);
      if (!isGeneralConversation) {
        const isParticipant = conversation.participants.some(
          (participant) => String(participant) === userId
        );
        if (!isParticipant) {
          throw new NotFoundError('Conversation not found');
        }
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const update = await ChatMessageModel.updateMany(
        {
          conversationId: conversation._id,
          senderId: { $ne: userObjectId },
          readBy: { $ne: userObjectId },
        },
        { $addToSet: { readBy: userObjectId } }
      ).exec();

      const now = new Date();
      if (!isGeneralConversation) {
        const state = conversation.participantStates.find(
          (entry) => String(entry.userId) === userId
        );
        if (state) {
          state.lastReadAt = now;
        } else {
          conversation.participantStates.push({
            userId: userObjectId,
            lastReadAt: now,
          });
        }
        await conversation.save();
      }

      if (isGeneralConversation) {
        this.socketHub.emitGeneralReadUpdated({
          conversationId,
          userId,
          readAt: now.toISOString(),
        });
      } else {
        const participantIds = conversation.participants.map((participant) => String(participant));
        this.socketHub.emitReadUpdated(participantIds, {
          conversationId,
          userId,
          readAt: now.toISOString(),
        });
      }

      res.json(
        successResponse({
          updated: update.modifiedCount,
          readAt: now.toISOString(),
        })
      );
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

  private buildPairKey(userA: string, userB: string): string {
    return [userA, userB].sort().join(':');
  }

  private async ensureGeneralConversation(): Promise<any> {
    const existing = await ChatConversationModel.findOne({ pairKey: GENERAL_CHAT_PAIR_KEY })
      .lean()
      .exec();
    if (existing) {
      return existing;
    }

    try {
      const created = await ChatConversationModel.create({
        pairKey: GENERAL_CHAT_PAIR_KEY,
        isGroup: true,
        participants: [],
        participantStates: [],
      });
      return created.toObject();
    } catch (error: any) {
      if (error?.code === 11000) {
        const duplicated = await ChatConversationModel.findOne({ pairKey: GENERAL_CHAT_PAIR_KEY })
          .lean()
          .exec();
        if (duplicated) {
          return duplicated;
        }
      }
      throw error;
    }
  }

  private isGeneralConversation(conversation: { pairKey?: string } | null | undefined): boolean {
    return String(conversation?.pairKey || '').trim() === GENERAL_CHAT_PAIR_KEY;
  }

  private buildGeneralParticipant(onlineCount: number) {
    return {
      id: 'general',
      name: 'Chat general',
      username: 'chat-general',
      avatar: '/assets/logo.svg',
      isOnline: onlineCount > 0,
      lastActivity: 'Usuarios conectados en tiempo real',
      favoriteGenres: [],
      following: false,
    };
  }

  private async getFollowingSet(userId: string): Promise<Set<string>> {
    const rows = await UserFollowModel.find({ followerId: userId }).lean().exec();
    return new Set(rows.map((row) => String(row.followeeId)));
  }

  private async getBlockedUserIds(userId: string): Promise<Set<string>> {
    const rows = await UserBlockModel.find({
      $or: [{ blockerId: userId }, { blockedId: userId }],
    })
      .lean()
      .exec();
    const blockedIds = new Set<string>();
    for (const row of rows) {
      blockedIds.add(String(row.blockerId) === userId ? String(row.blockedId) : String(row.blockerId));
    }
    return blockedIds;
  }

  private async isBlockedBetween(userId: string, targetId: string): Promise<boolean> {
    const blocked = await UserBlockModel.findOne({
      $or: [
        { blockerId: userId, blockedId: targetId },
        { blockerId: targetId, blockedId: userId },
      ],
    })
      .lean()
      .exec();
    return Boolean(blocked);
  }

  private async assertDmPolicy(userId: string, targetId: string): Promise<void> {
    const targetProfile = await UserProfileModel.findOne({ userId: targetId }).lean().exec();
    const allowMessages = targetProfile?.privacy?.allowMessages || 'all';

    if (allowMessages === 'none') {
      throw new ForbiddenError('User does not accept messages');
    }

    if (allowMessages === 'all') {
      return;
    }

    const followsTarget = await UserFollowModel.findOne({
      followerId: userId,
      followeeId: targetId,
    })
      .lean()
      .exec();

    if (!followsTarget) {
      throw new ForbiddenError('User only accepts messages from followers');
    }
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
      });
    }

    return userMap;
  }

  private mapParticipant(
    user: any,
    following: boolean,
    onlineUserIds: Set<string> | boolean
  ) {
    const watchingTitle = user.watchingNow?.title;
    const resolvedOnline =
      typeof onlineUserIds === 'boolean'
        ? onlineUserIds
        : onlineUserIds.has(user.id);
    const lastActivity = resolvedOnline
      ? 'En linea ahora'
      : watchingTitle
          ? `Viendo "${watchingTitle}"`
          : 'Sin actividad reciente';

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      isOnline: resolvedOnline,
      lastActivity,
      favoriteGenres: user.favoriteGenres || [],
      following,
    };
  }

  private mapMessage(message: any) {
    return {
      id: String(message._id),
      conversationId: String(message.conversationId),
      senderId: String(message.senderId),
      clientMessageId: message.clientMessageId,
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
