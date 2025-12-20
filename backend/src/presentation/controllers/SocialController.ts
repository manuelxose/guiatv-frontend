import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../shared/types/ApiResponse';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { UserActivityModel } from '../../infrastructure/database/models/UserActivity.model';
import { UserFollowModel } from '../../infrastructure/database/models/UserFollow.model';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { UserProfileModel } from '../../infrastructure/database/models/UserProfile.model';

type ActivityScope = 'me' | 'friends' | 'all';

export class SocialController {
  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const scope = this.parseScope(req.query.scope);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;

      const userIds = await this.resolveScope(userId, scope);
      if (!userIds.length) {
        res.json(successResponse({ activities: [] }));
        return;
      }

      const activities = await UserActivityModel.find({ userId: { $in: userIds } })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      const userMap = await this.buildUserSummaryMap(userIds);
      const mapped = activities.map((activity) =>
        this.mapActivity(activity, userMap.get(String(activity.userId)))
      );

      res.json(successResponse({ activities: mapped }));
    } catch (error) {
      next(error);
    }
  }

  async getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const followees = await UserFollowModel.find({ followerId: userId }).lean().exec();
      const friendIds = followees.map((follow) => String(follow.followeeId));

      if (!friendIds.length) {
        res.json(successResponse({ friends: [] }));
        return;
      }

      const userMap = await this.buildUserSummaryMap(friendIds);
      const friends = friendIds
        .map((id) => this.mapFriend(userMap.get(id)))
        .filter((friend) => friend !== null);

      res.json(successResponse({ friends }));
    } catch (error) {
      next(error);
    }
  }

  async toggleFollow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const targetId = String(req.params.userId || '').trim();
      const action = String(req.body?.action || 'toggle');

      if (!targetId) {
        throw new ValidationError('userId is required', [
          { field: 'userId', message: 'userId is required', value: targetId },
        ]);
      }
      if (targetId === userId) {
        throw new ValidationError('Cannot follow yourself', [
          { field: 'userId', message: 'Cannot follow yourself', value: targetId },
        ]);
      }

      const targetUser = await UserModel.findById(targetId).lean().exec();
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      const existing = await UserFollowModel.findOne({
        followerId: userId,
        followeeId: targetId,
      }).exec();

      let following = false;

      if (action === 'unfollow') {
        if (existing) {
          await existing.deleteOne();
        }
        following = false;
      } else if (action === 'follow') {
        if (!existing) {
          await UserFollowModel.create({ followerId: userId, followeeId: targetId });
        }
        following = true;
      } else {
        if (existing) {
          await existing.deleteOne();
          following = false;
        } else {
          await UserFollowModel.create({ followerId: userId, followeeId: targetId });
          following = true;
        }
      }

      if (following) {
        const targetName = targetUser.name || targetUser.email || 'Usuario';
        await UserActivityModel.create({
          userId,
          type: 'follow',
          title: 'Nuevo seguimiento',
          description: `Ahora sigues a ${targetName}`,
          badge: 'Comunidad',
          visibility: 'friends',
        });
      }

      const [followers, followingCount] = await Promise.all([
        UserFollowModel.countDocuments({ followeeId: userId }),
        UserFollowModel.countDocuments({ followerId: userId }),
      ]);

      res.json(successResponse({ following, stats: { followers, following: followingCount } }));
    } catch (error) {
      next(error);
    }
  }

  async addRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { title, type, note, tags, visibility, status, rating, mood, platform, image } = req.body || {};

      if (!title || !type) {
        throw new ValidationError('title and type are required', [
          { field: 'title', message: 'title is required', value: title },
          { field: 'type', message: 'type is required', value: type },
        ]);
      }

      const payload = {
        title: String(title).trim(),
        type,
        note: note ? String(note).trim() : '',
        tags: Array.isArray(tags) ? tags.map((tag) => String(tag)) : [],
        visibility: visibility || 'friends',
        status: status || 'finished',
        rating: rating !== undefined ? Number(rating) : undefined,
        mood: mood ? String(mood).trim() : undefined,
        platform: platform ? String(platform).trim() : undefined,
        image: image ? String(image).trim() : undefined,
        likes: 0,
        comments: 0,
      };

      const activity = await UserActivityModel.create({
        userId,
        type: 'recommendation',
        title: payload.title,
        description: payload.note,
        badge: payload.status,
        category: payload.type,
        image: payload.image,
        visibility: payload.visibility,
        payload,
      });

      const userMap = await this.buildUserSummaryMap([userId]);
      res.json(successResponse({ recommendation: this.mapRecommendation(activity, userMap.get(userId)) }));
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const scope = this.parseScope(req.query.scope);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;

      const userIds = await this.resolveScope(userId, scope);
      if (!userIds.length) {
        res.json(successResponse({ recommendations: [] }));
        return;
      }

      const activities = await UserActivityModel.find({
        userId: { $in: userIds },
        type: 'recommendation',
      })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      const userMap = await this.buildUserSummaryMap(userIds);
      const mapped = activities.map((activity) =>
        this.mapRecommendation(activity, userMap.get(String(activity.userId)))
      );

      res.json(successResponse({ recommendations: mapped }));
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

  private parseScope(value: unknown): ActivityScope {
    const scope = typeof value === 'string' ? value : 'friends';
    if (scope === 'me' || scope === 'friends' || scope === 'all') {
      return scope;
    }
    return 'friends';
  }

  private async resolveScope(userId: string, scope: ActivityScope): Promise<string[]> {
    if (scope === 'me') {
      return [userId];
    }

    const followees = await UserFollowModel.find({ followerId: userId }).lean().exec();
    const followeeIds = followees.map((follow) => String(follow.followeeId));

    if (scope === 'friends') {
      return followeeIds;
    }

    return [userId, ...followeeIds];
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

  private mapActivity(activity: any, user?: any) {
    return {
      id: String(activity._id),
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      createdAt: activity.createdAt,
      badge: activity.badge,
      category: activity.category,
      target: activity.target,
      image: activity.image,
      user: user
        ? {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          }
        : undefined,
    };
  }

  private mapRecommendation(activity: any, user?: any) {
    const payload = activity.payload || {};
    return {
      id: String(activity._id),
      title: payload.title || activity.title,
      type: payload.type || activity.category || 'program',
      note: payload.note || activity.description || '',
      tags: Array.isArray(payload.tags)
        ? payload.tags
        : activity.badge
          ? [activity.badge]
          : [],
      visibility: activity.visibility || 'friends',
      status: payload.status || 'finished',
      rating: payload.rating,
      createdAt: activity.createdAt,
      mood: payload.mood,
      platform: payload.platform,
      image: payload.image || activity.image,
      likes: payload.likes || 0,
      comments: payload.comments || 0,
      user: user
        ? {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          }
        : undefined,
    };
  }

  private mapFriend(user?: any) {
    if (!user) return null;
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
}
