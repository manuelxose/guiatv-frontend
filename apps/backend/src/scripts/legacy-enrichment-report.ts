/**
 * Phase 3E: before / after of the 20 canary films' LEGACY pages, from committed inputs only (no database, no network):
 * the stored public payload of each legacy page (before), the catalogue rows and airings rebuilt from the TMDB checks
 * and that payload (phase-3d fixtures), run through the real LegacyEnrichmentService with the clock at the snapshot time.
 *   node dist/scripts/legacy-enrichment-report.js [--out ../../docs/seo/phase-3e]
 * Fixture-based by construction: the airings are the ones the legacy payload listed (today and tomorrow), with the
 * catalogue row id injected, so the schedule can only be reproduced, not extended. Never evidence about production.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { CatalogDetailDTO } from '@/application/dto/CatalogDTO';
import type { MediaCatalogEntry } from '@/domain/entities/MediaCatalogEntry';
import type { AiringRow } from '@/application/services/EntityBroadcastService';
import { LegacyEnrichmentPolicy } from '@/application/services/LegacyEnrichmentPolicy';
import { LegacyEnrichmentService } from '@/application/services/LegacyEnrichmentService';

const root = path.resolve(__dirname, '../../../..');
const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const out = path.resolve(arg('--out') ?? path.join(root, 'docs/seo/phase-3e'));
const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const payloads = read('docs/seo/phase-3d/legacy-payloads-20261022.json').films as Array<Record<string, any>>;
const catalog = read('docs/seo/phase-3d/fixtures/catalog.json') as Array<Record<string, any>>;
const airings = read('docs/seo/phase-3d/fixtures/airings.json') as Array<Record<string, any>>;

const entryOf = (c: Record<string, any>): MediaCatalogEntry => ({
  id: `media_${c.tmdbId}`, tmdbId: c.tmdbId, tmdbType: 'movie', contentType: 'movie', title: c.title, originalTitle: c.originalTitle, year: c.year, synopsis: c.synopsis,
  canonicalGenres: [], tmdbGenres: c.tmdbGenres ?? [], runtimeMinutes: c.runtimeMinutes, metadataSource: 'tmdb', lastEnrichedAt: new Date(c.lastEnrichedAt),
  castSummary: c.castSummary ?? [], directors: c.directors ?? [], posterPath: c.posterPath, backdropPath: c.backdropPath,
} as unknown as MediaCatalogEntry);

const rows = (tmdbId: number): AiringRow[] => airings.filter((a) => a.tmdbId === tmdbId).map((a) => ({ ...a, program: { ...a.program, tmdbId, mediaId: `media_${tmdbId}` } }) as AiringRow);

async function main() {
  const report: Array<Record<string, any>> = [];
  for (const f of payloads) {
    const c = catalog.find((x) => x.tmdbId === f.tmdbId)!;
    const now = new Date(f.fetchedAt);
    const service = new LegacyEnrichmentService({
      catalog: { findByTmdbId: async () => entryOf(c) },
      reader: { findByTmdbId: async () => rows(f.tmdbId) },
      policy: new LegacyEnrichmentPolicy({ CONTENT_LEGACY_ENRICHMENT_ENABLED: 'true', CONTENT_LEGACY_ENRICHMENT_SCOPE: 'all' } as NodeJS.ProcessEnv),
      clock: () => now,
    });
    const legacy = {
      catalogId: `tmdb:movie:${f.tmdbId}`, source: 'tmdb', contentType: 'movie', title: f.title, slug: f.slug, detailPath: f.detailPath, synopsis: f.synopsis, genres: [],
      tmdbId: f.tmdbId, releaseYear: f.releaseYear, primaryPlatforms: [], airings: f.airings, director: f.director, cast: f.cast,
    } as unknown as CatalogDetailDTO;
    const after = await service.apply(legacy, { tmdbType: 'movie', slugBound: true });
    const e = after.enrichment;
    const robots = (page: CatalogDetailDTO) => ((page.airings ?? []).length ? 'index' : 'noindex');
    const channels = (n: Array<{ channelId?: string; channel?: { id: string } }>) => new Set(n.map((x) => x.channelId ?? x.channel?.id)).size;
    report.push({
      path: f.detailPath,
      before: {
        synopsisChars: (f.synopsis ?? '').length, genres: 0, runtime: false, originalTitle: false, cast: (f.cast ?? []).length, director: Boolean(f.director),
        schedule: f.airings.length, scheduleChannels: channels(f.airings), attribution: false, robots: robots(legacy),
      },
      after: {
        synopsisChars: (after.synopsis ?? '').length, genres: e?.metadata?.genres?.length ?? 0, runtime: Boolean(e?.metadata?.runtimeMinutes), originalTitle: Boolean(e?.metadata?.originalTitle),
        cast: (after.cast ?? []).length, director: Boolean(after.director), verifiedBroadcasts: e?.broadcasts?.items.length ?? 0, verifiedChannels: channels(e?.broadcasts?.items ?? []),
        scheduleStatus: e?.broadcasts?.status ?? 'absent', attribution: Boolean(e?.attribution), robots: robots(after),
      },
      unchanged: { synopsis: after.synopsis === legacy.synopsis, airings: JSON.stringify(after.airings) === JSON.stringify(legacy.airings), seoFields: after.title === legacy.title && after.detailPath === legacy.detailPath },
      counters: service.counters,
    });
  }
  const sum = (pick: (r: Record<string, any>) => number | boolean) => report.reduce((n, r) => n + Number(pick(r)), 0);
  const totals = {
    films: report.length,
    gainGenres: sum((r) => r.after.genres > 0), gainRuntime: sum((r) => r.after.runtime), gainOriginalTitle: sum((r) => r.after.originalTitle), gainAttribution: sum((r) => r.after.attribution),
    withSchedule: sum((r) => r.after.verifiedBroadcasts > 0), legacyScheduleRows: sum((r) => r.before.schedule), verifiedScheduleRows: sum((r) => r.after.verifiedBroadcasts),
    robotsChanged: sum((r) => r.before.robots !== r.after.robots), synopsisChanged: sum((r) => !r.unchanged.synopsis), airingsChanged: sum((r) => !r.unchanged.airings),
  };
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'film-before-after.json'), `${JSON.stringify({ basis: 'fixture', clock: 'each payload fetchedAt', totals, films: report }, null, 2)}\n`);
  const yn = (b: boolean) => (b ? 'yes' : '—');
  const md = [
    '# Phase 3E: legacy page before / after (20 canary films)', '',
    '**Fixture-based.** Inputs: the stored public payload of each legacy page (before) and the catalogue rows / airings rebuilt from committed TMDB checks (phase-3d fixtures). No production data was read. The schedule is the snapshot\'s own (today and tomorrow, catalogue row id injected), so it is reproduced, not extended.', '',
    '| Film | Genres | Runtime | Original title | TMDB notice | Legacy schedule rows | Verified rows | Robots before → after | Synopsis / airings changed |', '|---|---|---|---|---|---|---|---|---|',
    ...report.map((r) => `| ${r.path} | 0 → ${r.after.genres} | ${yn(r.after.runtime)} | ${yn(r.after.originalTitle)} | ${yn(r.after.attribution)} | ${r.before.schedule} | ${r.after.verifiedBroadcasts} | ${r.before.robots} → ${r.after.robots} | ${r.unchanged.synopsis && r.unchanged.airings ? 'no' : 'YES'} |`),
    '', `Totals: ${JSON.stringify(totals)}`, '',
  ].join('\n');
  fs.writeFileSync(path.join(out, 'film-before-after.md'), md);
  console.log(JSON.stringify(totals));
  if (totals.robotsChanged || totals.synopsisChanged || totals.airingsChanged) process.exitCode = 1;
}
void main();
