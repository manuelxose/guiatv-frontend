// No database: is the auto-create sample of a review sheet representative of its population?
// For each share (kind, method, with path) the population value must lie inside the sample's exact
// 95% interval. Run from apps/backend after `npm run build`:
//   node <path>/check-sample.js <identity-…-sample.json> <identity-…-review.csv>
const fs = require('node:fs');
const path = require('node:path');
const { parseCsv, clopperPearson } = require(path.resolve('dist/application/services/ContentIdentityAudit'));
const sample = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = parseCsv(fs.readFileSync(process.argv[3], 'utf8')).filter((r) => r.strata.split(';').includes('auto_create'));
const s = sample.summary;
const N = s.newEntities;
const checks = [];
const check = (name, popCount, isIn) => {
  const x = rows.filter(isIn).length;
  const ci = clopperPearson(x, rows.length);
  const pop = popCount / N;
  checks.push({ share: name, sample: +(x / rows.length).toFixed(4), population: +pop.toFixed(4), ci95: [+ci.lower.toFixed(4), +ci.upper.toFixed(4)], ok: pop >= ci.lower && pop <= ci.upper });
};
for (const [k, n] of Object.entries(s.newEntitiesByKind)) check(`kind=${k}`, n, (r) => r.kind === k);
for (const [m, n] of Object.entries(s.newEntitiesByMethod)) check(`method=${m}`, n, (r) => r.method === m);
check('with_path', s.withPath, (r) => Boolean(r.proposed_path));
const out = { seed: sample.seed, sampled: rows.length, population: N, distinctCandidates: new Set(rows.map((r) => r.candidate_id)).size, checks, representative: checks.every((c) => c.ok) && rows.length === Math.min(sample.precisionSample, N) };
console.log(JSON.stringify(out, null, 1));
process.exitCode = out.representative ? 0 : 2;
