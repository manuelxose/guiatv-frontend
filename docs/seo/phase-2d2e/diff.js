// 2D-2E, no database: machine-readable before/after diff of two `trace-dump.js` outputs of the same
// day (2D-2D build vs 2D-2E build). Old candidates are mapped to new ones by shared EPG spelling.
//   node diff.js traces-before.jsonl traces-after.jsonl > diff-<date>.json
// Machine flags are the 2D-2D ones (phase-2d2d/machine-flags.js), applied to what would be stored
// (proposed title and path), never labels.
const fs = require('node:fs');
const read = (file) => {
  const [head, ...traces] = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { report: head.report, traces };
};
const FLAGS = {
  numbered_part: /\(\d+\)/,
  subtitle_separator: / · |\s-\s/,
  episode_word: /\b(episodio|cap[ií]tulo|ep\.?)\s*\d+/i,
  season_episode_marker: /\bT\d+\s*E\d+\b/i,
  trailing_number: /\s\d{1,4}$/,
  slot_word: /^(repetici[oó]n|programaci[oó]n|cierre|avance|resumen|televenta|teletienda|fin de emisi[oó]n|carta de ajuste|infocomerciales?|\+ ?que)/i,
};
const tally = (list, f) => list.reduce((acc, x) => {
  for (const k of [].concat(f(x) ?? [])) acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});
const slugOf = (t) => (t.path ? t.path.slice(t.path.lastIndexOf('/') + 1) : t.key.replace(/_/g, '-'));

function metrics({ report, traces }) {
  const candidates = traces.filter((t) => t.decision !== 'rejected');
  const created = candidates.filter((t) => t.decision === 'create');
  const flags = (t) => Object.keys(FLAGS).filter((k) => FLAGS[k].test(t.title) || (t.path && FLAGS[k].test(t.path.replace(/-/g, ' '))));
  const bySlug = new Map();
  for (const t of created) bySlug.set(slugOf(t), [...(bySlug.get(slugOf(t)) ?? []), t]);
  const shared = [...bySlug.values()].filter((l) => l.length > 1);
  const crossKind = shared.filter((l) => new Set(l.map((t) => t.kind)).size > 1);
  const paths = tally(created.filter((t) => t.path), (t) => t.path);
  return {
    airings: report.airings,
    excluded: report.excluded,
    titles: report.titles ?? null,
    candidates: candidates.length,
    created: created.length,
    createdByKind: tally(created, (t) => t.kind),
    machineFlagged: created.filter((t) => flags(t).length).length,
    machineFlags: tally(created, flags),
    duplicateSlugGroups: shared.length,
    crossKindSplits: crossKind.length,
    crossKindSplitsWithTwoPaths: crossKind.filter((l) => l.filter((t) => t.path).length > 1).length,
    canonicalCollisions: Object.values(paths).filter((n) => n > 1).length,
    unknownKindRate: candidates.filter((t) => t.kind === 'unknown').length / candidates.length,
    pathlessRate: created.length ? created.filter((t) => !t.path).length / created.length : null,
    tmdbEvidence: tally(candidates, (t) => t.tmdb.evidence),
    reviewQueue: tally(candidates.filter((t) => t.decision === 'review' || t.decision === 'held'), (t) => t.reason ?? t.state),
    unresolved: tally(candidates.filter((t) => t.decision === 'unresolved'), (t) => t.reason ?? 'unknown_kind'),
  };
}

const before = read(process.argv[2]);
const after = read(process.argv[3]);
const bySpelling = new Map();
for (const t of after.traces) for (const s of t.spellings) bySpelling.set(s, [...(bySpelling.get(s) ?? []), t]);
const id = (t) => t.candidateId;
const oldCreates = before.traces.filter((t) => t.decision === 'create');
const targetsOf = new Map(oldCreates.map((t) => [id(t), [...new Set(t.spellings.flatMap((s) => bySpelling.get(s) ?? []))]]));
const sharers = new Map();
for (const [oldId, targets] of targetsOf) for (const n of targets.filter((x) => x.decision === 'create')) sharers.set(id(n), [...(sharers.get(id(n)) ?? []), oldId]);
const fate = (t) => {
  const targets = targetsOf.get(id(t));
  if (!targets.length) return 'unmapped';
  const creates = targets.filter((n) => n.decision === 'create' || n.decision === 'bind');
  if (creates.length) {
    if (creates.some((n) => (sharers.get(id(n)) ?? []).length > 1)) return 'consolidated';
    return creates.some((n) => n.key === t.key && n.kind === t.kind) ? 'kept' : 'renamed';
  }
  if (targets.every((n) => n.decision === 'rejected')) return `removed:${[...new Set(targets.map((n) => n.reason))].sort().join('+')}`;
  return `unresolved:${[...new Set(targets.map((n) => n.reason ?? n.decision))].sort().join('+')}`;
};
const decisions = oldCreates.map((t) => {
  const targets = targetsOf.get(id(t));
  return {
    fate: fate(t), kind: t.kind, title: t.title, path: t.path ?? null,
    now: targets.map((n) => ({ kind: n.kind, title: n.title, decision: n.decision, reason: n.reason, path: n.path ?? null })),
  };
});
const out = {
  date: before.report.date,
  before: metrics(before),
  after: metrics(after),
  fates: tally(decisions, (d) => d.fate),
  crossKindAfter: after.traces.filter((t) => t.reason === 'cross_kind_conflict' || t.crossKind).map((t) => ({ kind: t.kind, title: t.title, decision: t.decision, crossKind: t.crossKind, tmdb: t.tmdb.evidence })),
  decisions,
};
console.log(JSON.stringify(out, null, 1));
