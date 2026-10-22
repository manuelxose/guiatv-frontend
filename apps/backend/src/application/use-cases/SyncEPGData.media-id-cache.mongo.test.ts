/**
 * Phase 3F: a programme enriched from the stored-programme cache (no TMDB call) keeps the catalogue row id that the
 * stored programme recorded with the same TMDB id. Before this, `tmdbId` was copied and `mediaId` was dropped, so the
 * airing could not be tied to its catalogue row and the legacy enrichment join (which needs that row) rejected it.
 * Throwaway database, dropped after.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ProgramModel } from '@/infrastructure/database/models/Program.model';
import { MongoProgramRepository } from '@/infrastructure/repositories/MongoProgramRepository';
import { SyncEPGData } from './SyncEPGData';
import { Program } from '@/domain/entities/Program';
import { PRIMARY_EPG_SOURCE_URL } from '@/shared/config/epgSources';

const base = (id: string, title: string, day: string) => ({
  id, channelId: 'la_1', canonicalChannelId: 'la_1', title, genre: 'Cine', genreTags: [], titleAliases: [], sourceFeed: PRIMARY_EPG_SOURCE_URL,
  startTime: new Date(`${day}T20:00:00.000Z`), endTime: new Date(`${day}T22:00:00.000Z`), sourceProvenance: { legacyProgramIds: [id] },
});

test('3F: a cache-hit programme keeps the stored catalogue row id, and never invents one', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const dbName = `guiatv_test_3fmedia_${process.pid}`;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName });
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    await mongoose.connection.dropDatabase();
    const repo = new MongoProgramRepository();
    // Yesterday's enrichment: Heat with its catalogue row; Alien enriched before the row id was kept.
    await repo.saveBatch([
      Program.create({ ...base('old_heat', 'Heat', '2026-10-21'), tmdbId: 949, mediaId: 'media_heat', image: '/heat.jpg', genreTags: ['crime'], year: '1995' } as never),
      Program.create({ ...base('old_alien', 'Alien', '2026-10-21'), tmdbId: 348, image: '/alien.jpg', genreTags: ['scifi'], year: '1979' } as never),
    ]);
    assert.deepEqual((await repo.findEnrichedByTitles(['Heat', 'Alien'])).map((e) => [e.title, e.tmdbId, e.mediaId]).sort(), [['Alien', 348, undefined], ['Heat', 949, 'media_heat']]);

    const sync = new SyncEPGData(repo as never, repo as never, {} as never, {} as never, {} as never, {} as never, {} as never) as never as { programRepository: unknown; enrichProgramsWithTMDB(p: Program[]): Promise<Program[]> };
    (sync as any).programRepository = repo;
    (sync as any).shouldSkipTMDBForProgram = () => false;
    const out = await sync.enrichProgramsWithTMDB([
      Program.create(base('new_heat', 'Heat', '2026-10-24') as never),
      Program.create(base('new_alien', 'Alien', '2026-10-24') as never),
    ]);
    const byId = Object.fromEntries(out.map((p) => [p.id, p]));
    assert.equal(byId.new_heat.tmdbId, 949);
    assert.equal(byId.new_heat.mediaId, 'media_heat');
    assert.equal(byId.new_alien.tmdbId, 348);
    assert.equal(byId.new_alien.mediaId, undefined, 'no stored row id: none is invented');
  } finally {
    await ProgramModel.deleteMany({}).catch(() => undefined);
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  }
});
