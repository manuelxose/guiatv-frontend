/**
 * Phase 3F: the preflight reports real coverage and per-candidate outcomes from a throwaway database, writes nothing,
 * and its title-only counter shows what strict evidence costs without ever using it. Needs TEST_MONGO_URI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import mongoose from 'mongoose';
import { MongoMediaCatalogRepository } from '@/infrastructure/repositories/MongoMediaCatalogRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { madridDay } from '@/application/services/EntityBroadcastService';

test('3F preflight: coverage, candidates, strict vs title-only, read-only', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const dbName = `guiatv_test_3fpre_${process.pid}`;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName });
  try {
    await mongoose.connection.dropDatabase();
    const repo = new MongoMediaCatalogRepository();
    const row = await repo.upsert({ tmdbId: 949, tmdbType: 'movie', contentType: 'movie', title: 'Heat', originalTitle: 'Heat', year: '1995', runtimeMinutes: 170, tmdbGenres: [{ id: 80, name: 'Crimen' }], metadataSource: 'tmdb', markEnrichedNow: true });
    const now = new Date();
    const at = (d: number, h: number) => { const t = new Date(now.getTime() + d * 86_400_000 + h * 3_600_000); return { iso: t.toISOString(), date: madridDay(t) }; };
    const airing = (id: string, d: number, program: Record<string, unknown>) => {
      const { iso, date } = at(d, 2);
      return { id, date, viewDate: date, channel: { id: 'la_1', name: 'La 1', normalizedName: 'la_1' }, program: { title: 'Heat', tmdbId: 949, ...program }, airing: { start: iso, end: new Date(Date.parse(iso) + 7_200_000).toISOString(), date }, assets: {}, availability: {}, sourceProvenance: {}, timingContext: {}, relevance: {}, searchTokens: [] };
    };
    await TVReadAiringModel.collection.insertMany([
      airing('with-row', 1, { mediaId: row.id }),
      airing('without-row', 2, {}),                    // title and id match, no catalogue row: counted, never used
      airing('other-row', 1, { mediaId: 'not-this-row' }),
    ]);
    const before = await mongoose.connection.db!.collection('tv_read_airings').countDocuments();
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pre-')), 'c.json');
    fs.writeFileSync(file, JSON.stringify([{ path: '/peliculas/heat', tmdbId: 949, title: 'Heat', releaseYear: 1995 }, { path: '/peliculas/ghost', tmdbId: 1, title: 'Ghost' }]));
    const run = spawnSync(process.execPath, ['--require', path.join(__dirname, '../../test-setup.cjs'), path.join(__dirname, 'legacy-enrichment-preflight.js'), '--candidates', file, '--out', `${file}.out.json`], {
      env: { ...process.env, MONGODB_URI: process.env.TEST_MONGO_URI, MONGODB_DB_NAME: dbName }, encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);
    const report = JSON.parse(fs.readFileSync(`${file}.out.json`, 'utf8'));
    assert.equal(report.coverage.distinctTmdbIds, 1);
    assert.equal(report.coverage.perDate.reduce((n: number, d: any) => n + d.withTmdb, 0), 3);
    assert.equal(report.coverage.perDate.reduce((n: number, d: any) => n + d.withTmdbAndCatalogueRow, 0), 2);
    assert.equal(report.coverage.catalogue.movie.fullyFetched, 1);
    const [heat, ghost] = report.candidates;
    assert.deepEqual(heat.refusals, []);
    assert.equal(heat.verifiedBroadcasts, 1, 'only the airing tied to the validated catalogue row');
    assert.equal(heat.titleOnlyWouldAdd, 1, 'the airing without a row would have been added by a title-only match');
    assert.equal(heat.rejected.other_catalogue_row, 1);
    assert.deepEqual(ghost.refusals, ['source_missing']);
    assert.equal(report.candidateTotals.accepted, 1);
    assert.equal(report.readOnlyGuard.total > 0, true);
    assert.equal(await mongoose.connection.db!.collection('tv_read_airings').countDocuments(), before);
    assert.deepEqual(Object.keys(report.readOnlyGuard.counts).filter((k) => /^(insert|update|delete|create)/.test(k)), []);
  } finally {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  }
});
