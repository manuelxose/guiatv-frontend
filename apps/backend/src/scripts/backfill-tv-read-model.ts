import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { ChannelModel } from '../infrastructure/database/models/Channel.model';
import { ProgramModel } from '../infrastructure/database/models/Program.model';
import { ScheduleModel } from '../infrastructure/database/models/Schedule.model';
import {
  buildProgramBrandKey,
  buildChannelIdentityMetadata,
  buildProgramTitleAliases,
  normalizeTvToken,
} from '../shared/utils/tvMetadata';
import { logger } from '../shared/utils/logger';

type ChannelPatch = {
  normalizedName?: string;
  aliases?: string[];
  sourceIds?: string[];
  type?: string;
  category?: string;
  order?: number;
  region?: string;
};

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
  );
}

function sameStringArray(left?: string[], right?: string[]): boolean {
  const a = unique(left || []);
  const b = unique(right || []);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function overlayChannelMeta(base: Record<string, any>, canonical?: ChannelPatch) {
  if (!canonical) {
    return base;
  }

  return {
    ...base,
    normalizedName: canonical.normalizedName || base.normalizedName,
    aliases: canonical.aliases?.length ? canonical.aliases : base.aliases,
    sourceIds: canonical.sourceIds?.length ? canonical.sourceIds : base.sourceIds,
    type: canonical.type || base.type,
    region: canonical.region || base.region,
    name: base.name || canonical.normalizedName || base.id,
  };
}

export async function backfillTvReadModel(): Promise<void> {
  await connectMongoDB();

  const canonicalChannels = new Map<string, ChannelPatch>();
  let channelUpdates = 0;
  let programUpdates = 0;
  let scheduleUpdates = 0;

  try {
    const channelDocs = await ChannelModel.find(
      {},
      'id name normalizedName aliases sourceIds type category country countryCode region order'
    )
      .lean()
      .exec();

    if (channelDocs.length) {
      const bulk = channelDocs.flatMap((doc: any) => {
        const metadata = buildChannelIdentityMetadata({
          name: doc.name,
          sourceId:
            Array.isArray(doc.sourceIds) && doc.sourceIds.length
              ? doc.sourceIds[0]
              : doc.id,
          country: doc.country,
          countryCode: doc.countryCode,
          region: doc.region,
        });

        const patch: ChannelPatch = {
          normalizedName: metadata.normalizedName,
          aliases: unique([...(doc.aliases || []), ...metadata.aliases]),
          sourceIds: unique([...(doc.sourceIds || []), ...metadata.sourceIds]),
          type: metadata.inferredType,
          category: metadata.inferredType,
          order: metadata.sortOrder,
          region:
            metadata.inferredType === 'Autonomico'
              ? doc.region || metadata.inferredRegion || doc.country
              : doc.region,
        };

        canonicalChannels.set(doc.id, patch);

        const needsUpdate =
          String(doc.normalizedName || '') !== String(patch.normalizedName || '') ||
          !sameStringArray(doc.aliases, patch.aliases) ||
          !sameStringArray(doc.sourceIds, patch.sourceIds) ||
          String(doc.type || '') !== String(patch.type || '') ||
          String(doc.category || '') !== String(patch.category || '') ||
          Number(doc.order || 0) !== Number(patch.order || 0) ||
          String(doc.region || '') !== String(patch.region || '');

        if (!needsUpdate) {
          return [];
        }

        channelUpdates += 1;
        return [
          {
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: patch },
            },
          },
        ];
      });

      if (bulk.length) {
        await ChannelModel.bulkWrite(bulk);
      }
    }

    const scheduleDocs = await ScheduleModel.find(
      {},
      'channelMeta channels'
    )
      .lean()
      .exec();

    if (scheduleDocs.length) {
      const bulk = scheduleDocs.flatMap((doc: any) => {
        const nextChannelMeta = (doc.channelMeta || []).map((entry: any) =>
          overlayChannelMeta(entry, canonicalChannels.get(entry?.id || entry?.channelId || ''))
        );

        const nextChannels = (doc.channels || []).map((entry: any) => ({
          ...entry,
          channel: overlayChannelMeta(
            entry?.channel || { id: entry?.channelId },
            canonicalChannels.get(entry?.channelId || entry?.channel?.id || '')
          ),
        }));

        const changed =
          JSON.stringify(doc.channelMeta || []) !== JSON.stringify(nextChannelMeta) ||
          JSON.stringify(doc.channels || []) !== JSON.stringify(nextChannels);

        if (!changed) {
          return [];
        }

        scheduleUpdates += 1;
        return [
          {
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: {
                  channelMeta: nextChannelMeta,
                  channels: nextChannels,
                },
              },
            },
          },
        ];
      });

      if (bulk.length) {
        await ScheduleModel.bulkWrite(bulk);
      }
    }

    const programCursor = ProgramModel.find(
      {},
      'title channelId startTime normalizedTitle titleAliases brandKey canonicalChannelId sourceFeed sourceProgrammeId'
    )
      .lean()
      .cursor();

    let batch: any[] = [];
    for await (const doc of programCursor as any) {
      const normalizedTitle = normalizeTvToken(doc.title, ' ');
      const titleAliases = buildProgramTitleAliases(doc.title);
      const brandKey = buildProgramBrandKey(doc.title);
      const canonicalChannelId = String(doc.canonicalChannelId || doc.channelId || '').trim() || undefined;
      const sourceFeed = String(doc.sourceFeed || 'legacy_epg').trim();
      const sourceProgrammeId =
        String(doc.sourceProgrammeId || '').trim() ||
        `${doc.channelId || canonicalChannelId || 'unknown'}|${doc.startTime ? new Date(doc.startTime).toISOString() : 'unknown'}|${doc.title || 'unknown'}`;
      const needsUpdate =
        String(doc.normalizedTitle || '') !== normalizedTitle ||
        !sameStringArray(doc.titleAliases, titleAliases) ||
        String(doc.brandKey || '') !== brandKey ||
        String(doc.canonicalChannelId || '') !== String(canonicalChannelId || '') ||
        String(doc.sourceFeed || '') !== sourceFeed ||
        String(doc.sourceProgrammeId || '') !== sourceProgrammeId;

      if (!needsUpdate) {
        continue;
      }

      programUpdates += 1;
      batch.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              normalizedTitle,
              titleAliases,
              brandKey,
              canonicalChannelId,
              sourceFeed,
              sourceProgrammeId,
            },
          },
        },
      });

      if (batch.length >= 1000) {
        await ProgramModel.bulkWrite(batch);
        batch = [];
      }
    }

    if (batch.length) {
      await ProgramModel.bulkWrite(batch);
    }

    logger.info('TV read model backfill completed', {
      channelUpdates,
      programUpdates,
      scheduleUpdates,
    });
  } finally {
    await disconnectMongoDB();
  }
}

if (require.main === module) {
  backfillTvReadModel()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('TV read model backfill failed', { error });
      process.exit(1);
    });
}
