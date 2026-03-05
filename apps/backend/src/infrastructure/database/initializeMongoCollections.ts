import { logger } from '../../shared/utils/logger';
import { ProgramModel } from './models/Program.model';
import { ChannelModel } from './models/Channel.model';
import { ScheduleModel } from './models/Schedule.model';
import { UserModel } from './models/User.model';
import { AnalyticsSessionModel } from './models/AnalyticsSession.model';
import { AnalyticsEventModel } from './models/AnalyticsEvent.model';
import { BlogPostModel } from './models/BlogPost.model';
import { UserProfileModel } from './models/UserProfile.model';
import { UserListModel } from './models/UserList.model';
import { UserListItemModel } from './models/UserListItem.model';
import { UserFavoriteModel } from './models/UserFavorite.model';
import { UserActivityModel } from './models/UserActivity.model';
import { UserFollowModel } from './models/UserFollow.model';
import { ChatConversationModel } from './models/ChatConversation.model';
import { ChatMessageModel } from './models/ChatMessage.model';

/**
 * Ensure required Mongo collections exist and indexes are in place.
 * This runs at boot to avoid lazy collection/index creation in runtime traffic.
 */
export async function ensureMongoCollectionsAndIndexes(): Promise<void> {
  const start = Date.now();

  const resources = [
    { name: 'channels', model: ChannelModel },
    { name: 'programs', model: ProgramModel },
    { name: 'schedules', model: ScheduleModel },
    { name: 'users', model: UserModel },
    { name: 'user_profiles', model: UserProfileModel },
    { name: 'user_lists', model: UserListModel },
    { name: 'user_list_items', model: UserListItemModel },
    { name: 'user_favorites', model: UserFavoriteModel },
    { name: 'user_activities', model: UserActivityModel },
    { name: 'user_follows', model: UserFollowModel },
    { name: 'chat_conversations', model: ChatConversationModel },
    { name: 'chat_messages', model: ChatMessageModel },
    { name: 'analytics_sessions', model: AnalyticsSessionModel },
    { name: 'analytics_events', model: AnalyticsEventModel },
    { name: 'blog_posts', model: BlogPostModel },
  ] as const;

  for (const { name, model } of resources) {
    try {
      // Create collection if it does not exist (no-op if it already exists)
      await model.createCollection();
      logger.info(`Mongo collection ready`, { collection: name });
    } catch (error: any) {
      // Ignore "NamespaceExists" errors; log others
      if (error?.codeName !== 'NamespaceExists') {
        logger.warn(`Failed to create collection`, { collection: name, error });
      }
    }

    try {
      // Align indexes defined in the schema
      await model.syncIndexes();
      logger.info(`Mongo indexes synced`, { collection: name });
    } catch (error) {
      logger.error(`Failed to sync indexes`, { collection: name, error });
      throw error;
    }
  }

  logger.info('Mongo collections/indexes ensured', { elapsedMs: Date.now() - start });
}
