// Backfill/migration: seeds the local media catalog (`media_catalog`) from
// TMDB ids already known to the system (Program rows enriched by prior EPG
// syncs, and any TVProgramBrand rows), then back-references matching Program
// airings via `mediaId`.
//
// Deliberately does NOT call TMDB by default — it only reuses metadata this
// system has already fetched at some point, per "don't import all of TMDB".
// Pass --full to additionally fetch full TMDB details (cast/runtime/genres)
// for entries that only have the lightweight fields, in small rate-limited
// batches; omit it to seed identity only and let the normal lazy layered
// lookup (MediaCatalogService.getDetail) fill in the rest on first real access.
//
// Idempotent: safe to re-run. Upserts are deduped by TMDB id.
//
// Usage:
//   node dist/scripts/backfill-media-catalog.js [--full] [--limit=5000] [--dry-run]

import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { ProgramModel } from '../infrastructure/database/models/Program.model';
import { TVProgramBrandModel } from '../infrastructure/database/models/TVProgramBrand.model';
import { MongoMediaCatalogRepository } from '../infrastructure/repositories/MongoMediaCatalogRepository';
import { MediaCatalogService } from '../application/services/MediaCatalogService';
import { TMDBService } from '../infrastructure/external/TMDBService';
import { logger } from '../shared/utils/logger';

const scriptLogger = logger.child('backfill-media-catalog');

interface BackfillOptions {
  full: boolean;
  limit: number;
  dryRun: boolean;
}

interface CandidateEntry {
  tmdbId: number;
  tmdbType: 'movie' | 'tv';
  title: string;
  genreTags: string[];
  synopsis?: string;
  year?: string;
  rating?: number;
  posterPath?: string;
}

function parseArgs(argv: string[]): BackfillOptions {
  const full = argv.includes('--full');
  const dryRun = argv.includes('--dry-run');
  const limitArg = argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) || 5000 : 5000;
  return { full, limit, dryRun };
}

/** Best-effort content type inference from the same signals SyncEPGData uses. */
function inferTmdbType(genre?: string, editorialCategory?: string): 'movie' | 'tv' {
  const value = `${genre || ''} ${editorialCategory || ''}`.toLowerCase();
  if (value.includes('cine') || value.includes('película') || value.includes('pelicula')) {
    return 'movie';
  }
  return 'tv';
}

async function collectCandidatesFromPrograms(limit: number): Promise<Map<number, CandidateEntry>> {
  const candidates = new Map<number, CandidateEntry>();

  const docs = await ProgramModel.find(
    { tmdbId: { $exists: true, $ne: null } },
    {
      tmdbId: 1,
      title: 1,
      category: 1,
      genreTags: 1,
      description: 1,
      year: 1,
      rating: 1,
      image: 1,
      updatedAt: 1,
      _id: 0,
    }
  )
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  for (const doc of docs as any[]) {
    const tmdbId = Number(doc.tmdbId);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0 || candidates.has(tmdbId)) continue;

    candidates.set(tmdbId, {
      tmdbId,
      tmdbType: inferTmdbType(doc.category),
      title: String(doc.title || ''),
      genreTags: Array.isArray(doc.genreTags) ? doc.genreTags : [],
      synopsis: doc.description,
      year: doc.year,
      rating: typeof doc.rating === 'string' ? Number(doc.rating) || undefined : doc.rating,
      // Program.image is already a full CDN URL, not a TMDB-relative path —
      // deliberately not carried over here; a full detail fetch (--full) or
      // the normal lazy path will populate the correct posterPath from TMDB.
    });
  }

  return candidates;
}

async function collectCandidatesFromBrands(
  existing: Map<number, CandidateEntry>
): Promise<void> {
  const docs = await TVProgramBrandModel.find(
    { tmdbId: { $exists: true, $ne: null } },
    { tmdbId: 1, title: 1, editorialCategory: 1, genre: 1, _id: 0 }
  )
    .lean()
    .exec();

  for (const doc of docs as any[]) {
    const tmdbId = Number(doc.tmdbId);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0 || existing.has(tmdbId)) continue;

    existing.set(tmdbId, {
      tmdbId,
      tmdbType: inferTmdbType(doc.genre, doc.editorialCategory),
      title: String(doc.title || ''),
      genreTags: [],
    });
  }
}

export async function backfillMediaCatalog(options: BackfillOptions): Promise<void> {
  await connectMongoDB();

  const repository = new MongoMediaCatalogRepository();
  const tmdbApiKey = process.env.TMDB_API_KEY || '';
  const tmdbService = options.full ? new TMDBService(tmdbApiKey, null) : null;
  const mediaCatalogService = tmdbService
    ? new MediaCatalogService(repository, tmdbService, null)
    : null;

  let created = 0;
  let programsLinked = 0;
  let fullyEnriched = 0;
  const errors: string[] = [];

  try {
    const candidates = await collectCandidatesFromPrograms(options.limit);
    await collectCandidatesFromBrands(candidates);

    scriptLogger.info('Backfill candidates collected', { count: candidates.size, options });

    for (const candidate of candidates.values()) {
      if (options.dryRun) {
        created += 1;
        continue;
      }

      try {
        const entry = await repository.upsert({
          tmdbId: candidate.tmdbId,
          tmdbType: candidate.tmdbType,
          contentType: candidate.tmdbType === 'tv' ? 'series' : 'movie',
          title: candidate.title || `tmdb:${candidate.tmdbId}`,
          canonicalGenres: candidate.genreTags,
          synopsis: candidate.synopsis,
          year: candidate.year,
          rating: candidate.rating,
          metadataSource: 'backfill',
        });
        created += 1;

        // Full detail fetch is opt-in and best-effort: never fail the batch
        // over one TMDB error, and stay lightly rate-limited (250ms/item).
        if (options.full && mediaCatalogService) {
          try {
            const detail = await mediaCatalogService.getDetail(candidate.tmdbId, candidate.tmdbType);
            if (detail) fullyEnriched += 1;
            await new Promise((resolve) => setTimeout(resolve, 250));
          } catch (error) {
            errors.push(`detail fetch ${candidate.tmdbId}: ${(error as Error).message}`);
          }
        }

        const result = await ProgramModel.updateMany(
          { tmdbId: candidate.tmdbId, $or: [{ mediaId: { $exists: false } }, { mediaId: null }] },
          { $set: { mediaId: entry.id } }
        ).exec();
        programsLinked += result.modifiedCount || 0;
      } catch (error) {
        errors.push(`${candidate.tmdbId}: ${(error as Error).message}`);
      }
    }

    scriptLogger.info('Media catalog backfill completed', {
      candidates: candidates.size,
      entriesUpserted: created,
      programsLinked,
      fullyEnriched,
      errorCount: errors.length,
      dryRun: options.dryRun,
    });

    if (errors.length) {
      scriptLogger.warn('Some entries failed during backfill', { sample: errors.slice(0, 10) });
    }
  } finally {
    await disconnectMongoDB();
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  backfillMediaCatalog(options)
    .then(() => process.exit(0))
    .catch((error) => {
      scriptLogger.error('Media catalog backfill failed', { error });
      process.exit(1);
    });
}
