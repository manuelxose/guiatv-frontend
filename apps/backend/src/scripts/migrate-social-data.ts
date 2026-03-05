import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { UserFavoriteModel } from '../infrastructure/database/models/UserFavorite.model';
import { UserListItemModel } from '../infrastructure/database/models/UserListItem.model';
import { ChatConversationModel } from '../infrastructure/database/models/ChatConversation.model';
import { ChatMessageModel } from '../infrastructure/database/models/ChatMessage.model';
import { logger } from '../shared/utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dryRun =
  process.argv.includes('--dry-run') ||
  (!process.argv.includes('--apply') &&
    process.env.SOCIAL_MIGRATION_APPLY !== '1' &&
    process.env.SOCIAL_MIGRATION_APPLY !== 'true');

interface MigrationStats {
  favoritesDuplicates: number;
  listItemDuplicates: number;
  conversationsMerged: number;
  pairKeysPatched: number;
  messagesReassigned: number;
}

function normalizeKey(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function buildPairKey(participants: Array<string>): string {
  return participants.map((id) => String(id)).sort().join(':');
}

async function dedupeFavorites(stats: MigrationStats): Promise<void> {
  const favorites = await UserFavoriteModel.find({})
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  const keepByKey = new Map<string, string>();
  const deleteIds: string[] = [];

  for (const favorite of favorites) {
    const itemToken = normalizeKey(favorite.itemId);
    const key = itemToken
      ? `${favorite.userId}|${favorite.type}|${itemToken}`
      : `${favorite.userId}|${favorite.type}|${normalizeKey(favorite.title)}`;
    const id = String(favorite._id);

    if (!keepByKey.has(key)) {
      keepByKey.set(key, id);
      continue;
    }

    deleteIds.push(id);
  }

  stats.favoritesDuplicates = deleteIds.length;
  if (deleteIds.length && !dryRun) {
    await UserFavoriteModel.deleteMany({ _id: { $in: deleteIds } }).exec();
  }
}

async function dedupeListItems(stats: MigrationStats): Promise<void> {
  const items = await UserListItemModel.find({
    contentId: { $exists: true, $type: 'string', $ne: '' },
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const keepByKey = new Map<string, string>();
  const deleteIds: string[] = [];

  for (const item of items) {
    const key = `${item.listId}|${normalizeKey(item.contentId)}`;
    const id = String(item._id);
    if (!keepByKey.has(key)) {
      keepByKey.set(key, id);
      continue;
    }
    deleteIds.push(id);
  }

  stats.listItemDuplicates = deleteIds.length;
  if (deleteIds.length && !dryRun) {
    await UserListItemModel.deleteMany({ _id: { $in: deleteIds } }).exec();
  }
}

async function dedupeConversations(stats: MigrationStats): Promise<void> {
  const conversations = await ChatConversationModel.find({})
    .sort({ updatedAt: -1 })
    .lean()
    .exec();

  const keepByPair = new Map<string, string>();

  for (const conversation of conversations) {
    const participants = (conversation.participants || []).map((participant) =>
      String(participant)
    );
    if (participants.length !== 2 || conversation.isGroup) {
      continue;
    }

    const pairKey = buildPairKey(participants);
    const conversationId = String(conversation._id);

    if (!conversation.pairKey || conversation.pairKey !== pairKey) {
      stats.pairKeysPatched += 1;
      if (!dryRun) {
        await ChatConversationModel.updateOne(
          { _id: conversation._id },
          { $set: { pairKey, isGroup: false } }
        ).exec();
      }
    }

    if (!keepByPair.has(pairKey)) {
      keepByPair.set(pairKey, conversationId);
      continue;
    }

    const keepId = keepByPair.get(pairKey)!;
    stats.conversationsMerged += 1;

    if (!dryRun) {
      const reassigned = await ChatMessageModel.updateMany(
        { conversationId: conversation._id },
        { $set: { conversationId: new mongoose.Types.ObjectId(keepId) } }
      ).exec();
      stats.messagesReassigned += reassigned.modifiedCount;
      await ChatConversationModel.deleteOne({ _id: conversation._id }).exec();
    }
  }
}

async function main(): Promise<void> {
  const stats: MigrationStats = {
    favoritesDuplicates: 0,
    listItemDuplicates: 0,
    conversationsMerged: 0,
    pairKeysPatched: 0,
    messagesReassigned: 0,
  };

  logger.info('Starting social migration', { dryRun });
  await connectMongoDB();

  await dedupeFavorites(stats);
  await dedupeListItems(stats);
  await dedupeConversations(stats);

  logger.info('Social migration completed', {
    dryRun,
    stats,
  });

  await disconnectMongoDB();
}

main().catch(async (error) => {
  logger.error('Social migration failed', { error });
  await disconnectMongoDB();
  process.exit(1);
});
