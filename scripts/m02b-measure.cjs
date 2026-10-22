/**
 * M02-B: read-only catalogue/EPG identity measurement. Runs on the host from the live release, under the read-only guard
 * (any write ends the process with 97), with a small pool, bounded reads and numbers/public film titles only:
 *
 *   cd /var/www/guiatv/current/apps/backend && (set -a; . /etc/guiatv/api.env; set +a; MONGODB_MAX_POOL_SIZE=2 \
 *     nice -n 19 node /path/to/m02b-measure.cjs --out /var/tmp/m02b/measure.json)
 *
 * Mirrors selectWorkBroadcasts/legacyBindingRefusals (id + catalogue row + title key); title similarity is never proof.
 * It does not use MongoMediaCatalogRepository.findManyByTmdbIds (that returned [] on a malformed row before M02-B).
 */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const dist = (p) => require(path.join(root, 'dist', p));
const mongoose = require(require.resolve('mongoose', { paths: [root] }));
const { installReadOnlyGuard } = dist('scripts/readOnlyGuard.js');
const { connectMongoDB, disconnectMongoDB } = dist('config/mongodb.js');
const { titleIdentityKey } = dist('domain/services/contentIdentity.js');
const { broadcastWindowDates, madridDay } = dist('application/services/EntityBroadcastService.js');

const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : null);
const inc = (o, k, by = 1) => { o[k] = (o[k] ?? 0) + by; };
const MAXMS = 30_000;
const DEPLOY_AT = new Date(arg('--deployed-at') ?? '2026-10-22T11:20:32Z');

const hasGenres = (r) => (r.tmdbGenres?.length ?? 0) + (r.canonicalGenres?.length ?? 0) > 0;
const hasOriginal = (r) => Boolean(r.originalTitle && r.originalTitle.trim() && r.originalTitle !== r.title);
const complete = (r) => Boolean(r.lastEnrichedAt && r.runtimeMinutes > 0 && hasGenres(r) && hasOriginal(r));

async function main() {
  const guard = installReadOnlyGuard();
  await connectMongoDB();
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    const dates = broadcastWindowDates(now);
    const report = { generatedAt: now.toISOString(), deployedAt: DEPLOY_AT.toISOString() };

    // ---- catalogue (whole collection, projected) ----
    const rows = await db.collection('media_catalog').find({}, { projection: { tmdbId: 1, tmdbType: 1, title: 1, originalTitle: 1, normalizedTitle: 1, runtimeMinutes: 1, tmdbGenres: 1, canonicalGenres: 1, lastEnrichedAt: 1, year: 1 }, maxTimeMS: MAXMS }).toArray();
    const byId = new Map(rows.map((r) => [String(r._id), r]));
    const byTmdb = new Map();
    for (const r of rows) { const k = `${r.tmdbId}`; byTmdb.set(k, [...(byTmdb.get(k) ?? []), r]); }
    const cat = (list) => ({
      rows: list.length, invalidRows: list.filter((r) => !r.title?.trim() || !r.normalizedTitle?.trim()).length,
      withTmdbId: list.filter((r) => Number.isInteger(r.tmdbId)).length,
      genres: list.filter(hasGenres).length, runtime: list.filter((r) => r.runtimeMinutes > 0).length,
      originalTitle: list.filter(hasOriginal).length, enriched: list.filter((r) => r.lastEnrichedAt).length, fullyEnriched: list.filter(complete).length,
    });
    report.catalogueAll = { movie: cat(rows.filter((r) => r.tmdbType === 'movie')), tv: cat(rows.filter((r) => r.tmdbType === 'tv')) };

    // ---- EPG ----
    const perDateRaw = await db.collection('tv_read_airings').aggregate([{ $group: { _id: '$date', n: { $sum: 1 } } }, { $sort: { _id: 1 } }], { maxTimeMS: MAXMS }).toArray();
    report.epgHorizon = { datesWithAirings: perDateRaw.filter((d) => d._id >= madridDay(now, -1)).map((d) => [d._id, d.n]), today: madridDay(now) };
    const airings = await db.collection('tv_read_airings').find({ date: { $in: dates }, 'program.tmdbId': { $type: 'number' } },
      { projection: { id: 1, date: 1, 'program.title': 1, 'program.tmdbId': 1, 'program.mediaId': 1, 'program.editorialCategory': 1, 'airing.start': 1, 'airing.end': 1, 'channel.id': 1, createdAt: 1, updatedAt: 1 }, maxTimeMS: MAXMS }).toArray();
    const perDate = await db.collection('tv_read_airings').aggregate([{ $match: { date: { $in: dates } } }, { $group: { _id: '$date', airings: { $sum: 1 }, withTmdb: { $sum: { $cond: [{ $eq: [{ $type: '$program.tmdbId' }, 'int'] }, 1, 0] } } } }, { $sort: { _id: 1 } }], { maxTimeMS: MAXMS }).toArray();
    const withMedia = {}; for (const a of airings) if (a.program.mediaId) inc(withMedia, a.date);
    report.perDate = perDate.map((d) => ({ date: d._id, airings: d.airings, withTmdb: d.withTmdb, withTmdbAndCatalogueRow: withMedia[d._id] ?? 0, catalogueRowShare: pct(withMedia[d._id] ?? 0, d.withTmdb) }));
    const totalAir = perDate.reduce((n, d) => n + d.airings, 0);
    const totalTmdb = airings.length;
    const totalMedia = airings.filter((a) => a.program.mediaId).length;
    report.epgTotals = { airings: totalAir, withTmdb: totalTmdb, withTmdbShare: pct(totalTmdb, totalAir), withCatalogueRow: totalMedia, catalogueRowShare: pct(totalMedia, totalTmdb) };

    report.byCategory = await db.collection('tv_read_airings').aggregate([{ $match: { date: { $in: dates } } }, { $group: { _id: '$program.editorialCategory', airings: { $sum: 1 }, withTmdb: { $sum: { $cond: [{ $eq: [{ $type: '$program.tmdbId' }, 'int'] }, 1, 0] } }, withMediaId: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$program.mediaId', ''] } }, 0] }, 1, 0] } } } }, { $sort: { airings: -1 } }], { maxTimeMS: MAXMS }).toArray();

    // ---- identity quality (strict, in the order the joiner applies) ----
    const titleKeysByTmdb = new Map();
    for (const a of airings) { const s = titleKeysByTmdb.get(a.program.tmdbId) ?? new Set(); s.add(titleIdentityKey(a.program.title) ?? '∅'); titleKeysByTmdb.set(a.program.tmdbId, s); }
    const reasons = {}; const missingDetail = {}; const crossTab = {}; const linkability = { airings: {}, identities: {}, byCategory: {} }; const linkIds = { linkable: new Set() }; const seenIdent = {};
    const mismatchKinds = {}; const mismatchSamples = {}; const unlinkedProjection = { rowWithMatchingTitleKey: 0, rowWithDifferentTitleKey: 0 };
    const verified = new Map(); // tmdbId -> { row, airings: [] }
    for (const a of airings) {
      const p = a.program; const tmdbId = p.tmdbId; const upcoming = new Date(a.airing?.end) > now;
      const candidates = byTmdb.get(`${tmdbId}`) ?? [];
      let why;
      if (!p.mediaId) { why = 'missing_media_id'; inc(missingDetail, candidates.length === 0 ? 'no_catalogue_row_for_tmdb' : candidates.length === 1 ? 'single_row_exists_unlinked' : 'multiple_rows_exist_unlinked');
        // projection only (a TMDB id plus a matching title would still need the linking evidence the joiner requires)
        const tk0 = titleIdentityKey(p.title);
        // M02-C: strict linkability (design input only; nothing is written): same-type, unique row, title key, no shared-id conflict
        {
          const want = p.editorialCategory === 'Cine' ? 'movie' : p.editorialCategory === 'Series' ? 'tv' : null;
          const valid = candidates.filter((c) => c.title?.trim() && c.normalizedTitle?.trim());
          const pool = want ? valid.filter((c) => c.tmdbType === want) : valid;
          let verdict;
          if (!tk0) verdict = 'blocked_airing_title_has_no_key';
          else if (candidates.length === 0) verdict = 'blocked_no_row';
          else if (pool.length === 0) verdict = valid.length < candidates.length ? 'blocked_only_invalid_rows' : 'blocked_no_row_of_expected_type';
          else if (pool.length > 1) verdict = 'blocked_several_rows_same_type';
          else if (!want && new Set(candidates.map((c) => c.tmdbType)).size > 1) verdict = 'blocked_type_unknown_and_movie_and_tv_rows';
          else if (![titleIdentityKey(pool[0].title), titleIdentityKey(pool[0].originalTitle)].includes(tk0)) verdict = 'blocked_title_key_differs';
          else if (titleKeysByTmdb.get(tmdbId).size > 1) verdict = 'blocked_tmdb_id_shared_by_other_titles';
          else verdict = 'linkable';
          inc(linkability.airings, verdict); inc((linkability.byCategory[p.editorialCategory ?? '∅'] ??= {}), verdict);
          const idk = `${tmdbId}|${tk0}`; if (!seenIdent[idk]) { seenIdent[idk] = 1; inc(linkability.identities, verdict); }
          if (verdict === 'linkable') linkIds.linkable.add(idk);
        }
        if (candidates.length === 1) inc(unlinkedProjection, [titleIdentityKey(candidates[0].title), titleIdentityKey(candidates[0].originalTitle)].includes(tk0) && tk0 ? 'rowWithMatchingTitleKey' : 'rowWithDifferentTitleKey'); }
      else {
        const row = byId.get(String(p.mediaId));
        if (!row) why = 'catalogue_row_not_found';
        else if (row.tmdbId !== tmdbId) why = 'catalogue_tmdb_mismatch';
        else {
          inc(crossTab, `${p.editorialCategory ?? '∅'}|${row.tmdbType}`);
          const keys = new Set([titleIdentityKey(row.title), titleIdentityKey(row.originalTitle)].filter(Boolean));
          const tk = titleIdentityKey(p.title);
          if ((p.editorialCategory === 'Cine' && row.tmdbType === 'tv') || (p.editorialCategory === 'Series' && row.tmdbType === 'movie')) why = 'wrong_content_type';
          else if (!tk || !keys.has(tk)) why = 'title_key_mismatch';
          else if (candidates.filter((c) => c.tmdbType === row.tmdbType).length > 1) why = 'ambiguous_duplicate_rows_same_type';
          else why = null;
          if (why === 'title_key_mismatch') {
            // does any piece of "Title (Alias)" / "Title : Episode" equal a row key? (both ids already agree; only the third check fails)
            const parts = String(p.title).split(/\s*[()·:]\s*/).map((x) => titleIdentityKey(x)).filter(Boolean);
            const kind = parts.some((x) => keys.has(x)) ? 'a_part_of_the_title_equals_a_row_key' : 'no_part_matches';
            inc(mismatchKinds, kind);
            const bucketSamples = (mismatchSamples[kind] ??= []); const k = `${tmdbId}`;
            if (bucketSamples.length < 25 && !bucketSamples.some((x) => x.tmdbId === tmdbId)) bucketSamples.push({ tmdbId, category: p.editorialCategory ?? null, airing: p.title, row: row.title, rowOriginal: row.originalTitle ?? null });
          }
          if (!why) {
            const conflicted = titleKeysByTmdb.get(tmdbId).size > 1; if (conflicted) inc(reasons, 'verified_on_tmdb_id_shared_by_other_titles');
            if (upcoming) { const e = verified.get(tmdbId) ?? { row, airings: [], conflicted }; e.airings.push(a); verified.set(tmdbId, e); }
          }
        }
      }
      inc(reasons, why ?? (upcoming ? 'verified_upcoming' : 'verified_already_ended'));
    }
    const tv = [...verified.values()].filter((e) => e.row.tmdbType === 'tv'); const mv = [...verified.values()].filter((e) => e.row.tmdbType === 'movie');
    const sum = (l) => l.reduce((n, e) => n + e.airings.length, 0);
    report.linkability = { ...linkability, note: 'airings = airings without mediaId; identities = distinct (tmdbId, title key) pairs; projection assumes every linkable airing would be linked' }; report.identity = { outcomes: reasons, unlinkedProjection, titleKeyMismatchKinds: mismatchKinds, titleKeyMismatchSamples: mismatchSamples, missingMediaIdDetail: missingDetail, categoryByRowType: crossTab,
      verifiedUpcoming: { movies: mv.length, movieBroadcasts: sum(mv), broadcastsPerMovie: mv.length ? Math.round((10 * sum(mv)) / mv.length) / 10 : null, series: tv.length, seriesBroadcasts: sum(tv), broadcastsPerSeries: tv.length ? Math.round((10 * sum(tv)) / tv.length) / 10 : null },
      tmdbIdsWithMultipleTitleKeys: [...titleKeysByTmdb.values()].filter((s) => s.size > 1).length, verifiedMoviesOnSharedTmdbId: mv.filter((e) => e.conflicted).length, distinctTmdbIds: titleKeysByTmdb.size };

    // relevant catalogue = rows the EPG window points at
    const rel = new Set(airings.map((a) => `${a.program.tmdbId}`));
    const relRows = rows.filter((r) => rel.has(`${r.tmdbId}`));
    report.catalogueRelevant = { movie: cat(relRows.filter((r) => r.tmdbType === 'movie')), tv: cat(relRows.filter((r) => r.tmdbType === 'tv')), tmdbIdsWithoutAnyRow: [...rel].filter((k) => !byTmdb.has(k)).length, distinctTmdbIdsInWindow: rel.size };

    // ---- mediaId fix: airings by last write vs deployment; stored programme rows ----
    const bucket = (a) => (new Date(a.updatedAt) >= DEPLOY_AT ? 'updated_after_deploy' : 'updated_before_deploy');
    const hist = {};
    for (const a of airings) { const b = (hist[bucket(a)] ??= { tmdb: 0, withMediaId: 0 }); b.tmdb++; if (a.program.mediaId) b.withMediaId++; }
    for (const b of Object.values(hist)) b.share = pct(b.withMediaId, b.tmdb);
    const lastUpd = airings.reduce((m, a) => (a.updatedAt > m ? a.updatedAt : m), new Date(0));
    const createdAfter = airings.filter((a) => new Date(a.createdAt) >= DEPLOY_AT);
    const programs = await db.collection('programs').aggregate([{ $match: { tmdbId: { $type: 'number' } } }, { $group: { _id: { hasMedia: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$mediaId', ''] } }, 0] }, true, false] } }, n: { $sum: 1 }, lastUpdated: { $max: '$updatedAt' } } }], { maxTimeMS: MAXMS }).toArray();
    // what the next scheduled sync can copy: stored programme rows for the window's TMDB ids that already carry a mediaId, and whether that mediaId is consistent
    const stored = await db.collection('programs').find({ tmdbId: { $in: [...titleKeysByTmdb.keys()] }, mediaId: { $type: 'string', $ne: '' } }, { projection: { tmdbId: 1, mediaId: 1, title: 1 }, maxTimeMS: MAXMS }).toArray();
    const storedByTmdb = new Map(); for (const sp of stored) storedByTmdb.set(sp.tmdbId, [...(storedByTmdb.get(sp.tmdbId) ?? []), sp]);
    const projected = { missingAirings: 0, tmdbIdHasStoredProgrammeWithMediaId: 0, storedMediaIdConsistent: 0, storedMediaIdInconsistent: 0, storedMediaIdDangling: 0, storedProgrammesForWindow: stored.length };
    for (const a of airings) {
      if (a.program.mediaId) continue; projected.missingAirings++;
      const sp = storedByTmdb.get(a.program.tmdbId); if (!sp) continue; projected.tmdbIdHasStoredProgrammeWithMediaId++;
      const row = byId.get(String(sp[0].mediaId));
      projected[!row ? 'storedMediaIdDangling' : row.tmdbId === a.program.tmdbId ? 'storedMediaIdConsistent' : 'storedMediaIdInconsistent']++;
    }
    report.mediaIdFix = { projectedEffectOfNextSync: projected, airingsByLastWrite: hist, lastAiringUpdate: lastUpd, airingsCreatedAfterDeploy: { tmdb: createdAfter.length, withMediaId: createdAfter.filter((a) => a.program.mediaId).length },
      storedProgrammesWithTmdbId: programs.map((g) => ({ hasMediaId: g._id.hasMedia, n: g.n, lastUpdated: g.lastUpdated })) };

    // ---- rollout candidates: verified upcoming movies, strict identity, complete row, ranked by what a visitor gains ----
    const today = madridDay(now); const tomorrow = madridDay(now, 1);
    const cands = mv.filter((e) => !e.conflicted).map((e) => {
      const r = e.row; const legacyWin = e.airings.filter((a) => a.date === today || a.date === tomorrow).length;
      return { tmdbId: r.tmdbId, title: r.title, originalTitle: hasOriginal(r) ? r.originalTitle : null, year: r.year ?? null, verifiedUpcoming: e.airings.length, legacyWindowAirings: legacyWin, beyondLegacyWindow: e.airings.length - legacyWin,
        channels: new Set(e.airings.map((a) => a.channel?.id)).size, row: { enriched: Boolean(r.lastEnrichedAt), runtime: r.runtimeMinutes > 0, genres: hasGenres(r), originalTitle: hasOriginal(r) }, rowComplete: complete(r),
        firstAiring: e.airings.map((a) => a.airing.start).sort()[0], missingFields: [!r.runtimeMinutes && 'runtime', !hasGenres(r) && 'genres', !hasOriginal(r) && 'originalTitle'].filter(Boolean) };
    }).sort((a, b) => Number(b.rowComplete) - Number(a.rowComplete) || Number(b.legacyWindowAirings > 0) - Number(a.legacyWindowAirings > 0) || b.verifiedUpcoming - a.verifiedUpcoming || a.tmdbId - b.tmdbId);
    report.candidatePool = { size: cands.length, top: cands.slice(0, 60) };

    report.readOnlyGuard = guard.summary();
    const out = arg('--out'); if (out) fs.writeFileSync(out, `${JSON.stringify(report, null, 1)}\n`);
    console.log(JSON.stringify({ ok: true, out, guard: report.readOnlyGuard.total }));
  } finally { await disconnectMongoDB(); }
}
main().catch((e) => { console.error(String(e.message).slice(0, 300)); process.exit(1); });
