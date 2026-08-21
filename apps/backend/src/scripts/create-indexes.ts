/**
 * Script to create efficient MongoDB indexes for program queries
 * Run with: npm run create-indexes
 */

import mongoose from 'mongoose';
import path from 'node:path';
import dotenv from 'dotenv';
import { logger } from '../shared/utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guiatv';

async function createIndexes() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const programsCollection = db.collection('programs');
    const tvReadAiringsCollection = db.collection('tv_read_airings');
    const tvProgramBrandsCollection = db.collection('tv_program_brands');
    const epgSnapshotsCollection = db.collection('epg_source_snapshots');
    const interactionsCollection = db.collection('user_content_interactions');
    const blogPostsCollection = db.collection('blog_posts');

    logger.info('Creating indexes for programs collection...');

    // 1. Compound index for date-based queries (most common)
    await programsCollection.createIndex(
      { startTime: 1, channelId: 1 },
      { name: 'idx_startTime_channelId', background: true }
    );
    logger.info('✅ Created index: idx_startTime_channelId');

    // 2. Index for channel + time range queries
    await programsCollection.createIndex(
      { channelId: 1, startTime: 1, endTime: 1 },
      { name: 'idx_channel_timeRange', background: true }
    );
    logger.info('✅ Created index: idx_channel_timeRange');

    // 3. Index for category filtering
    await programsCollection.createIndex(
      { category: 1, startTime: 1 },
      { name: 'idx_category_startTime', background: true }
    );
    logger.info('✅ Created index: idx_category_startTime');

    // 4. Index for "now playing" queries
    await programsCollection.createIndex(
      { channelId: 1, startTime: -1 },
      { name: 'idx_channel_startTime_desc', background: true }
    );
    logger.info('✅ Created index: idx_channel_startTime_desc');

    // Drop legacy auto-named tmdbId index if it exists before renaming
    try {
      await programsCollection.dropIndex('tmdbId_1');
      logger.info('Dropped legacy index: tmdbId_1');
    } catch {
      // Index doesn't exist, continue
    }
    await programsCollection.createIndex(
      { tmdbId: 1 },
      { name: 'idx_tmdbId', background: true, sparse: true }
    );
    logger.info('✅ Created index: idx_tmdbId');

    try { await programsCollection.dropIndex('normalizedTitle_1_startTime_-1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { normalizedTitle: 1, startTime: -1 },
      { name: 'idx_normalizedTitle_startTime', background: true }
    );
    logger.info('✅ Created index: idx_normalizedTitle_startTime');

    try { await programsCollection.dropIndex('titleAliases_1_startTime_-1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { titleAliases: 1, startTime: -1 },
      { name: 'idx_titleAliases_startTime', background: true }
    );
    logger.info('✅ Created index: idx_titleAliases_startTime');

    // 5. Overlap index for "now playing" range queries
    try { await programsCollection.dropIndex('startTime_1_endTime_1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { startTime: 1, endTime: 1 },
      { name: 'idx_overlap', background: true }
    );
    logger.info('✅ Created index: idx_overlap');

    // 6. Date + channel compound index for EPG day views
    try { await programsCollection.dropIndex('date_1_channelId_1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { date: 1, channelId: 1 },
      { name: 'idx_date_channel', background: true }
    );
    logger.info('✅ Created index: idx_date_channel');

    try { await programsCollection.dropIndex('date_1_canonicalChannelId_1_startTime_1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { date: 1, canonicalChannelId: 1, startTime: 1 },
      { name: 'idx_date_canonicalChannel_start', background: true }
    );
    logger.info('✅ Created index: idx_date_canonicalChannel_start');

    try { await programsCollection.dropIndex('brandKey_1_date_1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { brandKey: 1, date: 1 },
      { name: 'idx_brandKey_date', background: true, sparse: true }
    );
    logger.info('✅ Created index: idx_brandKey_date');

    try { await programsCollection.dropIndex('sourceFeed_1_sourceProgrammeId_1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { sourceFeed: 1, sourceProgrammeId: 1 },
      { name: 'idx_sourceFeed_sourceProgrammeId', background: true, sparse: true }
    );
    logger.info('✅ Created index: idx_sourceFeed_sourceProgrammeId');

    try { await programsCollection.dropIndex('sourceFeed_1_channelId_1_startTime_1'); } catch { /* not exists */ }
    await programsCollection.createIndex(
      { sourceFeed: 1, channelId: 1, startTime: 1 },
      { name: 'idx_sourceFeed_channel_start', background: true, sparse: true }
    );
    logger.info('✅ Created index: idx_sourceFeed_channel_start');

    logger.info('Creating indexes for user_assistant_conversations collection...');
    const conversationsCollection = db.collection('user_assistant_conversations');
    // Drop legacy auto-named indexes before renaming
    for (const legacyName of ['userId_1_lastUsedAt_-1', 'userId_1_pinned_-1_lastUsedAt_-1', 'conversationId_1', 'userId_1_archived_1']) {
      try { await conversationsCollection.dropIndex(legacyName); } catch { /* not exists */ }
    }
    await conversationsCollection.createIndex(
      { userId: 1, lastUsedAt: -1 }, { name: 'idx_conv_user_lastUsed', background: true }
    );
    await conversationsCollection.createIndex(
      { userId: 1, pinned: -1, lastUsedAt: -1 }, { name: 'idx_conv_user_pinned_lastUsed', background: true }
    );
    await conversationsCollection.createIndex(
      { conversationId: 1 }, { name: 'idx_conv_conversationId', unique: true, background: true }
    );
    await conversationsCollection.createIndex(
      { userId: 1, archived: 1 }, { name: 'idx_conv_user_archived', background: true }
    );
    logger.info('✅ Created user_assistant_conversations indexes');

    logger.info('Creating indexes for user_assistant_memory collection...');
    const memoryCollection = db.collection('user_assistant_memory');
    try { await memoryCollection.dropIndex('userId_1'); } catch { /* not exists */ }
    await memoryCollection.createIndex(
      { userId: 1 },
      { name: 'idx_memory_userId', unique: true, background: true }
    );
    logger.info('✅ Created user_assistant_memory indexes');

    logger.info('Creating indexes for user_content_interactions collection...');
    const interactionIndexDefs: Array<{ legacy: string; key: Record<string, number>; name: string; unique?: boolean }> = [
      { legacy: 'userId_1_contentId_1', key: { userId: 1, contentId: 1 }, name: 'idx_user_content_unique', unique: true },
      { legacy: 'userId_1_contentType_1', key: { userId: 1, contentType: 1 }, name: 'idx_user_content_type' },
      { legacy: 'userId_1_status_1', key: { userId: 1, status: 1 }, name: 'idx_user_status' },
      { legacy: 'userId_1_genres_1', key: { userId: 1, genres: 1 }, name: 'idx_user_genres' },
      { legacy: 'userId_1_rating_-1', key: { userId: 1, rating: -1 }, name: 'idx_user_rating' },
      { legacy: 'userId_1_updatedAt_-1', key: { userId: 1, updatedAt: -1 }, name: 'idx_user_updated' },
      { legacy: 'contentId_1', key: { contentId: 1 }, name: 'idx_content_id' },
    ];
    for (const def of interactionIndexDefs) {
      try { await interactionsCollection.dropIndex(def.legacy); } catch { /* not exists */ }
      await interactionsCollection.createIndex(
        def.key,
        { name: def.name, background: true, ...(def.unique ? { unique: true } : {}) }
      );
    }
    logger.info('✅ Created interaction indexes');

    logger.info('Creating indexes for channels collection...');
    const channelsCollection = db.collection('channels');
    try { await channelsCollection.dropIndex('normalizedName_1_active_1'); } catch { /* not exists */ }
    await channelsCollection.createIndex(
      { normalizedName: 1, active: 1 },
      { name: 'idx_channels_normalizedName_active', background: true }
    );
    try { await channelsCollection.dropIndex('aliases_1_active_1'); } catch { /* not exists */ }
    await channelsCollection.createIndex(
      { aliases: 1, active: 1 },
      { name: 'idx_channels_aliases_active', background: true }
    );
    try { await channelsCollection.dropIndex('sourceIds_1_active_1'); } catch { /* not exists */ }
    await channelsCollection.createIndex(
      { sourceIds: 1, active: 1 },
      { name: 'idx_channels_sourceIds_active', background: true }
    );
    logger.info('✅ Created channel canonical indexes');

    logger.info('Creating indexes for tv_program_brands collection...');
    try { await tvProgramBrandsCollection.dropIndex('brandKey_1'); } catch { /* not exists */ }
    await tvProgramBrandsCollection.createIndex(
      { brandKey: 1 },
      { name: 'idx_tvbrands_brandKey', unique: true, background: true }
    );
    try { await tvProgramBrandsCollection.dropIndex('normalizedTitle_1'); } catch { /* not exists */ }
    await tvProgramBrandsCollection.createIndex(
      { normalizedTitle: 1 },
      { name: 'idx_tvbrands_normalizedTitle', background: true }
    );
    try { await tvProgramBrandsCollection.dropIndex('titleAliases_1'); } catch { /* not exists */ }
    await tvProgramBrandsCollection.createIndex(
      { titleAliases: 1 },
      { name: 'idx_tvbrands_titleAliases', background: true }
    );
    logger.info('✅ Created tv_program_brands indexes');

    logger.info('Creating indexes for tv_read_airings collection...');
    try { await tvReadAiringsCollection.dropIndex('date_1_channel.group_1_airing.timeSlotKey_1_channel.sortOrder_1'); } catch { /* not exists */ }
    await tvReadAiringsCollection.createIndex(
      { date: 1, 'channel.group': 1, 'airing.timeSlotKey': 1, 'channel.sortOrder': 1 },
      { name: 'idx_tvread_date_group_timeslot_sort', background: true }
    );
    try { await tvReadAiringsCollection.dropIndex('date_1_airing.liveNow_1_channel.group_1_channel.sortOrder_1'); } catch { /* not exists */ }
    try { await tvReadAiringsCollection.dropIndex('idx_tvread_date_live_group_sort'); } catch { /* not exists */ }
    await tvReadAiringsCollection.createIndex(
      { date: 1, 'channel.group': 1, 'channel.sortOrder': 1, 'airing.start': 1 },
      { name: 'idx_tvread_date_group_sort_start', background: true }
    );
    await tvReadAiringsCollection.createIndex(
      { date: 1, 'channel.sortOrder': 1, 'airing.start': 1 },
      { name: 'idx_tvread_date_sort_start', background: true }
    );
    await tvReadAiringsCollection.createIndex(
      { date: 1, 'airing.partOfDay': 1, 'channel.sortOrder': 1, 'airing.start': 1 },
      { name: 'idx_tvread_date_partofday_sort_start', background: true }
    );
    await tvReadAiringsCollection.createIndex(
      { date: 1, 'airing.start': 1, 'airing.end': 1 },
      { name: 'idx_tvread_date_airing_window', background: true }
    );
    try { await tvReadAiringsCollection.dropIndex('channel.id_1_date_1_airing.start_1'); } catch { /* not exists */ }
    await tvReadAiringsCollection.createIndex(
      { 'channel.id': 1, date: 1, 'airing.start': 1 },
      { name: 'idx_tvread_channel_date_start', background: true }
    );
    try { await tvReadAiringsCollection.dropIndex('program.brandKey_1_date_1_airing.start_1'); } catch { /* not exists */ }
    await tvReadAiringsCollection.createIndex(
      { 'program.brandKey': 1, date: 1, 'airing.start': 1 },
      { name: 'idx_tvread_brand_date_start', background: true }
    );
    try { await tvReadAiringsCollection.dropIndex('searchTokens_1_date_1'); } catch { /* not exists */ }
    await tvReadAiringsCollection.createIndex(
      { searchTokens: 1, date: 1 },
      { name: 'idx_tvread_search_tokens', background: true }
    );
    await tvReadAiringsCollection.createIndex(
      { 'program.sportFacet': 1, date: 1, 'airing.start': 1 },
      { name: 'idx_tvread_sport_date_start', background: true }
    );
    await tvReadAiringsCollection.createIndex(
      { 'program.editorialCategory': 1, date: 1, 'airing.start': 1 },
      { name: 'idx_tvread_category_date_start', background: true }
    );
    logger.info('✅ Created tv_read_airings indexes');

    logger.info('Creating indexes for epg_source_snapshots collection...');
    try { await epgSnapshotsCollection.dropIndex('sourceKey_1_date_1'); } catch { /* not exists */ }
    await epgSnapshotsCollection.createIndex(
      { sourceKey: 1, date: 1 },
      { name: 'idx_epg_snapshots_source_date', background: true }
    );
    try { await epgSnapshotsCollection.dropIndex('payloadHash_1'); } catch { /* not exists */ }
    await epgSnapshotsCollection.createIndex(
      { payloadHash: 1 },
      { name: 'idx_epg_snapshots_payloadHash', background: true }
    );
    logger.info('✅ Created epg_source_snapshots indexes');

    logger.info('Creating indexes for blog_posts collection...');
    await blogPostsCollection.createIndex(
      { status: 1, featured: -1, publishedAt: -1, createdAt: -1 },
      { name: 'idx_blog_public_featured_published', background: true }
    );
    await blogPostsCollection.createIndex(
      { status: 1, contentType: 1, featured: -1, publishedAt: -1 },
      { name: 'idx_blog_public_type_featured', background: true }
    );
    await blogPostsCollection.createIndex(
      { status: 1, 'categories.slug': 1, featured: -1, publishedAt: -1 },
      { name: 'idx_blog_public_category_featured', background: true }
    );
    logger.info('✅ Created blog_posts indexes');

    // List all indexes
    const indexes = await programsCollection.indexes();
    logger.info('Current indexes on programs collection:');
    indexes.forEach((index) => {
      logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    logger.info('✅ All indexes created successfully!');
  } catch (error:any) {
    logger.error('Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run if executed directly
if (require.main === module) {
  createIndexes()
    .then(() => {
      logger.info('Index creation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Index creation failed:', error);
      process.exit(1);
    });
}

export { createIndexes };
