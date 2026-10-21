import assert from 'node:assert/strict';
import test from 'node:test';
import { SyncEPGData } from './SyncEPGData';
import { Program } from '@/domain/entities/Program';

/** 2D-2G: the feed's year survives TMDB enrichment beside the resolved one, only with the flag on. */
const program = (year?: string) =>
  Program.create({ id: 'p1', channelId: 'la_1', title: 'Bordertown', startTime: new Date('2026-10-20T20:00:00Z'), endTime: new Date('2026-10-20T21:00:00Z'), year, sourceProvenance: { legacyProgramIds: ['x'] } } as any);
const clone = (p: Program, overrides: Record<string, unknown>) =>
  (new SyncEPGData({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any) as any).cloneProgram(p, overrides) as Program;
const enrich = { year: '1989', tmdbId: 554, trustFlags: { tmdbMatched: true, tmdbSource: 'api_fallback' } };

test('EPG_YEAR_PROVENANCE off: enrichment output is exactly as before', () => {
  delete process.env.EPG_YEAR_PROVENANCE;
  const out = clone(program('2016'), enrich);
  assert.equal(out.year, '1989');
  assert.deepEqual(out.sourceProvenance, { legacyProgramIds: ['x'] });
});

test('EPG_YEAR_PROVENANCE on: raw year kept across enrichments, resolved year and source recorded, year unchanged', () => {
  process.env.EPG_YEAR_PROVENANCE = 'true';
  try {
    const once = clone(program('2016'), enrich);
    assert.equal(once.year, '1989', 'the public field keeps its current meaning');
    assert.deepEqual(once.sourceProvenance, {
      legacyProgramIds: ['x'],
      yearProvenance: { rawXmltvYear: '2016', resolvedWorkYear: '1989', resolvedYearSource: 'api_fallback' },
    });
    // A second enrichment (phase 2 cache hit) must not take the TMDB year for the raw one.
    const twice = clone(once, { year: '1989', tmdbId: 554, trustFlags: { tmdbSource: 'db_cache' } });
    assert.equal((twice.sourceProvenance as any).yearProvenance.rawXmltvYear, '2016');
    assert.equal((twice.sourceProvenance as any).yearProvenance.resolvedYearSource, 'db_cache');
    assert.deepEqual((clone(program(), enrich).sourceProvenance as any).yearProvenance.rawXmltvYear, null, 'no feed year: recorded as absent');
    assert.deepEqual(clone(program('2016'), { genre: 'Series' }).sourceProvenance, { legacyProgramIds: ['x'] }, 'not an enrichment: untouched');
  } finally {
    delete process.env.EPG_YEAR_PROVENANCE;
  }
});
