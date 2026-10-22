/**
 * M03-L2: read-only census of cross-type catalogue links (a `Cine` airing on a tv row, a `Series` airing on a movie row) in the
 * broadcast window, split by where the bad `mediaId` lives (built airing vs stored programme) and by how the stored programme got it.
 * Same guard, pool and run recipe as m02b-measure.cjs; prints counts only, no titles or ids:
 *
 *   cd /var/www/guiatv/current/apps/backend && (set -a; . /etc/guiatv/api.env; set +a; MONGODB_MAX_POOL_SIZE=2 \
 *     nice -n 19 node /path/to/m03l2-cross-type.cjs --out /var/tmp/m03l2/cross-type.json)
 */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const dist = (p) => require(path.join(root, 'dist', p));
const mongoose = require(require.resolve('mongoose', { paths: [root] }));
const { installReadOnlyGuard } = dist('scripts/readOnlyGuard.js');
const { connectMongoDB, disconnectMongoDB } = dist('config/mongodb.js');
const { titleIdentityKey } = dist('domain/services/contentIdentity.js');
const { broadcastWindowDates } = dist('application/services/EntityBroadcastService.js');
// Present from release 20261022161030 on; absent in older releases (projection then skipped).
const { guardExistingMediaIds, catalogueLinkSnapshot } = (() => { try { return dist('application/services/CatalogueLinkShadow.js'); } catch { return {}; } })();

const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const inc = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
const MAXMS = 30_000;
const DEPLOY_AT = new Date(arg('--deployed-at') ?? '2026-10-22T14:11:00Z'); // M03-L2 release 20261022161030
const crossed = (category, rowType) => (category === 'Cine' && rowType === 'tv') || (category === 'Series' && rowType === 'movie');

async function main() {
  const guard = installReadOnlyGuard();
  await connectMongoDB();
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    const dates = broadcastWindowDates(now);
    const airings = await db.collection('tv_read_airings').find({ date: { $in: dates }, 'program.mediaId': { $type: 'string', $ne: '' } },
      { projection: { date: 1, updatedAt: 1, 'program.title': 1, 'program.tmdbId': 1, 'program.mediaId': 1, 'program.editorialCategory': 1, 'sourceProvenance.legacyProgramIds': 1 }, maxTimeMS: MAXMS }).toArray();
    const ids = [...new Set(airings.map((a) => a.program.mediaId))].filter((id) => /^[0-9a-f]{24}$/i.test(id));
    const rows = await db.collection('media_catalog').find({ _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } },
      { projection: { tmdbId: 1, tmdbType: 1, title: 1, originalTitle: 1, metadataSource: 1, createdAt: 1 }, maxTimeMS: MAXMS }).toArray();
    const byId = new Map(rows.map((r) => [String(r._id), r]));
    const bad = airings.filter((a) => { const r = byId.get(a.program.mediaId); return r && crossed(a.program.editorialCategory, r.tmdbType); });

    const progIds = [...new Set(bad.flatMap((a) => a.sourceProvenance?.legacyProgramIds ?? []))];
    const progs = await db.collection('programs').find({ id: { $in: progIds } },
      { projection: { id: 1, title: 1, category: 1, tmdbId: 1, mediaId: 1, 'trustFlags.tmdbKind': 1, 'trustFlags.tmdbSource': 1, createdAt: 1, updatedAt: 1 }, maxTimeMS: MAXMS }).toArray();
    const progById = new Map(progs.map((p) => [p.id, p]));
    const tmdbIds = [...new Set(bad.map((a) => a.program.tmdbId))];
    const sameIdRows = await db.collection('media_catalog').find({ tmdbId: { $in: tmdbIds } }, { projection: { tmdbId: 1, tmdbType: 1 }, maxTimeMS: MAXMS }).toArray();
    const typesByTmdb = new Map(); for (const r of sameIdRows) (typesByTmdb.get(r.tmdbId) ?? typesByTmdb.set(r.tmdbId, new Set()).get(r.tmdbId)).add(r.tmdbType);

    const s = { airings: bad.length, byCategoryRowType: {}, byDate: {}, airingVsRowTmdbId: {}, rowSource: {}, rowTitleKeyMatchesAiring: {}, tmdbIdAlsoHasRowOfExpectedType: {},
      stored: { programmesFound: 0, programmesMissing: 0, storedMediaIdEqualsAiring: 0, storedMediaIdDiffers: 0, storedMediaIdAbsent: 0, storedCategory: {}, tmdbKind: {}, tmdbSource: {}, programmeCreatedBeforeDeploy: 0, programmeCreatedAfterDeploy: 0 },
      distinctBadMediaIds: new Set(bad.map((a) => a.program.mediaId)).size, distinctTmdbIds: tmdbIds.length };
    for (const a of bad) {
      const r = byId.get(a.program.mediaId);
      const want = a.program.editorialCategory === 'Cine' ? 'movie' : 'tv';
      inc(s.byCategoryRowType, `${a.program.editorialCategory}|${r.tmdbType}`); inc(s.byDate, a.date);
      inc(s.airingVsRowTmdbId, r.tmdbId === a.program.tmdbId ? 'same' : 'different');
      inc(s.rowSource, r.metadataSource ?? '∅');
      const key = titleIdentityKey(a.program.title);
      inc(s.rowTitleKeyMatchesAiring, Boolean(key) && [titleIdentityKey(r.title), titleIdentityKey(r.originalTitle)].includes(key) ? 'yes' : 'no');
      inc(s.tmdbIdAlsoHasRowOfExpectedType, typesByTmdb.get(a.program.tmdbId)?.has(want) ? 'yes' : 'no');
      for (const pid of a.sourceProvenance?.legacyProgramIds ?? []) {
        const p = progById.get(pid);
        if (!p) { s.stored.programmesMissing++; continue; }
        s.stored.programmesFound++;
        if (!p.mediaId) s.stored.storedMediaIdAbsent++; else if (p.mediaId === a.program.mediaId) s.stored.storedMediaIdEqualsAiring++; else s.stored.storedMediaIdDiffers++;
        inc(s.stored.storedCategory, p.category ?? '∅'); inc(s.stored.tmdbKind, p.trustFlags?.tmdbKind ?? '∅'); inc(s.stored.tmdbSource, p.trustFlags?.tmdbSource ?? '∅');
        if (p.createdAt && new Date(p.createdAt) < DEPLOY_AT) s.stored.programmeCreatedBeforeDeploy++; else s.stored.programmeCreatedAfterDeploy++;
      }
    }
    // Stored programme documents (any date) carrying a cross-type link: the historical corruption a db-cache copy can spread.
    const storedAll = await db.collection('programs').find({ mediaId: { $type: 'string', $ne: '' } }, { projection: { mediaId: 1, category: 1, 'trustFlags.tmdbKind': 1, 'trustFlags.tmdbSource': 1 }, maxTimeMS: MAXMS }).toArray();
    const allIds = [...new Set(storedAll.map((p) => p.mediaId))].filter((id) => /^[0-9a-f]{24}$/i.test(id));
    const allRows = new Map((await db.collection('media_catalog').find({ _id: { $in: allIds.map((id) => new mongoose.Types.ObjectId(id)) } }, { projection: { tmdbType: 1 }, maxTimeMS: MAXMS }).toArray()).map((r) => [String(r._id), r.tmdbType]));
    const kindType = (p) => (p.trustFlags?.tmdbKind === 'movie' ? 'movie' : p.trustFlags?.tmdbKind === 'series' ? 'tv' : null);
    const storedCensus = { withMediaId: storedAll.length, danglingRow: 0, kindMatchesRow: 0, kindMismatchesRow: 0, noKind: 0, noKindBySource: {}, mismatchBySource: {} };
    for (const p of storedAll) {
      const t = allRows.get(p.mediaId); const k = kindType(p);
      if (!t) storedCensus.danglingRow++;
      else if (!k) { storedCensus.noKind++; inc(storedCensus.noKindBySource, p.trustFlags?.tmdbSource ?? '∅'); }
      else if (k === t) storedCensus.kindMatchesRow++;
      else { storedCensus.kindMismatchesRow++; inc(storedCensus.mismatchBySource, p.trustFlags?.tmdbSource ?? '∅'); }
    }
    // Projection: what the deployed build-time guard keeps for these airings (in-memory copies; nothing is written).
    let guardProjection = null;
    if (guardExistingMediaIds) {
      const all = await db.collection('tv_read_airings').find({ date: { $in: dates }, 'program.tmdbId': { $type: 'number' } }, { projection: { updatedAt: 1, 'program.title': 1, 'program.tmdbId': 1, 'program.mediaId': 1, 'program.editorialCategory': 1 }, maxTimeMS: MAXMS }).toArray();
      const copies = all.map((a) => ({ ...a.program }));
      await guardExistingMediaIds(copies);
      const kept = copies.filter((p) => p.mediaId);
      const rowsKept = new Map((await db.collection('media_catalog').find({ _id: { $in: [...new Set(kept.map((p) => p.mediaId))].map((id) => new mongoose.Types.ObjectId(id)) } }, { projection: { tmdbType: 1 }, maxTimeMS: MAXMS }).toArray()).map((r) => [String(r._id), r.tmdbType]));
      guardProjection = { withTmdb: all.length, rawMediaIdNow: all.filter((a) => a.program.mediaId).length, mediaIdAfterGuard: kept.length,
        crossTypeAfterGuard: kept.filter((p) => crossed(p.editorialCategory, rowsKept.get(p.mediaId))).length, guard: catalogueLinkSnapshot().mediaIdGuard,
        airingsBuiltAfterDeploy: all.filter((a) => a.updatedAt && new Date(a.updatedAt) >= DEPLOY_AT).length };
    }
    const report = { generatedAt: now.toISOString(), dates, airingsWithMediaId: airings.length, crossType: s, storedProgrammes: storedCensus, guardProjection, readOnlyGuard: guard.summary() };
    const out = arg('--out'); if (out) fs.writeFileSync(out, `${JSON.stringify(report, null, 1)}\n`);
    console.log(JSON.stringify(report));
  } finally { await disconnectMongoDB(); }
}
main().catch((e) => { console.error(String(e.message).slice(0, 300)); process.exit(1); });
