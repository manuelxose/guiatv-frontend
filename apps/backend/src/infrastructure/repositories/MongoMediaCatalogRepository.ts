import {
  computeNormalizedIdentity,
  MediaCatalogEntry,
  MediaContentType,
} from '@/domain/entities/MediaCatalogEntry';
import {
  IMediaCatalogRepository,
  MediaCatalogUpsertInput,
} from '@/domain/repositories/IMediaCatalogRepository';
import {
  IMediaCatalogDocument,
  MediaCatalogModel,
} from '../database/models/MediaCatalogEntry.model';
import { normalizeTvToken } from '@/shared/utils/tvMetadata';
import { logger } from '@/shared/utils/logger';

type MediaCatalogDoc = Partial<IMediaCatalogDocument> & Record<string, any>;

const repoLogger = logger.child('MongoMediaCatalogRepository');

/** Mongo duplicate-key error code, used to detect (and recover from) a race
 * between two concurrent upserts for the same identity. */
const DUPLICATE_KEY_ERROR_CODE = 11000;

export class MongoMediaCatalogRepository implements IMediaCatalogRepository {
  async findById(id: string): Promise<MediaCatalogEntry | null> {
    try {
      const doc = await MediaCatalogModel.findById(id).lean().exec();
      return doc ? this.toEntity(doc as MediaCatalogDoc) : null;
    } catch (error) {
      repoLogger.warn('findById failed', { id, error: (error as Error).message });
      return null;
    }
  }

  async findByTmdbId(
    tmdbType: 'movie' | 'tv',
    tmdbId: number
  ): Promise<MediaCatalogEntry | null> {
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;
    try {
      const doc = await MediaCatalogModel.findOne({ tmdbType, tmdbId }).lean().exec();
      return doc ? this.toEntity(doc as MediaCatalogDoc) : null;
    } catch (error) {
      repoLogger.warn('findByTmdbId failed', { tmdbType, tmdbId, error: (error as Error).message });
      return null;
    }
  }

  async findManyByTmdbIds(
    tmdbType: 'movie' | 'tv',
    tmdbIds: number[]
  ): Promise<MediaCatalogEntry[]> {
    const ids = tmdbIds.filter((id) => Number.isFinite(id) && id > 0);
    if (!ids.length) return [];
    try {
      const docs = await MediaCatalogModel.find({ tmdbType, tmdbId: { $in: ids } })
        .lean()
        .exec();
      return (docs as MediaCatalogDoc[]).map((doc) => this.toEntity(doc));
    } catch (error) {
      repoLogger.warn('findManyByTmdbIds failed', { tmdbType, count: ids.length, error: (error as Error).message });
      return [];
    }
  }

  async findByNormalizedIdentity(identity: string): Promise<MediaCatalogEntry | null> {
    if (!identity) return null;
    try {
      const doc = await MediaCatalogModel.findOne({ normalizedIdentity: identity }).lean().exec();
      return doc ? this.toEntity(doc as MediaCatalogDoc) : null;
    } catch (error) {
      repoLogger.warn('findByNormalizedIdentity failed', { identity, error: (error as Error).message });
      return null;
    }
  }

  async findByNormalizedTitles(normalizedTitles: string[]): Promise<MediaCatalogEntry[]> {
    const titles = Array.from(new Set(normalizedTitles.filter(Boolean)));
    if (!titles.length) return [];
    try {
      const docs = await MediaCatalogModel.find({ normalizedTitle: { $in: titles } })
        .lean()
        .exec();
      return (docs as MediaCatalogDoc[]).map((doc) => this.toEntity(doc));
    } catch (error) {
      repoLogger.warn('findByNormalizedTitles failed', { count: titles.length, error: (error as Error).message });
      return [];
    }
  }

  async upsert(input: MediaCatalogUpsertInput): Promise<MediaCatalogEntry> {
    const normalizedTitle = normalizeTvToken(input.title, ' ');
    const normalizedIdentity = computeNormalizedIdentity(
      input.contentType,
      normalizedTitle,
      input.year
    );

    // Build a sparse $set: only fields the caller actually knows about, so a
    // lightweight EPG/search write never blanks out richer TMDB-fetched data.
    const set: Record<string, unknown> = {
      contentType: input.contentType,
      title: input.title,
      normalizedTitle,
      normalizedIdentity,
      metadataSource: input.metadataSource,
    };
    if (input.tmdbId !== undefined) set.tmdbId = input.tmdbId;
    if (input.tmdbType !== undefined) set.tmdbType = input.tmdbType;
    if (input.originalTitle !== undefined) set.originalTitle = input.originalTitle;
    if (input.canonicalGenres !== undefined) set.canonicalGenres = input.canonicalGenres;
    if (input.tmdbGenres !== undefined) set.tmdbGenres = input.tmdbGenres;
    if (input.synopsis !== undefined) set.synopsis = input.synopsis;
    if (input.year !== undefined) set.year = input.year;
    if (input.runtimeMinutes !== undefined) set.runtimeMinutes = input.runtimeMinutes;
    if (input.rating !== undefined) set.rating = input.rating;
    if (input.voteCount !== undefined) set.voteCount = input.voteCount;
    if (input.posterPath !== undefined) set.posterPath = input.posterPath;
    if (input.backdropPath !== undefined) set.backdropPath = input.backdropPath;
    if (input.castSummary !== undefined) set.castSummary = input.castSummary;
    if (input.directors !== undefined) set.directors = input.directors;
    if (input.markEnrichedNow) set.lastEnrichedAt = new Date();

    const filter = input.tmdbId
      ? { tmdbType: input.tmdbType, tmdbId: input.tmdbId }
      : { normalizedIdentity };

    try {
      const doc = await MediaCatalogModel.findOneAndUpdate(
        filter,
        { $set: set },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .lean()
        .exec();
      return this.toEntity(doc as MediaCatalogDoc);
    } catch (error) {
      // A concurrent upsert can race past the findOneAndUpdate's own atomicity
      // guarantee only when two different filters (tmdbId vs normalizedIdentity)
      // resolve to the same logical entity for the first time; recover by
      // re-reading rather than failing the caller.
      const isDuplicateKey = (error as { code?: number })?.code === DUPLICATE_KEY_ERROR_CODE;
      if (isDuplicateKey) {
        const existing = input.tmdbId
          ? await this.findByTmdbId(input.tmdbType as 'movie' | 'tv', input.tmdbId)
          : await this.findByNormalizedIdentity(normalizedIdentity);
        if (existing) return existing;
      }
      repoLogger.error('upsert failed', { title: input.title, tmdbId: input.tmdbId, error: (error as Error).message });
      throw error;
    }
  }

  async findStale(olderThan: Date, limit: number): Promise<MediaCatalogEntry[]> {
    try {
      const docs = await MediaCatalogModel.find({
        $or: [
          { lastEnrichedAt: { $exists: false } },
          { lastEnrichedAt: { $lt: olderThan } },
        ],
        tmdbId: { $exists: true, $ne: null },
      })
        .limit(Math.max(1, limit))
        .lean()
        .exec();
      return (docs as MediaCatalogDoc[]).map((doc) => this.toEntity(doc));
    } catch (error) {
      repoLogger.warn('findStale failed', { error: (error as Error).message });
      return [];
    }
  }

  async countAll(): Promise<number> {
    try {
      return await MediaCatalogModel.countDocuments().exec();
    } catch (error) {
      repoLogger.warn('countAll failed', { error: (error as Error).message });
      return 0;
    }
  }

  private toEntity(doc: MediaCatalogDoc): MediaCatalogEntry {
    return MediaCatalogEntry.create({
      id: String(doc._id),
      tmdbId: typeof doc.tmdbId === 'number' ? doc.tmdbId : undefined,
      tmdbType: doc.tmdbType,
      contentType: doc.contentType as MediaContentType,
      title: doc.title as string,
      normalizedTitle: doc.normalizedTitle as string,
      originalTitle: doc.originalTitle,
      normalizedIdentity: doc.normalizedIdentity as string,
      canonicalGenres: Array.isArray(doc.canonicalGenres) ? doc.canonicalGenres : [],
      tmdbGenres: Array.isArray(doc.tmdbGenres) ? doc.tmdbGenres : [],
      synopsis: doc.synopsis,
      year: doc.year,
      runtimeMinutes: doc.runtimeMinutes,
      rating: doc.rating,
      voteCount: doc.voteCount,
      posterPath: doc.posterPath,
      backdropPath: doc.backdropPath,
      castSummary: Array.isArray(doc.castSummary) ? doc.castSummary : [],
      directors: Array.isArray(doc.directors) ? doc.directors : [],
      metadataSource: doc.metadataSource || 'epg',
      lastEnrichedAt: doc.lastEnrichedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
