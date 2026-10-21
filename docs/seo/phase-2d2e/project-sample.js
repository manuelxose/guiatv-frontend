// 2D-2E, no database: re-parse the spellings of the 2D-2D review sheet (production 20261020, seed
// 20261020) with the 2D-2E title rules and project the effect on the proposed entities. A sample
// projection, not a replay: rules that need the whole day (corroboration of " - ", cross-kind
// holds) are reported as "needs the day". Usage, from apps/backend after `npm run build`:
//   node ../../docs/seo/phase-2d2e/project-sample.js ../../docs/seo/phase-2d2d/identity-20261020-20261020-review.csv
const fs = require('node:fs');
const path = require('node:path');
const dist = path.resolve('dist');
const { parseEpgTitle, slugifyEntityTitle } = require(path.join(dist, 'domain/services/contentIdentity'));
const { parseCsv, clopperPearson } = require(path.join(dist, 'application/services/ContentIdentityAudit'));

// The 2D-2D machine flags (phase-2d2d/machine-flags.js), applied to what would be stored: the
// proposed title and path, not the original spellings (which are kept unchanged by design).
const FLAGS = {
  numbered_part: /\(\d+\)/,
  subtitle_separator: / · |\s-\s/,
  episode_word: /\b(episodio|cap[ií]tulo|ep\.?)\s*\d+/i,
  season_episode_marker: /\bT\d+\s*E\d+\b/i,
  trailing_number: /\s\d{1,4}$/,
  slot_word: /^(repetici[oó]n|programaci[oó]n|cierre|avance|resumen|televenta|teletienda|fin de emisi[oó]n|carta de ajuste|infocomerciales?|\+ ?que)/i,
};
const flagsOf = (title, p) => Object.keys(FLAGS).filter((k) => FLAGS[k].test(title) || (p && FLAGS[k].test(p.replace(/-/g, ' '))));

const rows = parseCsv(fs.readFileSync(process.argv[2], 'utf8'));
const out = { source: path.basename(process.argv[2]), strata: {}, autoCreate: null, examples: {} };
const project = (r) => {
  const spellings = r.spellings.split(' | ').filter(Boolean);
  const parsed = spellings.map((s) => parseEpgTitle(s));
  const states = [...new Set(parsed.map((p) => p.resolutionState))].sort();
  const keys = [...new Set(parsed.filter((p) => p.normalizedWorkKey && p.resolutionState !== 'uncertain').map((p) => p.normalizedWorkKey))];
  const workTitle = parsed.filter((p) => p.proposedWorkTitle && p.resolutionState !== 'uncertain').map((p) => p.proposedWorkTitle).sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
  let outcome;
  if (parsed.every((p) => p.resolutionState === 'generic')) outcome = 'removed_generic_slot';
  else if (parsed.every((p) => p.resolutionState === 'no_work' || p.resolutionState === 'unkeyable')) outcome = 'removed_no_work';
  else if (states.includes('uncertain') && !keys.length) outcome = r.kind === 'movie' ? 'kept_film_title' : 'uncertain_needs_day';
  else if (keys.length === 1 && keys[0] === r.normalized_title) outcome = states.includes('episode') ? 'unchanged_key_episode_spellings' : 'unchanged';
  else outcome = 'normalized_to_work';
  const newPath = workTitle ? slugifyEntityTitle(workTitle) : null;
  return {
    candidate_id: r.candidate_id, kind: r.kind, oldTitle: r.epg_title, oldKey: r.normalized_title, oldPath: r.proposed_path,
    states, newKeys: keys, newTitle: workTitle ?? null, newSlug: newPath, outcome,
    oldFlags: flagsOf(r.epg_title, r.proposed_path), newFlags: outcome.startsWith('removed') || outcome === 'uncertain_needs_day' ? [] : flagsOf(workTitle ?? r.epg_title, newPath ?? ''),
  };
};
const tally = (list, f) => list.reduce((acc, x) => ((acc[f(x)] = (acc[f(x)] ?? 0) + 1), acc), {});
const projected = rows.map((r) => ({ r, p: project(r) }));
for (const stratum of [...new Set(rows.flatMap((r) => r.strata.split(';')))].sort()) {
  const list = projected.filter(({ r }) => r.strata.split(';').includes(stratum)).map(({ p }) => p);
  out.strata[stratum] = { rows: list.length, outcomes: tally(list, (p) => p.outcome) };
}
const auto = projected.filter(({ r }) => r.strata.split(';').includes('auto_create')).map(({ p }) => p);
const share = (n) => ({ n, of: auto.length, observed: n / auto.length, ci95: clopperPearson(n, auto.length) });
const flaggedBefore = auto.filter((p) => p.oldFlags.length).length;
const flaggedAfter = auto.filter((p) => p.newFlags.length).length;
const changed = auto.filter((p) => p.outcome !== 'unchanged' && p.outcome !== 'kept_film_title' && p.outcome !== 'unchanged_key_episode_spellings').length;
// Within the sample only (a lower bound on consolidation): proposed entities that now share a work key.
const byKey = tally(auto.filter((p) => p.newKeys.length === 1), (p) => `${p.kind}|${p.newKeys[0]}`);
out.autoCreate = {
  rows: auto.length,
  population: 2121,
  outcomes: tally(auto, (p) => p.outcome),
  identityChanged: share(changed),
  machineFlaggedBefore: share(flaggedBefore),
  machineFlaggedAfter: share(flaggedAfter),
  flagsAfter: tally(auto.flatMap((p) => p.newFlags), (f) => f),
  consolidatedWithinSample: Object.values(byKey).filter((n) => n > 1).reduce((a, n) => a + n - 1, 0),
};
for (const p of projected.map(({ p }) => p)) {
  const list = (out.examples[p.outcome] ||= []);
  if (list.length < 12) list.push(`${p.oldTitle} [${p.kind}] ${p.oldPath || '-'} -> ${p.newTitle ?? '∅'} ${p.newSlug ? `(${p.newSlug})` : ''}${p.newFlags.length ? ` flags=${p.newFlags}` : ''}`);
}
out.rows = projected.map(({ p }) => p);
console.log(JSON.stringify(out, null, 1));
