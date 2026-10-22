/**
 * Phase 3D validation of EPG_YEAR_PROVENANCE on a throwaway database (`guiatv_test_3dyear_<pid>`, dropped after):
 * the same enriched programmes are persisted and rebuilt into the read model with the flag off and on. The public
 * read model must be byte-identical; the only difference allowed is the stored `sourceProvenance.yearProvenance`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { ProgramModel } from '@/infrastructure/database/models/Program.model';
import { MongoProgramRepository } from '@/infrastructure/repositories/MongoProgramRepository';
import { TvReadModelBuilder } from '@/application/services/TvReadModelBuilder';
import { SyncEPGData } from './SyncEPGData';
import { Program } from '@/domain/entities/Program';
import { PRIMARY_EPG_SOURCE_URL } from '@/shared/config/epgSources';

const programs = () => [
  // The feed says 2016; TMDB resolves the 1989 original (the homonym case that made the stored year untrustworthy).
  { id: 'p_bordertown', title: 'Bordertown', year: '2016', tmdbId: 554, start: '20:00', end: '21:30' },
  // The feed and TMDB agree.
  { id: 'p_heat', title: 'Heat', year: '1995', tmdbId: 949, start: '22:00', end: '23:50' },
  // No feed year at all.
  { id: 'p_sin_anio', title: 'La noche de los lápices', year: undefined, tmdbId: 3345, start: '18:00', end: '19:40' },
].map((p) => Program.create({
  id: p.id, channelId: 'la_1', canonicalChannelId: 'la_1', title: p.title, genre: 'Cine', genreTags: [], titleAliases: [], sourceFeed: PRIMARY_EPG_SOURCE_URL,
  startTime: new Date(`2026-10-28T${p.start}:00.000Z`), endTime: new Date(`2026-10-28T${p.end}:00.000Z`), year: p.year, sourceProvenance: { legacyProgramIds: [p.id] },
} as never));

const resolved: Record<string, { year: string; tmdbId: number }> = { p_bordertown: { year: '1989', tmdbId: 554 }, p_heat: { year: '1995', tmdbId: 949 }, p_sin_anio: { year: '1976', tmdbId: 3345 } };
const enrichAll = (sync: any, list: Program[]) => list.map((p) => sync.cloneProgram(p, { ...resolved[p.id], trustFlags: { tmdbMatched: true, tmdbSource: 'api_fallback' } }) as Program);

test('3D: EPG_YEAR_PROVENANCE changes stored provenance only, never the public read model', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const dbName = `guiatv_test_3dyear_${process.pid}`;
  const previous = process.env.EPG_YEAR_PROVENANCE;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName });
  const sync = new SyncEPGData({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any) as any;
  const repo = new MongoProgramRepository();
  const builder = new TvReadModelBuilder(repo, { clear: async () => undefined } as never);
  const run = async (flag: 'on' | 'off') => {
    if (flag === 'on') process.env.EPG_YEAR_PROVENANCE = 'true'; else delete process.env.EPG_YEAR_PROVENANCE;
    await ProgramModel.deleteMany({});
    await TVReadAiringModel.deleteMany({});
    await repo.saveBatch(enrichAll(sync, programs()));
    await builder.rebuildDate('2026-10-28');
    const stored = await ProgramModel.find({}).sort({ id: 1 }).lean();
    const read = (await TVReadAiringModel.find({}).sort({ id: 1 }).lean()).map(({ _id, createdAt, updatedAt, __v, ...rest }: any) => rest);
    return { stored, read };
  };
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    await mongoose.connection.dropDatabase();
    await ensureMongoCollectionsAndIndexes();
    const off = await run('off');
    const on = await run('on');
    assert.equal(off.read.length, 3);

    // Public behaviour: the read model is identical.
    assert.deepEqual(on.read, off.read, 'the read model (what the API serves) is the same with the flag on');
    assert.deepEqual(on.stored.map((p: any) => p.year), off.stored.map((p: any) => p.year), '`year` keeps its meaning (the resolved work year)');
    assert.deepEqual(on.stored.map((p: any) => p.year), ['1989', '1995', '1976']);
    assert.ok(!JSON.stringify(on.read).includes('rawXmltvYear'), 'the feed year is not exposed by the read model');

    // Stored provenance: only with the flag on, kept beside the resolved year.
    assert.ok(off.stored.every((p: any) => !p.sourceProvenance?.yearProvenance), 'flag off: nothing new is stored');
    assert.deepEqual(on.stored.map((p: any) => p.sourceProvenance.yearProvenance), [
      { rawXmltvYear: '2016', resolvedWorkYear: '1989', resolvedYearSource: 'api_fallback' },
      { rawXmltvYear: '1995', resolvedWorkYear: '1995', resolvedYearSource: 'api_fallback' },
      { rawXmltvYear: null, resolvedWorkYear: '1976', resolvedYearSource: 'api_fallback' },
    ]);
    // Everything else on the stored programme is untouched.
    const strip = (p: any) => { const { _id, __v, createdAt, updatedAt, sourceProvenance, ...rest } = p; const { yearProvenance: _y, ...prov } = sourceProvenance ?? {}; return { ...rest, sourceProvenance: prov }; };
    assert.deepEqual(on.stored.map(strip), off.stored.map(strip), 'the flag adds exactly sourceProvenance.yearProvenance');

    // Reversible: switching it off and re-enriching leaves a flag-off document; the stale key does not leak into reads.
    const back = await run('off');
    assert.deepEqual(back.read, off.read);
    assert.ok(back.stored.every((p: any) => !p.sourceProvenance?.yearProvenance));
  } finally {
    if (previous === undefined) delete process.env.EPG_YEAR_PROVENANCE; else process.env.EPG_YEAR_PROVENANCE = previous;
    await mongoose.connection.dropDatabase().catch(() => undefined);
    await mongoose.disconnect();
  }
});
