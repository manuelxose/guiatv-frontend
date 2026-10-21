// 2D-2E, read-only: every identity trace of one stored day, as JSON lines, for `diff.js`. Works with
// the 2D-2D build (before) and the 2D-2E build (after): run it from that build's apps/backend
//   CONTENT_IDENTITY_MAX_CREATES=100000 node <path>/trace-dump.js 20261020 > traces-<label>.jsonl
// The read-only guard is installed first: a write or DDL command ends the process (exit 97).
const path = require('node:path');
const dist = (m) => require(path.resolve('dist', m));
const { installReadOnlyGuard } = dist('scripts/readOnlyGuard');
const guard = installReadOnlyGuard();
const { connectMongoDB, disconnectMongoDB } = dist('config/mongodb');
const { TVReadAiringModel } = dist('infrastructure/database/models/TVReadAiring.model');
const { ProgramModel } = dist('infrastructure/database/models/Program.model');
const { createContentIdentityIngestion, observationsFromAirings } = dist('application/services/ContentIdentityIngestion');
(async () => {
  await connectMongoDB();
  const date = process.argv[2];
  if (!/^\d{8}$/.test(date || '')) throw new Error('usage: trace-dump.js YYYYMMDD');
  const airings = await TVReadAiringModel.find({ date }, { id: 1, program: 1, sourceProvenance: 1 }).lean();
  const ids = airings.map((a) => a.sourceProvenance?.legacyProgramIds?.[0]).filter(Boolean);
  const years = new Map((await ProgramModel.find({ id: { $in: ids }, year: { $exists: true } }, { id: 1, year: 1 }).lean()).map((p) => [p.id, p.year]));
  const y = new Map(airings.map((a) => [a.id, years.get(a.sourceProvenance?.legacyProgramIds?.[0])]));
  const traces = [];
  const report = await createContentIdentityIngestion('shadow').run(date, observationsFromAirings(airings, y), traces);
  process.stdout.write(JSON.stringify({ report }) + '\n');
  for (const t of traces) process.stdout.write(JSON.stringify(t) + '\n');
  await disconnectMongoDB();
  console.error('guard', JSON.stringify(guard.summary()));
})().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(1);
});
