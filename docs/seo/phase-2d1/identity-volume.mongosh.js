// Phase 2D-1 §3: read-only volume and collision analysis (Phase 2C §N.4).
// Run: mongosh --quiet "mongodb://127.0.0.1:27017/guiatv" identity-volume.mongosh.js > out.json
// Only find/aggregate/stats. No writes, no $out/$merge. Output is aggregates plus at most
// 10 example programme titles per list (public EPG titles, no user data).
const SINCE = '20260722'; // 90 days before 2026-10-20
const OPTS = { allowDiskUse: true, maxTimeMS: 240000 };
const EXAMPLES = 10;

const legacySlug = (t) =>
  String(t || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-').replace(/^-+|-+$/g, '') || 'sin-titulo';
const histogram = (values, edges) => {
  const out = {};
  for (const v of values) {
    const e = edges.find((x) => v <= x);
    const k = e === undefined ? `>${edges[edges.length - 1]}` : `<=${e}`;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
};

const stats = {};
for (const name of ['tv_read_airings', 'tv_program_brands', 'media_catalog', 'programs']) {
  const s = db.getCollection(name).stats();
  stats[name] = {
    count: s.count, sizeMB: +(s.size / 1e6).toFixed(1), avgObjBytes: s.avgObjSize,
    storageMB: +(s.storageSize / 1e6).toFixed(1), totalIndexMB: +(s.totalIndexSize / 1e6).toFixed(1),
    indexMB: Object.fromEntries(Object.entries(s.indexSizes).map(([k, v]) => [k, +(v / 1e6).toFixed(1)])),
  };
}

const dates = db.tv_read_airings.aggregate([
  { $group: { _id: '$date', n: { $sum: 1 } } }, { $sort: { _id: 1 } },
], OPTS).toArray();

const match = { date: { $gte: SINCE } };
const live = {
  ...match,
  'trustDecision.consumerSuppressed': { $ne: true },
  'program.titleResolutionState': { $nin: ['generic_unresolved', 'generic_suppressed'] },
};
const airings90d = db.tv_read_airings.countDocuments(match, { maxTimeMS: 240000 });
const generic90d = db.tv_read_airings.aggregate([
  { $match: { ...match, $or: [
    { 'trustDecision.consumerSuppressed': true },
    { 'program.titleResolutionState': { $in: ['generic_unresolved', 'generic_suppressed'] } },
  ] } },
  { $group: { _id: '$program.normalizedTitle', n: { $sum: 1 } } }, { $sort: { n: -1 } },
], OPTS).toArray();

const brands = db.tv_read_airings.aggregate([
  { $match: live },
  { $group: {
    _id: '$program.brandKey', n: { $sum: 1 }, titles: { $addToSet: '$program.title' },
    tmdb: { $addToSet: '$program.tmdbId' }, cats: { $addToSet: '$program.editorialCategory' },
    sport: { $max: { $cond: [{ $ifNull: ['$program.sportFacet', false] }, 1, 0] } },
  } },
], OPTS).toArray();

const withTmdb = (b) => b.tmdb.filter((x) => typeof x === 'number');
const tmdbCollisions = brands.filter((b) => withTmdb(b).length > 1).sort((a, b) => b.n - a.n);
const slugToBrands = new Map();
let brandsWithManyLegacySlugs = 0;
for (const b of brands) {
  const slugs = new Set(b.titles.map(legacySlug));
  if (slugs.size > 1) brandsWithManyLegacySlugs++;
  for (const s of slugs) slugToBrands.set(s, (slugToBrands.get(s) || new Set()).add(b._id));
}
const slugCollisions = [...slugToBrands].filter(([, v]) => v.size > 1);
const tmdbToBrands = new Map();
for (const b of brands) for (const id of withTmdb(b)) tmdbToBrands.set(id, (tmdbToBrands.get(id) || 0) + 1);
const tmdbShared = [...tmdbToBrands.values()].filter((n) => n > 1).length;
const mixedKind = brands.filter((b) => {
  const c = b.cats.map((x) => String(x || '').toLowerCase());
  return c.some((x) => x.includes('serie')) && c.some((x) => x.includes('cine') || x.includes('pel'));
});

const remakes = db.media_catalog.aggregate([
  { $match: { tmdbId: { $type: 'number' } } },
  { $group: { _id: { t: '$normalizedTitle', c: '$contentType' }, ids: { $addToSet: '$tmdbId' }, years: { $addToSet: '$year' } } },
  { $match: { 'ids.1': { $exists: true } } }, { $sort: { _id: 1 } },
], OPTS).toArray();
const filmVsSeries = db.media_catalog.aggregate([
  { $match: { tmdbId: { $type: 'number' } } },
  { $group: { _id: '$normalizedTitle', kinds: { $addToSet: '$contentType' } } },
  { $match: { 'kinds.1': { $exists: true } } }, { $count: 'n' },
], OPTS).toArray();
const brandRegistry = {
  total: db.tv_program_brands.estimatedDocumentCount(),
  withTmdb: db.tv_program_brands.countDocuments({ tmdbId: { $type: 'number' } }, { maxTimeMS: 60000 }),
};

printjson({
  generatedAt: new Date().toISOString(),
  server: { version: db.version(), replicaSet: db.hello().setName || null },
  collections: stats,
  tvReadAirings: {
    firstDate: dates[0] && dates[0]._id, lastDate: dates.length && dates[dates.length - 1]._id,
    distinctDates: dates.length,
    docsPerDate: { min: Math.min(...dates.map((d) => d.n)), max: Math.max(...dates.map((d) => d.n)),
      avg: Math.round(dates.reduce((s, d) => s + d.n, 0) / Math.max(1, dates.length)) },
  },
  window90d: {
    since: SINCE, airings: airings90d,
    genericAirings: generic90d.reduce((s, g) => s + g.n, 0), genericDistinctTitles: generic90d.length,
    genericTopExamples: generic90d.slice(0, EXAMPLES).map((g) => ({ title: g._id, airings: g.n })),
    distinctBrandKeys: brands.length,
    brandKeysWithTmdb: brands.filter((b) => withTmdb(b).length > 0).length,
    sportBrandKeys: brands.filter((b) => b.sport).length,
    airingsPerBrandKey: histogram(brands.map((b) => b.n), [1, 2, 5, 20, 100]),
    titlesPerBrandKey: histogram(brands.map((b) => b.titles.length), [1, 2, 5]),
    collisions: {
      brandKeyWithManyTmdbIds: tmdbCollisions.length,
      brandKeyWithManyTmdbIdsExamples: tmdbCollisions.slice(0, EXAMPLES)
        .map((b) => ({ key: b._id, airings: b.n, tmdbIds: withTmdb(b).length, titles: b.titles.slice(0, 3) })),
      tmdbIdSharedByManyBrandKeys: tmdbShared,
      legacySlugSharedByManyBrandKeys: slugCollisions.length,
      legacySlugCollisionExamples: slugCollisions.slice(0, EXAMPLES).map(([s, v]) => ({ slug: s, brandKeys: [...v].slice(0, 3) })),
      brandKeyWithManyLegacySlugs: brandsWithManyLegacySlugs,
      brandKeyWithSeriesAndFilmCategories: mixedKind.length,
    },
  },
  mediaCatalog: {
    sameTitleKindManyTmdbIds: remakes.length,
    examples: remakes.slice(0, EXAMPLES).map((r) => ({ title: r._id.t, kind: r._id.c, tmdbIds: r.ids.length, years: r.years.slice(0, 4) })),
    sameTitleFilmAndSeries: (filmVsSeries[0] && filmVsSeries[0].n) || 0,
  },
  tvProgramBrands: brandRegistry,
});
