#!/usr/bin/env node
/**
 * Phase 3D: builds the scratch fixtures for the canary films from data already in the repository: the TMDB checks
 * the evidence replay made on the VPS (year, runtime, genre ids, original title) and the public API snapshot of each
 * legacy page (synopsis, artwork paths, credits, scheduled airings). No database and no network.
 *   node scripts/phase-3d-fixture.mjs [--out docs/seo/phase-3d/fixtures]
 * Writes catalog.json (media_catalog rows), airings.json (read-model rows) and legacy-snapshot.json.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'docs/seo/phase-3d/fixtures');
const payloads = JSON.parse(fs.readFileSync(path.join(root, 'docs/seo/phase-3d/legacy-payloads-20261022.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/seo/phase-3c/canary-manifest.json'), 'utf8'));
const tarball = path.join(root, 'docs/seo/phase-3b/round2/replay-inputs-r2.tar.gz');

/** TMDB's es-ES genre names for the ids the checks carry (a fixed public table). */
const GENRES = { 28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música', 9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción', 10770: 'Película de TV', 53: 'Suspense', 10752: 'Bélica', 37: 'Western' };

const checks = new Map();
for (const day of ['20261020', '20261021', '20261022', '20261023']) {
  const list = JSON.parse(execFileSync('tar', ['-xzOf', tarball, `./tmdb-checks-${day}.json`], { maxBuffer: 1 << 28 }).toString());
  for (const c of list) if (c.type === 'movie' && c.details) checks.set(c.id, { ...c, day });
}
const imgPath = (url) => (url ? new URL(url).pathname.replace(/^\/t\/p\/[^/]+/, '') : undefined);
const measuredRobots = { 'la-cura-del-bienestar': 'index', 'venganza-en-las-vegas': 'index', 'dobles-vidas': 'index', 'los-subdesarrollados': 'index', '22-balas': 'index', amerigeddon: 'noindex' };
const INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const catalog = [], airings = [], snapshot = [];
for (const f of payloads.films) {
  const entity = manifest.entities.find((e) => e.candidateId === f.candidateId);
  const c = checks.get(entity.tmdb.id);
  if (!c) throw new Error(`no TMDB check with details for ${f.slug}`);
  const hit = (c.results ?? []).find((r) => r.id === entity.tmdb.id);
  catalog.push({
    tmdbId: entity.tmdb.id, tmdbType: 'movie', contentType: 'movie', title: f.title, ...(hit?.originalTitle ? { originalTitle: hit.originalTitle } : {}),
    year: String(c.details.year), synopsis: f.synopsis, tmdbGenres: (c.details.genreIds ?? []).map((id) => ({ id, name: GENRES[id] })).filter((g) => g.name),
    runtimeMinutes: c.details.runtime, posterPath: imgPath(f.image), backdropPath: imgPath(f.backdrop), rating: f.rating,
    castSummary: f.cast.map((p) => ({ name: p.name, ...(p.character ? { character: p.character } : {}) })), directors: f.director ? [f.director] : [],
    metadataSource: 'tmdb', lastEnrichedAt: f.fetchedAt, sources: { tmdbCheckDay: c.day, payloadFetchedAt: f.fetchedAt },
  });
  for (const a of f.airings) {
    const id = a.catalogId.replace(/^program:/, '');
    airings.push({
      tmdbId: entity.tmdb.id, id, date: id.slice(0, 8), channel: { id: a.channelId, name: a.channelName, normalizedName: a.channelId.replace(/_/g, '-') },
      program: { title: a.title }, airing: { start: a.start, end: a.end, durationMinutes: Math.round((Date.parse(a.end) - Date.parse(a.start)) / 60000) },
    });
  }
  const measured = measuredRobots[f.slug];
  snapshot.push({
    path: f.detailPath, tmdbId: f.tmdbId, title: f.title, measuredAt: f.fetchedAt, status: 200,
    robots: measured ? (measured === 'index' ? INDEX : 'noindex, follow') : (f.airings.length ? INDEX : 'noindex, follow'),
    robotsBasis: measured ? 'measured' : 'predicted_from_airings',
    facts: { synopsisChars: (f.synopsis ?? '').length, castCount: f.cast.length, hasDirector: Boolean(f.director), hasPoster: Boolean(f.image), hasBackdrop: Boolean(f.backdrop), upcomingAirings: f.airings.length, releaseYear: f.releaseYear },
  });
}
fs.mkdirSync(out, { recursive: true });
const write = (name, data) => fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 1) + '\n');
write('catalog.json', catalog);
write('airings.json', airings);
write('legacy-snapshot.json', snapshot);
console.log(JSON.stringify({ films: catalog.length, airings: airings.length, indexableLegacy: snapshot.filter((s) => /\bindex\b/.test(s.robots) && !/noindex/.test(s.robots)).length, out: path.relative(root, out) }));
