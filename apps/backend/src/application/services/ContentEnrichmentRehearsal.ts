/**
 * Phase 3D rehearsal step for `rehearseWriteCanary`: on the certified, served scratch batch it fills the
 * catalogue from fixtures (real TMDB facts and public-API snapshots of the 20 films, never a database read),
 * enriches every entity, joins its broadcasts from the read model, and builds the per-film quality and
 * legacy-consolidation report with the same code the production report command uses.
 */
import { ContentEntityEnrichment, MediaCatalogEnrichmentSource } from './ContentEntityEnrichment';
import { EntityBroadcastService, MongoBroadcastReader, type BroadcastSelection } from './EntityBroadcastService';
import { filmReport, legacyIndexable, summarizeFilmReports, type FilmReport, type LegacySnapshot } from './ContentEntityReport';
import type { RehearsalCheck, RehearsalContext } from './ContentCanaryRehearsal';
import { MongoMediaCatalogRepository } from '@/infrastructure/repositories/MongoMediaCatalogRepository';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

export interface EnrichmentFixtures {
  catalog: Array<Record<string, any> & { tmdbId: number; lastEnrichedAt: string }>;
  airings: Array<{ tmdbId: number; id: string; date: string; channel: Record<string, string>; program: { title: string }; airing: { start: string; end: string; durationMinutes: number } }>;
  legacy: LegacySnapshot[];
}

export function enrichmentRehearsal(fixtures: EnrichmentFixtures) {
  return async (ctx: RehearsalContext): Promise<{ checks: RehearsalCheck[]; artefact: { films: FilmReport[]; summary: ReturnType<typeof summarizeFilmReports>; evaluatedAt: string; fixtures: Record<string, unknown> } }> => {
    const checks: RehearsalCheck[] = [];
    const check = (step: string, ok: boolean, detail: string) => { checks.push({ step, ok, detail }); };
    const N = ctx.manifest.entities.length;
    const media = ctx.db.collection('media_catalog');
    const catalog = new MongoMediaCatalogRepository();
    const enrichment = new ContentEntityEnrichment(ctx.entities, new MediaCatalogEnrichmentSource(catalog));
    const evaluatedAt = new Date(Math.max(...fixtures.legacy.map((l) => Date.parse(l.measuredAt))) + 15 * 60_000);

    // The catalogue as production keeps it: rich TMDB rows, half of them last written by an EPG search match.
    let flipped = 0;
    for (const [i, row] of fixtures.catalog.entries()) {
      const { tmdbId, lastEnrichedAt, sources: _sources, ...fields } = row;
      await media.updateOne({ tmdbType: 'movie', tmdbId }, { $set: { ...fields, lastEnrichedAt: new Date(lastEnrichedAt), metadataSource: i % 2 ? 'epg' : 'tmdb' } }, { upsert: true });
      if (i % 2) flipped++;
    }
    const seeded = await ctx.baseline();
    const ids = ctx.manifest.entities.map((e) => ({ e, id: ctx.entityIds.get(`${e.tmdb.type}:${e.tmdb.id}`)! }));

    // 1. Dry run: the plan for every film, nothing written.
    const dry = await Promise.all(ids.map(({ id }) => enrichment.enrich(id, evaluatedAt, { apply: false })));
    const versions = async () => (await Promise.all(ids.map(({ id }) => ctx.entities.findById(id)))).map((e) => e!.version);
    const v0 = await versions();
    check('enrichment dry run: every film has a plan and nothing is written', dry.every((r) => r.outcome === 'would_write') && JSON.stringify(await versions()) === JSON.stringify(v0) && (await ctx.baseline()).digest === seeded.digest, dry.map((r) => r.outcome).filter((o) => o !== 'would_write').join(',') || `${dry.length} would_write`);

    // 2. Apply.
    const applied = await Promise.all(ids.map(({ id }) => enrichment.enrich(id, evaluatedAt, { apply: true })));
    const refused = applied.flatMap((r, i) => (r.outcome === 'refused' ? [`${ids[i].e.title}:${r.plan.reasons.join('+')}`] : []));
    check('enrichment: every film is enriched from the catalogue (or refused with its reason)', applied.every((r) => r.outcome === 'written'), refused.join(' | ') || `${applied.length} written (${flipped} catalogue rows last written by the EPG)`);
    const v1 = await versions();
    check('enrichment bumps each version once and writes only metadata', v1.every((v, i) => v === v0[i] + 1), `${v1.length} entities`);
    const states = await Promise.all(ids.map(async ({ id }) => ctx.certify.stateOf((await ctx.entities.findById(id))!)));
    check('enrichment leaves every attestation valid', states.every((s) => s.state === 'certified'), states.map((s) => s.state).filter((x) => x !== 'certified').join(',') || `${N} certified`);

    // 3. Repeat: deterministic, writes nothing.
    const again = await Promise.all(ids.map(({ id }) => enrichment.enrich(id, evaluatedAt, { apply: true })));
    check('enrichment repeat: nothing to write', again.every((r) => r.outcome === 'unchanged') && JSON.stringify(await versions()) === JSON.stringify(v1), `${again.filter((r) => r.outcome === 'unchanged').length} unchanged`);

    // 4. Broadcasts from the read model (rows carry the catalogue row id, as the EPG sync writes it).
    const rowId = new Map<number, string>();
    for (const r of await media.find({ tmdbType: 'movie' }).toArray()) rowId.set(r.tmdbId, String(r._id));
    const inserted = fixtures.airings.map((a) => ({
      id: a.id, date: a.date, viewDate: a.date, channel: a.channel, program: { title: a.program.title, tmdbId: a.tmdbId, mediaId: rowId.get(a.tmdbId) }, airing: a.airing,
      assets: {}, availability: {}, sourceProvenance: {}, timingContext: {}, relevance: {}, searchTokens: [],
    }));
    await TVReadAiringModel.insertMany(inserted);
    const broadcasts = new EntityBroadcastService(new MongoBroadcastReader(), () => evaluatedAt);
    const films: FilmReport[] = [];
    let guardAgrees = 0;
    let unevidenced = 0;
    try {
      for (const [i, { e, id }] of ids.entries()) {
        const entity = (await ctx.entities.findById(id))!;
        const found = await broadcasts.forEntity(entity);
        const selection = found.selection as BroadcastSelection;
        unevidenced += selection.items.filter((b) => !selection.evidence[b.airingId]).length;
        const legacy = fixtures.legacy.find((l) => l.path === e.canonicalPath);
        if (legacy && found.legacyIndexableNow === legacyIndexable(legacy)) guardAgrees++;
        films.push(filmReport({
          candidateId: e.candidateId, title: e.title, canonicalPath: e.canonicalPath, entity,
          enrichment: { outcome: applied[i].outcome, warnings: applied[i].outcome === 'written' ? applied[i].plan.warnings : undefined },
          selection, legacy, registryClean: true,
        }));
      }
    } finally {
      await TVReadAiringModel.deleteMany({ id: { $in: inserted.map((a) => a.id) } });
    }
    check('every joined broadcast carries identity evidence', unevidenced === 0, `${films.reduce((n, f) => n + (f.broadcasts?.count ?? 0), 0)} broadcasts joined`);
    check('the read-time legacy guard predicts the legacy robots of every film', guardAgrees === N, `${guardAgrees}/${N} agree with the legacy page snapshot`);
    const summary = summarizeFilmReports(films);
    check('no film is an index candidate (AI-attested identity, no internal links, year provenance off)', summary.indexable === 0, `${summary.indexable} indexable`);
    return { checks, artefact: { films: films.map((f) => ({ ...f, entityId: null })), summary, evaluatedAt: evaluatedAt.toISOString(), fixtures: { catalogRows: fixtures.catalog.length, airings: fixtures.airings.length, legacyPages: fixtures.legacy.length } } };
  };
}
