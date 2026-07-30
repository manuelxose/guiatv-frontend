import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../shared/types/ApiResponse';
import { UserListModel } from '../../infrastructure/database/models/UserList.model';
import { UserListItemModel } from '../../infrastructure/database/models/UserListItem.model';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { UserProfileModel } from '../../infrastructure/database/models/UserProfile.model';

export class ListsPublicController {
  async getPublicLists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const lists = await UserListModel.find({
        visibility: 'public',
        itemsCount: { $gt: 0 },
        isDefault: { $ne: true },
      })
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      if (!lists.length) {
        res.json(successResponse({ lists: [], total: 0 }));
        return;
      }

      const listIds = lists.map((l) => l._id);
      const userIds = [...new Set(lists.map((l) => String(l.userId)))];

      // Fetch preview posters (top 4 per list)
      const itemsAgg = await UserListItemModel.aggregate([
        { $match: { listId: { $in: listIds }, poster: { $exists: true, $ne: '' } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$listId',
            posters: { $push: '$poster' },
          },
        },
        { $project: { _id: 1, posters: { $slice: ['$posters', 4] } } },
      ]).exec();
      const posterMap = new Map(itemsAgg.map((r: any) => [String(r._id), r.posters as string[]]));

      // Fetch user info
      const [users, profiles] = await Promise.all([
        UserModel.find({ _id: { $in: userIds } }).select('name email avatar').lean().exec(),
        UserProfileModel.find({ userId: { $in: userIds } }).select('userId username avatar').lean().exec(),
      ]);
      const profileMap = new Map(profiles.map((p: any) => [String(p.userId), p]));
      const userMap = new Map(
        users.map((u: any) => {
          const id = String(u._id);
          const profile = profileMap.get(id);
          return [
            id,
            {
              id,
              name: u.name || profile?.username || u.email?.split('@')[0] || 'Usuario',
              username: profile?.username || u.email?.split('@')[0] || '',
              avatar: profile?.avatar || u.picture || '/assets/gpt-avatar.png',
            },
          ];
        })
      );

      const total = await UserListModel.countDocuments({
        visibility: 'public',
        itemsCount: { $gt: 0 },
        isDefault: { $ne: true },
      }).exec();

      const mapped = lists.map((list) => {
        const id = String(list._id);
        const user = userMap.get(String(list.userId));
        return {
          id,
          title: list.title,
          description: list.description || '',
          itemsCount: list.itemsCount || 0,
          visibility: list.visibility,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
          cover: list.cover,
          previewPosters: posterMap.get(id) || [],
          user: user || null,
        };
      });

      res.json(successResponse({ lists: mapped, total }));
    } catch (error) {
      next(error);
    }
  }
}
