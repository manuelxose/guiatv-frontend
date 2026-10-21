// Ad hoc, read-only: machine-flag prevalence over every trace of one day. Not labels.
const { installReadOnlyGuard } = require('./dist/scripts/readOnlyGuard');
const guard = installReadOnlyGuard();
const { connectMongoDB, disconnectMongoDB } = require('./dist/config/mongodb');
const { TVReadAiringModel } = require('./dist/infrastructure/database/models/TVReadAiring.model');
const { ProgramModel } = require('./dist/infrastructure/database/models/Program.model');
const { createContentIdentityIngestion, observationsFromAirings } = require('./dist/application/services/ContentIdentityIngestion');
const { slugifyEntityTitle } = require('./dist/domain/services/contentIdentity');
const FLAGS = {
  numbered_part: /\(\d+\)/,
  subtitle_separator: / · |\s-\s/,
  episode_word: /\b(episodio|cap[ií]tulo|ep\.?)\s*\d+/i,
  season_episode_marker: /\bT\d+\s*E\d+\b/i,
  date_in_title: /\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i,
  trailing_number: /\s\d{1,4}$/,
  slot_word: /^(repetici[oó]n|programaci[oó]n|cierre|avance|resumen|televenta|teletienda|fin de emisi[oó]n|carta de ajuste|infocomerciales?|\+ ?que)/i,
};
(async () => {
  await connectMongoDB();
  const date = process.argv[2];
  const airings = await TVReadAiringModel.find({ date }, { id: 1, program: 1, sourceProvenance: 1 }).lean();
  const ids = airings.map((a) => a.sourceProvenance?.legacyProgramIds?.[0]).filter(Boolean);
  const years = new Map((await ProgramModel.find({ id: { $in: ids }, year: { $exists: true } }, { id: 1, year: 1 }).lean()).map((p) => [p.id, p.year]));
  const y = new Map(airings.map((a) => [a.id, years.get(a.sourceProvenance?.legacyProgramIds?.[0])]));
  const traces = [];
  await createContentIdentityIngestion('shadow').run(date, observationsFromAirings(airings, y), traces);
  const created = traces.filter((t) => t.decision === 'create');
  const flags = {}; const examples = {};
  let anyFlag = 0, anyFlagWithPath = 0;
  for (const t of created) {
    const hit = Object.entries(FLAGS).filter(([, re]) => t.spellings.some((s) => re.test(s)) || re.test(t.title)).map(([k]) => k);
    hit.forEach((k) => { flags[k] = (flags[k] || 0) + 1; (examples[k] ||= []).length < 6 && examples[k].push(`${t.title} -> ${t.path ?? '-'}`); });
    if (hit.length) { anyFlag++; if (t.path) anyFlagWithPath++; }
  }
  const bySlug = new Map();
  for (const t of created) { const s = slugifyEntityTitle(t.title) ?? t.key; bySlug.set(s, [...(bySlug.get(s) || []), t]); }
  const split = [...bySlug.values()].filter((l) => l.length > 1);
  const kindPairs = {};
  split.forEach((l) => { const k = [...new Set(l.map((t) => t.kind))].sort().join('+'); kindPairs[k] = (kindPairs[k] || 0) + 1; });
  const splitWithTwoPaths = split.filter((l) => l.filter((t) => t.path).length > 1).length;
  // Same key under the unknown kind and a known kind: the unknown sighting is unresolved, not a second entity.
  console.log(JSON.stringify({
    date, created: created.length, flaggedEntities: anyFlag, flaggedWithPath: anyFlagWithPath, flags, examples,
    sharedSlugGroups: split.length, sharedSlugEntities: split.reduce((n, l) => n + l.length, 0), kindPairs, splitWithTwoPaths,
    splitExamples: split.slice(0, 15).map((l) => l.map((t) => `${t.kind}:${t.title}:${t.path ?? '-'}`).join(' / ')),
  }, null, 1));
  await disconnectMongoDB();
  console.error('guard', JSON.stringify(guard.summary()));
})();
