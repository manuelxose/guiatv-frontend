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
import { AuthSessionModel } from './models/AuthSession.model';
import { PasswordResetTokenModel } from './models/PasswordResetToken.model';
import { UserBlockModel } from './models/UserBlock.model';
import { UserReportModel } from './models/UserReport.model';
import { UserNotificationModel } from './models/UserNotification.model';
import { UserContentInteractionModel } from './models/UserContentInteraction.model';
import { UserAssistantConversationModel } from './models/UserAssistantConversation.model';
import { UserAssistantMemoryModel } from './models/UserAssistantMemory.model';
import { EPGSourceSnapshotModel } from './models/EPGSourceSnapshot.model';
import { TVProgramBrandModel } from './models/TVProgramBrand.model';
import { TVReadAiringModel } from './models/TVReadAiring.model';
import { MediaCatalogModel } from './models/MediaCatalogEntry.model';
import { FootballTeamModel } from '../sports/models/FootballTeam.model';
import { FootballCompetitionModel } from '../sports/models/FootballCompetition.model';
import { FootballBroadcastMappingModel } from '../sports/models/FootballBroadcastMapping.model';
import { AffiliateNetworkModel } from './models/AffiliateNetwork.model';
import { AffiliateMerchantModel } from './models/AffiliateMerchant.model';
import { AffiliateProgramModel } from './models/AffiliateProgram.model';
import { AffiliateOfferModel } from './models/AffiliateOffer.model';
import { AffiliatePlacementModel } from './models/AffiliatePlacement.model';
import { AdminOperationModel } from './models/AdminOperation.model';
import { AdminOperationalEventModel } from './models/AdminOperationalEvent.model';
import { ContentAttestationModel } from './models/ContentAttestation.model';
import { ContentEntityModel } from './models/ContentEntity.model';
import { ContentSlugModel } from './models/ContentSlug.model';
import { ContentTitleKeyModel } from './models/ContentTitleKey.model';
import { isContentEntitiesEnabled } from '../../shared/config/contentEntities';

/** New, empty collections: created only when the flag is on (2D-1). */
export const CONTENT_IDENTITY_RESOURCES = [
  { name: 'content_entities', model: ContentEntityModel },
  { name: 'content_slugs', model: ContentSlugModel },
  { name: 'content_title_keys', model: ContentTitleKeyModel },
  { name: 'content_attestations', model: ContentAttestationModel },
] as const;

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
    { name: 'user_blocks', model: UserBlockModel },
    { name: 'user_reports', model: UserReportModel },
    { name: 'user_notifications', model: UserNotificationModel },
    { name: 'user_content_interactions', model: UserContentInteractionModel },
    { name: 'user_assistant_conversations', model: UserAssistantConversationModel },
    { name: 'user_assistant_memory', model: UserAssistantMemoryModel },
    { name: 'epg_source_snapshots', model: EPGSourceSnapshotModel },
    { name: 'tv_program_brands', model: TVProgramBrandModel },
    { name: 'tv_read_airings', model: TVReadAiringModel },
    { name: 'media_catalog', model: MediaCatalogModel },
    { name: 'football_teams', model: FootballTeamModel },
    { name: 'football_competitions', model: FootballCompetitionModel },
    { name: 'football_broadcast_mappings', model: FootballBroadcastMappingModel },
    { name: 'chat_conversations', model: ChatConversationModel },
    { name: 'chat_messages', model: ChatMessageModel },
    { name: 'auth_sessions', model: AuthSessionModel },
    { name: 'password_reset_tokens', model: PasswordResetTokenModel },
    { name: 'analytics_sessions', model: AnalyticsSessionModel },
    { name: 'analytics_events', model: AnalyticsEventModel },
    { name: 'blog_posts', model: BlogPostModel },
    { name: 'affiliate_networks', model: AffiliateNetworkModel },
    { name: 'affiliate_merchants', model: AffiliateMerchantModel },
    { name: 'affiliate_programs', model: AffiliateProgramModel },
    { name: 'affiliate_offers', model: AffiliateOfferModel },
    { name: 'affiliate_placements', model: AffiliatePlacementModel },
    { name: 'admin_operations', model: AdminOperationModel },
    { name: 'admin_operational_events', model: AdminOperationalEventModel },
    ...(isContentEntitiesEnabled() ? CONTENT_IDENTITY_RESOURCES : []),
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
      // Create missing schema indexes; never drop. `syncIndexes()` dropped every index the schema
      // didn't declare, so an index built by hand off-peak (2D-2's airing entity index) vanished
      // at the next restart. Dropping or changing an index is an explicit migration.
      await model.createIndexes();
      logger.info(`Mongo indexes ensured`, { collection: name });
    } catch (error: any) {
      const message = String(error?.message || '');
      const duplicateIndexError =
        error?.code === 11000 ||
        message.includes('E11000') ||
        message.toLowerCase().includes('duplicate key');

      if (duplicateIndexError) {
        logger.warn(`Mongo indexes skipped due to duplicate data`, {
          collection: name,
          error: message,
        });
        continue;
      }

      // IndexOptionsConflict / IndexKeySpecsConflict: a schema index differs from the live one.
      // Keep the live index and boot; content identity writes refuse until it matches.
      if (error?.code === 85 || error?.code === 86) {
        logger.warn(`Mongo index differs from schema; kept as is`, { collection: name, error: message });
        continue;
      }

      logger.error(`Failed to sync indexes`, { collection: name, error });
      throw error;
    }
  }

  logger.info('Mongo collections/indexes ensured', { elapsedMs: Date.now() - start });
}
