/**
 * Phase 3F: what the legacy enrichment would do on the REAL catalogue and EPG read model, before any flag is turned on.
 * Read-only (the same guard as `content-certify`: any write ends the process with code 97). Numbers and labels only.
 *
 *   node dist/scripts/legacy-enrichment-preflight.js [--candidates candidates.json] [--out report.json] [--no-coverage]
 *
 * candidates.json: [{ "path": "/peliculas/dobles-vidas", "tmdbId": 12345, "title": "Dobles vidas", "releaseYear": 2018 }]
 *
 * Reports (1) coverage over the EPG window: airings with a TMDB id, airings that also carry the catalogue row id (the
 * evidence the join requires), catalogue rows by completeness; (2) per candidate: identity refusals, verified
 * broadcasts, every rejection reason, how many airings a title-only match would have added (counted, never used),
 * and the latency of the two reads.
 */
import fs from 'node:fs';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { installReadOnlyGuard } from './readOnlyGuard';
import { MongoMediaCatalogRepository } from '@/infrastructure/repositories/MongoMediaCatalogRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { enrichmentSourceFromCatalog } from '@/application/services/ContentEntityEnrichment';
import {
  BROADCAST_QUERY_LIMIT, MongoBroadcastReader, broadcastWindowDates, madridDay, selectWorkBroadcasts,
} from '@/application/services/EntityBroadcastService';
import { legacyBindingRefusals, legacyMetadataGaps } from '@/domain/services/legacyEnrichment';

const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const pct = (n: number, d: number) => (d ? Math.round((1000 * n) / d) / 10 : null);
const quantile = (values: number[], q: number) => { const s = [...values].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };

async function coverage(now: Date, repo: MongoMediaCatalogRepository) {
  const dates = broadcastWindowDates(now);
  const perDate = await TVReadAiringModel.aggregate([
    { $match: { date: { $in: dates } } },
    { $group: {
      _id: '$date', airings: { $sum: 1 },
      withTmdb: { $sum: { $cond: [{ $ifNull: ['$program.tmdbId', false] }, 1, 0] } },
      withTmdbAndMedia: { $sum: { $cond: [{ $and: [{ $ifNull: ['$program.tmdbId', false] }, { $ifNull: ['$program.mediaId', false] }] }, 1, 0] } },
    } },
    { $sort: { _id: 1 } },
  ]).option({ maxTimeMS: 20_000 });
  const ids: number[] = (await TVReadAiringModel.distinct('program.tmdbId', { date: { $in: dates }, 'program.tmdbId': { $type: 'number' } }).maxTimeMS(20_000)) as number[];
  const movies = await repo.findManyByTmdbIds('movie', ids);
  const tv = await repo.findManyByTmdbIds('tv', ids);
  const rows = (list: typeof movies) => ({
    rows: list.length,
    fullyFetched: list.filter((r) => r.lastEnrichedAt).length,
    withRuntime: list.filter((r) => r.runtimeMinutes).length,
    withGenres: list.filter((r) => r.tmdbGenres.length || r.canonicalGenres.length).length,
    withOriginalTitle: list.filter((r) => r.originalTitle && r.originalTitle !== r.title).length,
  });
  return {
    window: { dates, horizonDaysWithAirings: perDate.filter((d) => d.airings > 0).length },
    perDate: perDate.map((d) => ({ date: d._id, airings: d.airings, withTmdb: d.withTmdb, withTmdbAndCatalogueRow: d.withTmdbAndMedia, catalogueRowShare: pct(d.withTmdbAndMedia, d.withTmdb) })),
    distinctTmdbIds: ids.length,
    catalogue: { movie: rows(movies), tv: rows(tv), idsWithoutAnyRow: ids.filter((id) => !movies.some((m) => m.tmdbId === id) && !tv.some((m) => m.tmdbId === id)).length },
  };
}

async function candidate(c: { path: string; tmdbId: number; title: string; releaseYear?: number }, repo: MongoMediaCatalogRepository, reader: MongoBroadcastReader, now: Date) {
  const t0 = Date.now();
  const entry = await repo.findByTmdbId('movie', c.tmdbId);
  const catalogueMs = Date.now() - t0;
  const row = entry ? enrichmentSourceFromCatalog(entry) : null;
  const page = { source: 'tmdb' as const, tmdbId: c.tmdbId, tmdbType: 'movie' as const, title: c.title, releaseYear: c.releaseYear, slugBound: true, genres: [], durationMinutes: undefined };
  const refusals = legacyBindingRefusals(page, row);
  const t1 = Date.now();
  let rows: Awaited<ReturnType<MongoBroadcastReader['findByTmdbId']>> = [];
  let scheduleError: string | null = null;
  try { rows = await reader.findByTmdbId(c.tmdbId, broadcastWindowDates(now), BROADCAST_QUERY_LIMIT); } catch (e) { scheduleError = String((e as Error).message).slice(0, 120); }
  const scheduleMs = Date.now() - t1;
  const work = { tmdbId: c.tmdbId, titles: [row?.title ?? c.title, row?.originalTitle], mediaId: row?.mediaId };
  const strict = selectWorkBroadcasts({ ...work, requireCatalogueRow: true }, rows, now);
  const loose = selectWorkBroadcasts(work, rows, now);
  const legacyWindow = new Set([madridDay(now), madridDay(now, 1)]);
  return {
    path: c.path, tmdbId: c.tmdbId,
    catalogue: { row: Boolean(row), fullyFetched: Boolean(row?.lastEnrichedAt), runtime: Boolean(row?.runtimeMinutes), genres: row?.genres.length ?? 0, originalTitle: Boolean(row?.originalTitle) },
    refusals, gaps: row && !refusals.length ? Object.keys(legacyMetadataGaps(page, row)) : [],
    airingsRead: rows.length, airingsWithCatalogueRow: rows.filter((r) => r.program?.mediaId).length,
    verifiedBroadcasts: refusals.length ? 0 : strict.items.length,
    beyondLegacyWindow: refusals.length ? 0 : strict.items.filter((i) => !legacyWindow.has(i.localDate.replace(/-/g, ''))).length,
    titleOnlyWouldAdd: loose.items.length - strict.items.length, rejected: strict.rejected,
    ms: { catalogue: catalogueMs, schedule: scheduleMs }, scheduleError,
  };
}

async function main() {
  const guard = installReadOnlyGuard();
  await connectMongoDB();
  try {
    const repo = new MongoMediaCatalogRepository();
    const reader = new MongoBroadcastReader(800);
    const now = new Date();
    const report: Record<string, unknown> = { generatedAt: now.toISOString(), database: mongoose.connection.db?.databaseName };
    if (!process.argv.includes('--no-coverage')) report.coverage = await coverage(now, repo);
    const file = arg('--candidates');
    if (file) {
      const list = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<{ path: string; tmdbId: number; title: string; releaseYear?: number }>;
      const results = [];
      for (const c of list) results.push(await candidate(c, repo, reader, now));
      const ms = results.map((r) => r.ms.schedule);
      report.candidates = results;
      report.candidateTotals = {
        n: results.length, accepted: results.filter((r) => !r.refusals.length).length, withVerifiedBroadcasts: results.filter((r) => r.verifiedBroadcasts > 0).length,
        verifiedBroadcasts: results.reduce((n, r) => n + r.verifiedBroadcasts, 0), beyondLegacyWindow: results.reduce((n, r) => n + r.beyondLegacyWindow, 0),
        titleOnlyWouldAdd: results.reduce((n, r) => n + r.titleOnlyWouldAdd, 0), scheduleMsP50: quantile(ms, 0.5), scheduleMsP95: quantile(ms, 0.95), scheduleErrors: results.filter((r) => r.scheduleError).length,
      };
    }
    report.readOnlyGuard = guard.summary();
    const out = arg('--out');
    if (out) fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await disconnectMongoDB();
  }
}
void main();
