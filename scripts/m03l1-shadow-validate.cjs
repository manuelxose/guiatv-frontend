/**
 * M03-L1: read-only production check of the shadow linker. Runs the release's own `runCatalogueLinkShadow` (same reader,
 * batching and rules as the builder) over the airings `m02b-measure.cjs` reads, under the read-only guard (any write exits 97):
 *   - window cohort: every airing with a TMDB id in the broadcast window (comparable with m02b `linkability`)
 *   - per-date cohorts: what a builder run for that date would count (title-key conflicts are per batch)
 * Prints counts and timings only; no titles or ids.
 *
 *   cd /var/www/guiatv/current/apps/backend && (set -a; . /etc/guiatv/api.env; set +a; MONGODB_MAX_POOL_SIZE=2 \
 *     nice -n 19 node /path/to/m03l1-shadow-validate.cjs --out /var/tmp/m03l1/shadow.json)
 */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const dist = (p) => require(path.join(root, 'dist', p));
const mongoose = require(require.resolve('mongoose', { paths: [root] }));
const { installReadOnlyGuard } = dist('scripts/readOnlyGuard.js');
const { connectMongoDB, disconnectMongoDB } = dist('config/mongodb.js');
const { broadcastWindowDates } = dist('application/services/EntityBroadcastService.js');
const { runCatalogueLinkShadow, catalogueLinkSnapshot, resetCatalogueLinkStats } = dist('application/services/CatalogueLinkShadow.js');

const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);

async function main() {
  const guard = installReadOnlyGuard();
  await connectMongoDB();
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    const dates = broadcastWindowDates(now);
    const airings = await db.collection('tv_read_airings').find({ date: { $in: dates }, 'program.tmdbId': { $type: 'number' } },
      { projection: { date: 1, 'program.title': 1, 'program.tmdbId': 1, 'program.mediaId': 1, 'program.editorialCategory': 1 }, maxTimeMS: 30_000 }).toArray();
    const run = async (programs) => {
      resetCatalogueLinkStats();
      await runCatalogueLinkShadow(programs.map((a) => a.program), { mode: 'shadow' });
      const s = catalogueLinkSnapshot();
      if (s.errors) throw new Error('shadow evaluation failed');
      return s.lastRun;
    };
    const report = { generatedAt: now.toISOString(), dates, window: await run(airings), perDate: {} };
    report.window.unlinked = airings.filter((a) => !a.program.mediaId).length;
    for (const d of dates) report.perDate[d] = await run(airings.filter((a) => a.date === d));
    report.readOnlyGuard = guard.summary();
    const out = arg('--out'); if (out) fs.writeFileSync(out, `${JSON.stringify(report, null, 1)}\n`);
    console.log(JSON.stringify({ ok: true, out, linkable: report.window.linkable, ms: report.window.ms, guard: report.readOnlyGuard.total }));
  } finally { await disconnectMongoDB(); }
}
main().catch((e) => { console.error(String(e.message).slice(0, 300)); process.exit(1); });
