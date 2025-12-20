import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../shared/types/ApiResponse';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { UserProfileModel } from '../../infrastructure/database/models/UserProfile.model';
import { UserListModel } from '../../infrastructure/database/models/UserList.model';
import { UserListItemModel } from '../../infrastructure/database/models/UserListItem.model';
import { UserFavoriteModel } from '../../infrastructure/database/models/UserFavorite.model';
import { UserActivityModel } from '../../infrastructure/database/models/UserActivity.model';
import { UserFollowModel } from '../../infrastructure/database/models/UserFollow.model';

const DEFAULT_PRIVACY = {
  profilePublic: true,
  shareActivity: true,
  shareWatchlist: true,
  showOnline: true,
  allowMessages: 'all' as const,
  publicLists: true,
};

const DEFAULT_NOTIFICATIONS = {
  recommendations: true,
  followers: true,
  weeklySummary: false,
  chatMessages: true,
  groupActivity: true,
};

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const userDoc = await UserModel.findById(userId).lean().exec();
      if (!userDoc) {
        throw new NotFoundError('User not found');
      }

      const profile = await this.ensureProfile(userId, userDoc);
      const stats = await this.getStats(userId);

      res.json(
        successResponse({
          profile: this.mapProfile(userDoc, profile, stats),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { name, username, bio, location, avatar } = req.body || {};

      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (username !== undefined) updates.username = String(username).trim();
      if (bio !== undefined) updates.bio = String(bio).trim();
      if (location !== undefined) updates.location = String(location).trim();
      if (avatar !== undefined) updates.avatar = String(avatar).trim();

      if (!Object.keys(updates).length) {
        throw new ValidationError('No fields to update', []);
      }

      if (updates.username && updates.username.length < 2) {
        throw new ValidationError('Username is too short', [
          { field: 'username', message: 'Minimum length is 2', value: updates.username },
        ]);
      }

      const userDoc = await UserModel.findById(userId).exec();
      if (!userDoc) {
        throw new NotFoundError('User not found');
      }

      const profile = await this.ensureProfile(userId, userDoc);
      profile.username = updates.username ?? profile.username;
      profile.bio = updates.bio ?? profile.bio;
      profile.location = updates.location ?? profile.location;
      if (updates.avatar) {
        profile.avatar = updates.avatar;
      }
      await profile.save();

      if (updates.name) {
        userDoc.name = updates.name;
      }
      if (updates.avatar) {
        (userDoc as any).picture = updates.avatar;
      }
      await userDoc.save();

      const stats = await this.getStats(userId);

      res.json(
        successResponse({
          profile: this.mapProfile(userDoc.toObject(), profile.toObject(), stats),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async updatePrivacy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await this.ensureProfileById(userId);
      profile.privacy = { ...DEFAULT_PRIVACY, ...(profile.privacy || {}), ...(req.body || {}) };
      await profile.save();

      res.json(successResponse({ privacy: profile.privacy }));
    } catch (error) {
      next(error);
    }
  }

  async updateNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const profile = await this.ensureProfileById(userId);
      profile.notifications = {
        ...DEFAULT_NOTIFICATIONS,
        ...(profile.notifications || {}),
        ...(req.body || {}),
      };
      await profile.save();

      res.json(successResponse({ notifications: profile.notifications }));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { title, mood, visibility } = req.body || {};
      if (!title) {
        throw new ValidationError('title is required', [
          { field: 'title', message: 'title is required', value: title },
        ]);
      }

      const profile = await this.ensureProfileById(userId);
      profile.watchingNow = {
        title: String(title).trim(),
        mood: mood ? String(mood).trim() : '',
        visibility: visibility || 'friends',
      };
      await profile.save();

      await UserActivityModel.create({
        userId,
        type: 'status',
        title: 'Nuevo estado',
        description: `Ahora viendo: ${profile.watchingNow.title}`,
        badge: profile.watchingNow.visibility === 'private' ? 'Privado' : 'Compartido',
        visibility: profile.watchingNow.visibility,
      });

      res.json(successResponse({ watchingNow: profile.watchingNow }));
    } catch (error) {
      next(error);
    }
  }

  async getLists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      await this.ensureDefaultList(userId);

      const lists = await UserListModel.find({ userId }).sort({ updatedAt: -1 }).lean().exec();
      res.json(successResponse({ lists: lists.map((list) => this.mapList(list)) }));
    } catch (error) {
      next(error);
    }
  }

  async createList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { title, description, visibility } = req.body || {};
      if (!title) {
        throw new ValidationError('title is required', [
          { field: 'title', message: 'title is required', value: title },
        ]);
      }

      const list = await UserListModel.create({
        userId,
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        visibility: visibility || 'private',
        itemsCount: 0,
      });

      await UserActivityModel.create({
        userId,
        type: 'list',
        title: 'Nueva lista creada',
        description: `Has creado la lista "${list.title}"`,
        badge: list.visibility === 'public' ? 'Publico' : list.visibility === 'friends' ? 'Amigos' : 'Privado',
      });

      res.json(successResponse({ list: this.mapList(list.toObject()) }));
    } catch (error) {
      next(error);
    }
  }

  async updateList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const updates: Record<string, any> = {};

      if (req.body?.title !== undefined) updates.title = String(req.body.title).trim();
      if (req.body?.description !== undefined) updates.description = String(req.body.description).trim();
      if (req.body?.visibility !== undefined) updates.visibility = req.body.visibility;
      if (req.body?.cover !== undefined) updates.cover = String(req.body.cover).trim();

      if (!Object.keys(updates).length) {
        throw new ValidationError('No fields to update', []);
      }

      const list = await UserListModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: updates },
        { new: true }
      )
        .lean()
        .exec();

      if (!list) {
        throw new NotFoundError('List not found');
      }

      res.json(successResponse({ list: this.mapList(list) }));
    } catch (error) {
      next(error);
    }
  }

  async deleteList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const list = await UserListModel.findOneAndDelete({ _id: id, userId }).lean().exec();
      if (!list) {
        throw new NotFoundError('List not found');
      }

      await UserListItemModel.deleteMany({ listId: id, userId });
      res.json(successResponse({ deleted: true }));
    } catch (error) {
      next(error);
    }
  }

  async getListItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const list = await UserListModel.findOne({ _id: id, userId }).lean().exec();
      if (!list) {
        throw new NotFoundError('List not found');
      }

      const items = await UserListItemModel.find({ listId: id, userId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      res.json(
        successResponse({
          list: this.mapList(list),
          items: items.map((item) => this.mapListItem(item)),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async addListItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const { title, type, state, contentId, poster, rating, mood } = req.body || {};
      if (!title) {
        throw new ValidationError('title is required', [
          { field: 'title', message: 'title is required', value: title },
        ]);
      }

      const list = await UserListModel.findOne({ _id: id, userId }).exec();
      if (!list) {
        throw new NotFoundError('List not found');
      }

      if (contentId) {
        const existing = await UserListItemModel.findOne({
          listId: id,
          userId,
          contentId: String(contentId),
        }).exec();
        if (existing) {
          if (state) existing.state = state;
          if (type) existing.type = type;
          if (poster !== undefined) existing.poster = String(poster).trim();
          if (rating !== undefined) existing.rating = Number(rating);
          if (mood !== undefined) existing.mood = String(mood).trim();
          await existing.save();

          res.json(
            successResponse({
              list: this.mapList(list.toObject()),
              item: this.mapListItem(existing.toObject()),
            })
          );
          return;
        }
      }

      const item = await UserListItemModel.create({
        userId,
        listId: id,
        contentId: contentId ? String(contentId) : undefined,
        title: String(title).trim(),
        type: type || 'program',
        state: state || 'pending',
        visibility: list.visibility,
        progress: 0,
        poster: poster ? String(poster).trim() : undefined,
        rating: rating !== undefined ? Number(rating) : undefined,
        mood: mood ? String(mood).trim() : undefined,
      });

      list.itemsCount = Math.max(0, (list.itemsCount || 0) + 1);
      await list.save();

      res.json(
        successResponse({
          list: this.mapList(list.toObject()),
          item: this.mapListItem(item.toObject()),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateListItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id, itemId } = req.params;
      const updates: Record<string, any> = {};

      if (req.body?.state !== undefined) updates.state = req.body.state;
      if (req.body?.progress !== undefined) updates.progress = Number(req.body.progress);
      if (req.body?.rating !== undefined) updates.rating = Number(req.body.rating);
      if (req.body?.mood !== undefined) updates.mood = String(req.body.mood).trim();
      if (req.body?.poster !== undefined) updates.poster = String(req.body.poster).trim();

      if (!Object.keys(updates).length) {
        throw new ValidationError('No fields to update', []);
      }

      const item = await UserListItemModel.findOneAndUpdate(
        { _id: itemId, listId: id, userId },
        { $set: updates },
        { new: true }
      )
        .lean()
        .exec();

      if (!item) {
        throw new NotFoundError('List item not found');
      }

      res.json(successResponse({ item: this.mapListItem(item) }));
    } catch (error) {
      next(error);
    }
  }

  async removeListItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id, itemId } = req.params;
      const list = await UserListModel.findOne({ _id: id, userId }).exec();
      if (!list) {
        throw new NotFoundError('List not found');
      }

      const deleted = await UserListItemModel.findOneAndDelete({
        _id: itemId,
        listId: id,
        userId,
      })
        .lean()
        .exec();
      if (!deleted) {
        throw new NotFoundError('List item not found');
      }

      list.itemsCount = Math.max(0, (list.itemsCount || 0) - 1);
      await list.save();

      res.json(successResponse({ deleted: true, list: this.mapList(list.toObject()) }));
    } catch (error) {
      next(error);
    }
  }

  async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { type } = req.query;
      const filters: Record<string, any> = { userId };
      if (type && typeof type === 'string') {
        filters.type = type;
      }
      const favorites = await UserFavoriteModel.find(filters).sort({ createdAt: -1 }).lean().exec();
      res.json(successResponse({ favorites: favorites.map((fav) => this.mapFavorite(fav)) }));
    } catch (error) {
      next(error);
    }
  }

  async addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { itemId, title, image, subtitle, type } = req.body || {};
      if (!title || !type) {
        throw new ValidationError('title and type are required', [
          { field: 'title', message: 'title is required', value: title },
          { field: 'type', message: 'type is required', value: type },
        ]);
      }

      const favorite = await UserFavoriteModel.create({
        userId,
        itemId: itemId ? String(itemId) : undefined,
        title: String(title).trim(),
        image: image ? String(image).trim() : undefined,
        subtitle: subtitle ? String(subtitle).trim() : undefined,
        type,
      });

      res.json(successResponse({ favorite: this.mapFavorite(favorite.toObject()) }));
    } catch (error) {
      next(error);
    }
  }

  async removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const favorite = await UserFavoriteModel.findOneAndDelete({ _id: id, userId }).lean().exec();
      if (!favorite) {
        throw new NotFoundError('Favorite not found');
      }
      res.json(successResponse({ deleted: true }));
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

  private async ensureProfile(userId: string, userDoc: any) {
    const existing = await UserProfileModel.findOne({ userId }).exec();
    if (existing) return existing;

    const emailPrefix = userDoc.email?.split('@')[0] || `user${String(userId).slice(-4)}`;
    const created = await UserProfileModel.create({
      userId,
      username: emailPrefix,
      avatar: userDoc.picture || '/assets/gpt-avatar.png',
      bio: 'Comparte tus pelis y series favoritas.',
      location: '-',
      privacy: DEFAULT_PRIVACY,
      notifications: DEFAULT_NOTIFICATIONS,
      watchingNow: {
        title: '',
        mood: '',
        visibility: 'friends',
      },
    });
    return created;
  }

  private async ensureProfileById(userId: string) {
    const userDoc = await UserModel.findById(userId).lean().exec();
    if (!userDoc) {
      throw new NotFoundError('User not found');
    }
    return this.ensureProfile(userId, userDoc);
  }

  private async ensureDefaultList(userId: string): Promise<void> {
    const existing = await UserListModel.findOne({ userId, isDefault: true }).lean().exec();
    if (existing) return;

    await UserListModel.create({
      userId,
      title: 'Pendientes de ver',
      description: 'Lista por defecto para guardar lo que quieres ver.',
      visibility: 'private',
      isDefault: true,
      itemsCount: 0,
    });
  }

  private async getStats(userId: string) {
    const [followers, following, listsCreated, watchlist, recommendations] = await Promise.all([
      UserFollowModel.countDocuments({ followeeId: userId }),
      UserFollowModel.countDocuments({ followerId: userId }),
      UserListModel.countDocuments({ userId }),
      UserListItemModel.countDocuments({ userId }),
      UserActivityModel.countDocuments({ userId, type: 'recommendation' }),
    ]);

    return {
      followers,
      following,
      listsCreated,
      recommendations,
      watchlist,
      ratings: 0,
    };
  }

  private mapProfile(userDoc: any, profile: any, stats: any) {
    return {
      id: String(userDoc._id || userDoc.id),
      name: userDoc.name || profile.username,
      username: profile.username,
      email: userDoc.email,
      avatar: profile.avatar || userDoc.picture || '/assets/gpt-avatar.png',
      role: userDoc.role,
      bio: profile.bio || '',
      location: profile.location || '-',
      favoriteGenres: profile.favoriteGenres || [],
      watchingNow: profile.watchingNow || { title: '', mood: '', visibility: 'friends' },
      privacy: profile.privacy || DEFAULT_PRIVACY,
      notifications: profile.notifications || DEFAULT_NOTIFICATIONS,
      stats,
    };
  }

  private mapList(list: any) {
    return {
      id: String(list._id),
      title: list.title,
      description: list.description || '',
      itemsCount: list.itemsCount || 0,
      visibility: list.visibility,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      cover: list.cover,
      isDefault: list.isDefault || false,
    };
  }

  private mapListItem(item: any) {
    return {
      id: String(item._id),
      contentId: item.contentId,
      title: item.title,
      type: item.type,
      state: item.state,
      progress: item.progress || 0,
      mood: item.mood,
      visibility: item.visibility,
      poster: item.poster,
      rating: item.rating,
      addedAt: item.addedAt,
    };
  }

  private mapFavorite(fav: any) {
    return {
      id: String(fav._id),
      itemId: fav.itemId,
      title: fav.title,
      image: fav.image,
      subtitle: fav.subtitle,
      type: fav.type,
      createdAt: fav.createdAt,
    };
  }
}
