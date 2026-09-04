import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../shared/types/ApiResponse';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { UserActivityModel } from '../../infrastructure/database/models/UserActivity.model';
import { UserFollowModel } from '../../infrastructure/database/models/UserFollow.model';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { UserProfileModel } from '../../infrastructure/database/models/UserProfile.model';
import { UserBlockModel } from '../../infrastructure/database/models/UserBlock.model';
import { UserReportModel } from '../../infrastructure/database/models/UserReport.model';
import { UserFavoriteModel } from '../../infrastructure/database/models/UserFavorite.model';
import { UserListItemModel } from '../../infrastructure/database/models/UserListItem.model';
import { ProgramModel } from '../../infrastructure/database/models/Program.model';
import { UserNotificationService } from '../../application/services/UserNotificationService';
import { ActivityLikeModel } from '../../infrastructure/database/models/ActivityLike.model';
import { ActivityCommentModel } from '../../infrastructure/database/models/ActivityComment.model';
import { UserContentInteractionModel } from '../../infrastructure/database/models/UserContentInteraction.model';
import { UserListModel } from '../../infrastructure/database/models/UserList.model';

type ActivityScope = 'me' | 'friends' | 'all';

interface ScopeResolution {
  userIds: string[];
  friendIds: Set<string>;
}

export class SocialController {
  private notificationService = new UserNotificationService();

  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const scope = this.parseScope(req.query.scope);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;

      const scopeData = await this.resolveScope(userId, scope);
      if (!scopeData.userIds.length) {
        res.json(successResponse({ activities: [] }));
        return;
      }

      const activities = await UserActivityModel.find({ userId: { $in: scopeData.userIds } })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit * 2)
        .lean()
        .exec();

      const filtered = activities.filter((activity) =>
        this.canViewActivity(userId, String(activity.userId), activity.visibility, scopeData.friendIds)
      );
      const userMap = await this.buildUserSummaryMap(scopeData.userIds);
      const sliced = filtered.slice(0, limit);
      const mapped = sliced.map((activity) =>
        this.mapActivity(activity, userMap.get(String(activity.userId)))
      );

      const enriched = await this.enrichActivitiesWithSocialCounts(mapped, userId);

      res.json(successResponse({ activities: enriched }));
    } catch (error) {
      next(error);
    }
  }

  async getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const friendIds = await this.getMutualFriendIds(userId);

      if (!friendIds.length) {
        res.json(successResponse({ friends: [] }));
        return;
      }

      const userMap = await this.buildUserSummaryMap(friendIds);
      const friends = friendIds
        .map((id) => this.mapFriend(userMap.get(id), true))
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

      const blocked = await this.isBlockedBetween(userId, targetId);
      if (blocked) {
        throw new ForbiddenError('Cannot follow a blocked user');
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
        const actor = await UserModel.findById(userId).lean().exec();
        const actorName =
          actor?.name || actor?.email?.split('@')[0] || 'Usuario';
        const targetName = targetUser.name || targetUser.email || 'Usuario';
        await UserActivityModel.create({
          userId,
          type: 'follow',
          title: 'Nuevo seguimiento',
          description: `Ahora sigues a ${targetName}`,
          badge: 'Comunidad',
          visibility: 'friends',
        });
        await this.notificationService.notifyFollow({
          recipientId: targetId,
          actorId: userId,
          actorName,
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
        type: String(type).trim(),
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

      const scopeData = await this.resolveScope(userId, scope);
      if (!scopeData.userIds.length) {
        res.json(successResponse({ recommendations: [] }));
        return;
      }

      const activities = await UserActivityModel.find({
        userId: { $in: scopeData.userIds },
        type: 'recommendation',
      })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit * 2)
        .lean()
        .exec();

      const filtered = activities.filter((activity) =>
        this.canViewActivity(userId, String(activity.userId), activity.visibility, scopeData.friendIds)
      );

      const userMap = await this.buildUserSummaryMap(scopeData.userIds);
      const mapped = filtered
        .slice(0, limit)
        .map((activity) => this.mapRecommendation(activity, userMap.get(String(activity.userId))));

      if (scope === 'me') {
        const deterministic = await this.buildDeterministicRecommendations(userId, limit);
        res.json(successResponse({ recommendations: [...mapped, ...deterministic].slice(0, limit) }));
        return;
      }

      res.json(successResponse({ recommendations: mapped }));
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const targetId = String(req.params.userId || '').trim();
      if (!targetId) {
        throw new ValidationError('userId is required', [
          { field: 'userId', message: 'userId is required', value: targetId },
        ]);
      }
      if (targetId === userId) {
        throw new ValidationError('Cannot block yourself', [
          { field: 'userId', message: 'Cannot block yourself', value: targetId },
        ]);
      }

      const target = await UserModel.findById(targetId).lean().exec();
      if (!target) {
        throw new NotFoundError('User not found');
      }

      await UserBlockModel.updateOne(
        { blockerId: userId, blockedId: targetId },
        { $setOnInsert: { blockerId: userId, blockedId: targetId } },
        { upsert: true }
      ).exec();

      await UserFollowModel.deleteMany({
        $or: [
          { followerId: userId, followeeId: targetId },
          { followerId: targetId, followeeId: userId },
        ],
      }).exec();

      res.json(successResponse({ blocked: true, userId: targetId }));
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const targetId = String(req.params.userId || '').trim();
      if (!targetId) {
        throw new ValidationError('userId is required', [
          { field: 'userId', message: 'userId is required', value: targetId },
        ]);
      }

      await UserBlockModel.deleteOne({ blockerId: userId, blockedId: targetId }).exec();
      res.json(successResponse({ blocked: false, userId: targetId }));
    } catch (error) {
      next(error);
    }
  }

  async getBlocks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const blocks = await UserBlockModel.find({ blockerId: userId }).lean().exec();
      const blockedIds = blocks.map((block) => String(block.blockedId));
      const userMap = await this.buildUserSummaryMap(blockedIds);

      const users = blockedIds
        .map((id) => userMap.get(id))
        .filter((entry) => entry)
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          username: entry.username,
          avatar: entry.avatar,
        }));

      res.json(successResponse({ blocks: users }));
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const targetUserId = req.body?.targetUserId
        ? String(req.body.targetUserId).trim()
        : undefined;
      const targetMessageId = req.body?.targetMessageId
        ? String(req.body.targetMessageId).trim()
        : undefined;
      const type = req.body?.type ? String(req.body.type).trim() : 'user';
      const reason = req.body?.reason ? String(req.body.reason).trim() : '';
      const details = req.body?.details ? String(req.body.details).trim() : undefined;

      if (!reason) {
        throw new ValidationError('reason is required', [
          { field: 'reason', message: 'reason is required', value: reason },
        ]);
      }

      if (!targetUserId && !targetMessageId) {
        throw new ValidationError('target is required', [
          {
            field: 'target',
            message: 'targetUserId or targetMessageId is required',
          },
        ]);
      }

      if (targetUserId === userId) {
        throw new ValidationError('Cannot report yourself', [
          { field: 'targetUserId', message: 'Cannot report yourself', value: targetUserId },
        ]);
      }

      const report = await UserReportModel.create({
        reporterId: userId,
        targetUserId,
        targetMessageId,
        type,
        reason,
        details,
        status: 'open',
      });

      res.json(successResponse({ report: this.mapReport(report.toObject()) }));
    } catch (error) {
      next(error);
    }
  }

  async getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const reports = await UserReportModel.find({ reporterId: userId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      res.json(successResponse({ reports: reports.map((report) => this.mapReport(report)) }));
    } catch (error) {
      next(error);
    }
  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = this.getUserId(req);
      const targetUserId = req.params.userId;

      const user = await UserModel.findById(targetUserId).select('name email avatar status').lean().exec();
      if (!user || (user as any).status === 'suspended') {
        throw new NotFoundError('User not found');
      }

      const profile = await UserProfileModel.findOne({ userId: targetUserId }).lean().exec();
      const privacy = (profile as any)?.privacy || {};
      const isBlocked = await UserBlockModel.findOne({
        $or: [
          { blockerId: currentUserId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: currentUserId },
        ],
      }).lean().exec();

      if (isBlocked) {
        res.json(successResponse({
          profile: { id: targetUserId, name: (user as any).name, avatar: (user as any).avatar, blocked: true },
        }));
        return;
      }

      const isFollowing = !!(await UserFollowModel.findOne({ followerId: currentUserId, followeeId: targetUserId }).lean().exec());
      const isFollower = !!(await UserFollowModel.findOne({ followerId: targetUserId, followeeId: currentUserId }).lean().exec());
      const isPublic = privacy.profilePublic !== false;

      const [followersCount, followingCount, ratingsCount, listsCount, recommendationsCount] = await Promise.all([
        UserFollowModel.countDocuments({ followeeId: targetUserId }).exec(),
        UserFollowModel.countDocuments({ followerId: targetUserId }).exec(),
        UserContentInteractionModel.countDocuments({ userId: targetUserId, rating: { $exists: true, $ne: null } }).exec(),
        UserListModel.countDocuments({ userId: targetUserId, visibility: 'public' }).exec(),
        UserActivityModel.countDocuments({ userId: targetUserId, type: 'recommendation' }).exec(),
      ]);

      const result: Record<string, unknown> = {
        id: targetUserId,
        name: (user as any).name,
        avatar: (user as any).avatar,
        isFollowing,
        isFollower,
        stats: { followers: followersCount, following: followingCount, ratings: ratingsCount, lists: listsCount, recommendations: recommendationsCount },
      };

      // A follower is the viewer who follows the profile owner.  The inverse
      // relationship (the owner follows the viewer) must not reveal private
      // profile fields.
      if (isPublic || isFollowing) {
        result.bio = (profile as any)?.bio || '';
        result.location = (profile as any)?.location || '';
        result.favoriteGenres = (profile as any)?.favoriteGenres || [];
        result.preferredPlatforms = (profile as any)?.preferredPlatforms || [];
      }

      res.json(successResponse({ profile: result }));
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = this.getUserId(req);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const limit = Math.min(Number(req.query.limit) || 20, 50);

      if (!q || q.length < 2) {
        res.json(successResponse({ users: [] }));
        return;
      }

      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const users = await UserModel.find({
        _id: { $ne: currentUserId },
        status: { $ne: 'suspended' },
        $or: [{ name: regex }, { email: regex }],
      })
        .select('name avatar')
        .limit(limit)
        .lean()
        .exec();

      const userIds = users.map((u: any) => String(u._id));
      const follows = await UserFollowModel.find({
        followerId: currentUserId,
        followeeId: { $in: userIds },
      }).select('followeeId').lean().exec();
      const followingSet = new Set(follows.map((f: any) => String(f.followeeId)));

      const results = users.map((u: any) => ({
        id: String(u._id),
        name: u.name,
        avatar: u.avatar,
        isFollowing: followingSet.has(String(u._id)),
      }));

      res.json(successResponse({ users: results }));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = this.getUserId(req);
      const targetUserId = req.params.userId || currentUserId;

      const [followersCount, followingCount, ratingsCount, listsCount, recommendationsCount, activitiesCount] = await Promise.all([
        UserFollowModel.countDocuments({ followeeId: targetUserId }).exec(),
        UserFollowModel.countDocuments({ followerId: targetUserId }).exec(),
        UserContentInteractionModel.countDocuments({ userId: targetUserId, rating: { $exists: true, $ne: null } }).exec(),
        UserListModel.countDocuments({ userId: targetUserId }).exec(),
        UserActivityModel.countDocuments({ userId: targetUserId, type: 'recommendation' }).exec(),
        UserActivityModel.countDocuments({ userId: targetUserId }).exec(),
      ]);

      res.json(successResponse({
        stats: {
          followers: followersCount,
          following: followingCount,
          ratings: ratingsCount,
          lists: listsCount,
          recommendations: recommendationsCount,
          activities: activitiesCount,
        },
      }));
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const activityId = req.params.id;

      const activity = await UserActivityModel.findById(activityId).lean().exec();
      if (!activity) {
        throw new NotFoundError('Activity not found');
      }

      const existing = await ActivityLikeModel.findOne({ activityId, userId }).lean().exec();
      if (existing) {
        await ActivityLikeModel.deleteOne({ activityId, userId }).exec();
      } else {
        await ActivityLikeModel.create({ activityId, userId });
      }

      const likes = await ActivityLikeModel.countDocuments({ activityId }).exec();
      res.json(successResponse({ liked: !existing, likes }));
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const activityId = req.params.id;
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

      if (!text || text.length > 1000) {
        res.status(400).json({ success: false, error: 'Comment text must be 1-1000 characters' });
        return;
      }

      const activity = await UserActivityModel.findById(activityId).lean().exec();
      if (!activity) {
        throw new NotFoundError('Activity not found');
      }

      const comment = await ActivityCommentModel.create({ activityId, userId, text });

      const user = await UserModel.findById(userId).select('name avatar').lean().exec();
      res.status(201).json(
        successResponse({
          comment: {
            id: String(comment._id),
            text: comment.text,
            createdAt: comment.createdAt,
            user: user ? { id: userId, name: (user as any).name, avatar: (user as any).avatar } : undefined,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.getUserId(req); // ensure authenticated
      const activityId = req.params.id;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;

      const comments = await ActivityCommentModel.find({ activityId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      const userIds = [...new Set(comments.map((c: any) => String(c.userId)))];
      const users = await UserModel.find({ _id: { $in: userIds } })
        .select('name avatar')
        .lean()
        .exec();
      const userMap = new Map(users.map((u: any) => [String(u._id), u]));

      const mapped = comments.map((c: any) => {
        const u = userMap.get(String(c.userId));
        return {
          id: String(c._id),
          text: c.text,
          createdAt: c.createdAt,
          user: u ? { id: String(c.userId), name: u.name, avatar: u.avatar } : undefined,
        };
      });

      res.json(successResponse({ comments: mapped }));
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

  private async resolveScope(userId: string, scope: ActivityScope): Promise<ScopeResolution> {
    const blockedIds = await this.getBlockedUserIds(userId);

    if (scope === 'me') {
      return {
        userIds: [userId],
        friendIds: new Set<string>(),
      };
    }

    const followingDocs = await UserFollowModel.find({ followerId: userId }).lean().exec();
    const followingIds = followingDocs
      .map((follow) => String(follow.followeeId))
      .filter((id) => !blockedIds.has(id));
    const followingSet = new Set(followingIds);

    const followersDocs = await UserFollowModel.find({ followeeId: userId }).lean().exec();
    const followersSet = new Set(
      followersDocs
        .map((follow) => String(follow.followerId))
        .filter((id) => !blockedIds.has(id))
    );

    const friendIds = new Set<string>();
    for (const id of followingSet) {
      if (followersSet.has(id)) {
        friendIds.add(id);
      }
    }

    if (scope === 'friends') {
      return {
        userIds: Array.from(friendIds),
        friendIds,
      };
    }

    return {
      userIds: [userId, ...Array.from(followingSet)],
      friendIds,
    };
  }

  private async getMutualFriendIds(userId: string): Promise<string[]> {
    const scopeData = await this.resolveScope(userId, 'friends');
    return scopeData.userIds;
  }

  private canViewActivity(
    requesterId: string,
    activityUserId: string,
    visibility: 'public' | 'friends' | 'private' | undefined,
    friendIds: Set<string>
  ): boolean {
    if (activityUserId === requesterId) {
      return true;
    }

    const effectiveVisibility = visibility || 'friends';
    if (effectiveVisibility === 'private') {
      return false;
    }
    if (effectiveVisibility === 'friends') {
      return friendIds.has(activityUserId);
    }
    return true;
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

  private async enrichActivitiesWithSocialCounts(
    activities: any[],
    currentUserId: string
  ): Promise<any[]> {
    if (!activities.length) return activities;

    const activityIds = activities.map((a) => a.id);

    const [likeCounts, commentCounts, myLikes] = await Promise.all([
      ActivityLikeModel.aggregate([
        { $match: { activityId: { $in: activityIds } } },
        { $group: { _id: '$activityId', count: { $sum: 1 } } },
      ]).exec(),
      ActivityCommentModel.aggregate([
        { $match: { activityId: { $in: activityIds } } },
        { $group: { _id: '$activityId', count: { $sum: 1 } } },
      ]).exec(),
      ActivityLikeModel.find({ activityId: { $in: activityIds }, userId: currentUserId })
        .select('activityId')
        .lean()
        .exec(),
    ]);

    const likeMap = new Map(likeCounts.map((r: any) => [r._id, r.count]));
    const commentMap = new Map(commentCounts.map((r: any) => [r._id, r.count]));
    const myLikeSet = new Set(myLikes.map((l: any) => l.activityId));

    return activities.map((a) => ({
      ...a,
      likes: likeMap.get(a.id) || 0,
      comments: commentMap.get(a.id) || 0,
      liked: myLikeSet.has(a.id),
    }));
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

  private mapFriend(user?: any, following: boolean = true) {
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
      following,
    };
  }

  private mapReport(report: any) {
    return {
      id: String(report._id),
      reporterId: String(report.reporterId),
      targetUserId: report.targetUserId ? String(report.targetUserId) : undefined,
      targetMessageId: report.targetMessageId
        ? String(report.targetMessageId)
        : undefined,
      type: report.type,
      reason: report.reason,
      details: report.details,
      status: report.status,
      resolutionNote: report.resolutionNote,
      resolvedBy: report.resolvedBy ? String(report.resolvedBy) : undefined,
      resolvedAt: report.resolvedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private async buildDeterministicRecommendations(
    userId: string,
    limit: number
  ): Promise<any[]> {
    const profile = await UserProfileModel.findOne({ userId }).lean().exec();
    const favoriteGenres = (profile?.favoriteGenres || []).map((genre: string) =>
      String(genre).toLowerCase()
    );

    const [favorites, listItems] = await Promise.all([
      UserFavoriteModel.find({ userId }).lean().exec(),
      UserListItemModel.find({ userId }).sort({ createdAt: -1 }).limit(30).lean().exec(),
    ]);

    const favoriteChannels = new Set(
      favorites
        .filter((favorite) => favorite.type === 'channel')
        .map((favorite) => String(favorite.itemId || '').toLowerCase())
        .filter(Boolean)
    );

    const interestTokens = new Set<string>();
    for (const item of listItems) {
      const tokens = String(item.title || '')
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length >= 4)
        .slice(0, 4);
      for (const token of tokens) interestTokens.add(token);
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + 36 * 60 * 60 * 1000);
    const programs = await ProgramModel.find({
      startTime: { $lt: horizon },
      endTime: { $gt: now },
    })
      .sort({ startTime: 1 })
      .limit(400)
      .lean()
      .exec();

    const scored = programs
      .map((program) => {
        let score = 0;
        const channelId = String(program.channelId || '').toLowerCase();
        const category = String(program.category || '').toLowerCase();
        const title = String(program.title || '').toLowerCase();

        if (favoriteChannels.has(channelId)) score += 45;
        if (favoriteGenres.some((genre) => category.includes(genre))) score += 20;
        for (const token of interestTokens) {
          if (title.includes(token)) {
            score += 8;
            break;
          }
        }
        if (category.includes('movie') || category.includes('pelicula')) {
          score += 10;
        }

        return { program, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || +new Date(a.program.startTime) - +new Date(b.program.startTime))
      .slice(0, limit);

    return scored.map((entry) => ({
      id: `auto-${entry.program.id}`,
      title: entry.program.title,
      type: 'program',
      note: 'Recomendación personalizada',
      tags: [entry.program.category || 'tv', 'for-you'],
      visibility: 'private',
      status: 'pending',
      rating: undefined,
      createdAt: now.toISOString(),
      mood: undefined,
      platform: entry.program.channelId,
      image: entry.program.image,
      likes: 0,
      comments: 0,
      score: entry.score,
      user: {
        id: 'system',
        name: 'GuiaTV',
        avatar: '/assets/gpt-avatar.png',
      },
    }));
  }
}
