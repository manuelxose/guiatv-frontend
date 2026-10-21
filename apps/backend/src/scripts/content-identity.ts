/**
 * Content identity operations (2D-2). No HTTP endpoint exists for these; run on the server shell.
 *
 *   node dist/scripts/content-identity.js shadow 20261020 [20261022]   read-only matching report per stored day
 *       [--sample N --out <dir> [--seed S] [--precision-sample M]]      plus a deterministic sample per decision class
 *                                                                       and a review sheet (2D-2D; see the review protocol)
 *   node dist/scripts/content-identity.js score <review.csv> [--verify <second.csv>] [--min-labelled M] [--min-verified V]
 *                                                                       scores a labelled sheet (no database); the gate needs
 *                                                                       a second reviewer's sheet (2D-2E review protocol)
 *   node dist/scripts/content-identity.js evidence <day.jsonl> [<other-day.jsonl> ...] [--tmdb <checks.json>] [--out <verdicts.jsonl>]
 *                                                                       machine-evidence verdicts for the first day's traces
 *                                                                       (`trace-dump.js` files; no database); exit 2 on a
 *                                                                       violation. Not labels: never opens the write gate (2D-2F)
 *   node dist/scripts/content-identity.js evidence-sheet --day <traces>:<verdicts> [--day …] --out <sheet.csv> [--seed S] [--size N]
 *                                                                       review sheet drawn from the identities the evidence gate accepts, with the
 *                                                                       machine's independent evidence beside each row (no database)
 *   node dist/scripts/content-identity.js review|roster …              named-reviewer ledger over a review sheet (3B; file header of
 *                                                                       content-identity-review.ts): open, next, decide, report, export, verify
 *   node dist/scripts/content-identity.js canonical-audit <day.jsonl> [--verdicts <verdicts.jsonl>] [--registry] [--out <report.json>]
 *                                                                       machine-readable path/collision/quarantine report of a replay (no database);
 *                                                                       with --registry also audits stored entities and slugs (reads, guarded)
 *   node dist/scripts/content-identity.js canary-check <allowlist.json>  revalidates each allowlisted entity as a public read would (reads, guarded); exit 2 on any failure
 *   node dist/scripts/content-identity.js queue [limit]                 review queue (reads)
 *   node dist/scripts/content-identity.js pathless [limit]              stored entities without a path, by reason (reads)
 *   node dist/scripts/content-identity.js approve <titleKeyId> <entityId> --by <name> [--note <text>]
 *   node dist/scripts/content-identity.js reject <titleKeyId> --by <name> [--note <text>]
 *   node dist/scripts/content-identity.js verify <entityId> --by <name> --note <text>   candidate -> active, a named person's decision
 *   node dist/scripts/content-identity.js rollback [--since <ISO date>] [--apply]       removes provisional candidates (dry run without --apply)
 *
 * `approve`, `reject`, `verify` and `rollback --apply` need the write flags (CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES
 * set to the database name) and a named reviewer. Every other command runs under the read-only
 * guard: a write or DDL command ends the process (exit 97) before it is sent. Simulating a whole
 * day needs CONTENT_IDENTITY_MAX_CREATES above the day's creations (the default cap is 1000).
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { TVReadAiringModel } from '../infrastructure/database/models/TVReadAiring.model';
import { ProgramModel } from '../infrastructure/database/models/Program.model';
import {
  MongoContentEntityRepository,
  MongoContentSlugRepository,
  MongoContentTitleKeyRepository,
  readRegistryRows,
} from '../infrastructure/repositories/MongoContentIdentityRepositories';
import { ContentIdentityService } from '../application/services/ContentIdentityService';
import { rollbackProvisional } from '../application/services/ContentIdentityRollback';
import {
  createContentIdentityIngestion,
  IdentityTrace,
  observationsFromAirings,
} from '../application/services/ContentIdentityIngestion';
import {
  auditClasses,
  buildReviewRows,
  parseCsv,
  sampleTraces,
  scoreReview,
  summarizeTraces,
  toCsv,
} from '../application/services/ContentIdentityAudit';
import { PublicContentEntityService } from '../application/services/PublicContentEntityService';
import { parseCanaryAllowlist } from '../application/services/EntityPublicReadPolicy';
import { auditProposedPaths, auditRegistry } from '../application/services/ContentIdentityCanonicalAudit';
import { buildEvidenceSheet, EVIDENCE_SHEET_COLUMNS } from '../application/services/ContentIdentityReviewLedger';
import { adjudicateEvidence, evaluateEvidence, EvidenceVerdict, TmdbSearchCheck } from '../application/services/ContentIdentityEvidence';
import { readContentIdentityFlags } from '../shared/config/contentEntities';
import { installReadOnlyGuard } from './readOnlyGuard';
import { runReviewCommand } from './content-identity-review';

const option = (args: string[], name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

function* dates(from: string, to: string) {
  const day = new Date(`${from.slice(0, 4)}-${from.slice(4, 6)}-${from.slice(6, 8)}T12:00:00Z`);
  for (let i = 0; i < 31; i++, day.setUTCDate(day.getUTCDate() + 1)) {
    const d = day.toISOString().slice(0, 10).replace(/-/g, '');
    if (d > to) return;
    yield d;
  }
}

interface SampleOptions {
  perClass: number;
  precision: number;
  seed?: string;
  out: string;
}

async function shadow(from: string, to: string, sample?: SampleOptions) {
  if (!/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) throw new Error('dates are YYYYMMDD');
  const ingestion = createContentIdentityIngestion('shadow');
  for (const date of dates(from, to)) {
    const airings = await TVReadAiringModel.find({ date }, { id: 1, program: 1, sourceProvenance: 1, 'channel.id': 1, 'channel.name': 1, 'channel.aliases': 1, 'airing.start': 1, 'airing.end': 1 }).lean().exec();
    // The EPG year lives on the source programme, not on the airing.
    const programIds = airings.map((a: any) => a.sourceProvenance?.legacyProgramIds?.[0]).filter(Boolean);
    const programs = await ProgramModel.find(
      { id: { $in: programIds }, year: { $exists: true } },
      { id: 1, year: 1, 'sourceProvenance.yearProvenance.rawXmltvYear': 1 }
    ).lean().exec();
    const sourceOf = (a: any) => a.sourceProvenance?.legacyProgramIds?.[0];
    const years = new Map(programs.map((p: any) => [p.id, p] as const));
    const yearByAiring = new Map(airings.map((a: any) => [a.id, (years.get(sourceOf(a)) as any)?.year] as const));
    const rawYearByAiring = new Map(airings.map((a: any) => [a.id, (years.get(sourceOf(a)) as any)?.sourceProvenance?.yearProvenance?.rawXmltvYear] as const));
    const traces: IdentityTrace[] | undefined = sample ? [] : undefined;
    const report = await ingestion.run(date, observationsFromAirings(airings, yearByAiring, rawYearByAiring), traces);
    console.log(JSON.stringify(report));
    if (sample && traces) writeSample(date, report, traces, sample);
  }
}

/** Titles, kinds, TMDB ids and planned paths only: traces carry no airing or media ids, hosts or settings. */
function writeSample(date: string, report: unknown, traces: IdentityTrace[], opts: SampleOptions) {
  const seed = opts.seed ?? date;
  const classes = auditClasses(traces);
  const sample = {
    date,
    seed,
    perClass: opts.perClass,
    precisionSample: opts.precision,
    report,
    summary: summarizeTraces(traces),
    classes: Object.fromEntries(
      [...classes].map(([c, list]) => [c, { population: list.length, rows: sampleTraces(list, opts.perClass, seed, c) }])
    ),
  };
  fs.mkdirSync(opts.out, { recursive: true });
  const base = path.join(opts.out, `identity-${date}-${seed}`);
  fs.writeFileSync(`${base}-sample.json`, JSON.stringify(sample, null, 2) + '\n');
  fs.writeFileSync(`${base}-review.csv`, toCsv(buildReviewRows(traces, { seed, perClass: opts.perClass, precision: opts.precision })));
  console.error(`sample written: ${base}-sample.json, ${base}-review.csv`);
}

/** `repairable`: a safe path is free and the next run that sees the entity allocates it; every other reason is intentional. */
async function pathless(limit: number) {
  const entities = await new MongoContentEntityRepository().findWithoutCanonicalPath(new Date(), limit);
  const plans = await createContentIdentityIngestion('shadow').planPaths(entities);
  const taken = new Set(
    (await new MongoContentSlugRepository().findByPaths([...plans.values()].flatMap((p) => p.paths))).map((s) => s.path)
  );
  const rows = entities.map((e) => {
    const plan = plans.get(e.entityId)!;
    const reason = plan.paths.some((p) => !taken.has(p)) ? 'repairable' : plan.paths.length ? 'taken' : plan.blocked[0];
    return { entityId: e.entityId, title: e.title, kind: e.kind, year: e.year, tmdb: e.externalIds?.tmdb, reason, refused: plan.blocked };
  });
  const byReason: Record<string, number> = {};
  rows.forEach((r) => (byReason[r.reason] = (byReason[r.reason] ?? 0) + 1));
  console.log(JSON.stringify({ total: rows.length, byReason, rows }, null, 2));
}

/**
 * 3B: path/collision/quarantine report of a replay, and (with --registry) of what is stored. Exit 2
 * on any blocker. The registry read is a plain `find` under the read-only guard.
 */
async function canonicalAudit(args: string[], registry: boolean) {
  const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!file) throw new Error('usage: canonical-audit <day.jsonl> [--verdicts <verdicts.jsonl>] [--registry] [--out <report.json>]');
  const verdictsFile = option(args, '--verdicts');
  const accepted = new Set<string>();
  if (verdictsFile) {
    for (const line of fs.readFileSync(verdictsFile, 'utf8').split('\n').filter(Boolean)) {
      const v = JSON.parse(line) as { decision?: string; identity?: string };
      if (v.decision === 'AUTO_ACCEPT' && v.identity) accepted.add(v.identity);
    }
  }
  const proposed = auditProposedPaths(readTraces(file), accepted);
  const stored = registry ? await (async () => { const { entities, slugs } = await readRegistryRows(); return auditRegistry(entities, slugs); })() : undefined;
  const report = { proposed, registry: stored, pass: proposed.pass && (stored?.pass ?? true) };
  const out = option(args, '--out');
  if (out) fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pass: report.pass, proposed: proposed.summary, collisions: proposed.collisions.length, registry: stored?.summary }, null, 2));
  process.exitCode = report.pass ? 0 : 2;
}

/**
 * 3B: revalidates every allowlisted canary entity exactly as a read would (`PublicContentEntityService`),
 * plus the registry audit findings that touch them. Reads only, under the guard. Exit 2 on any failure:
 * run it from cron against the live allowlist as the canonical-consistency monitor.
 */
async function canaryCheck(args: string[]) {
  const file = args[0];
  if (!file) throw new Error('usage: canary-check <allowlist.json> [--max N]');
  const entries = parseCanaryAllowlist(fs.readFileSync(file, 'utf8'), Number(option(args, '--max') ?? process.env.CONTENT_ENTITY_CANARY_MAX));
  const service = new PublicContentEntityService(new ContentIdentityService(
    new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository()
  ));
  const { entities, slugs } = await readRegistryRows();
  const audit = auditRegistry(entities, slugs);
  const failures: Array<{ entityId: string; canonicalPath: string; problem: string }> = [];
  for (const e of entries) {
    const r = await service.resolve(e.canonicalPath);
    if (r.status !== 'canonical') failures.push({ entityId: e.entityId, canonicalPath: e.canonicalPath, problem: `resolves as ${r.status}` });
    else if (r.entity.entityId !== e.entityId) failures.push({ entityId: e.entityId, canonicalPath: e.canonicalPath, problem: `path is owned by ${r.entity.entityId}` });
    for (const f of audit.findings.filter((x) => x.severity === 'blocker' && (x.entityId === e.entityId || x.path === e.canonicalPath))) {
      failures.push({ entityId: e.entityId, canonicalPath: e.canonicalPath, problem: f.code });
    }
  }
  console.log(JSON.stringify({ ok: !failures.length, checked: entries.length, registryBlockers: audit.summary.severity.blocker, failures }, null, 2));
  process.exitCode = failures.length ? 2 : 0;
}

/** A `trace-dump.js` file: one `{ report }` line, then one trace per line. */
const readTraces = (file: string): IdentityTrace[] =>
  fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.startsWith('{"candidateId"')).map((line) => JSON.parse(line));

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'score') {
    const rows = parseCsv(fs.readFileSync(args[0], 'utf8'));
    const minLabelled = Number(option(args, '--min-labelled')) || 300;
    const minVerified = option(args, '--min-verified') === undefined ? 50 : Number(option(args, '--min-verified'));
    const verify = option(args, '--verify');
    const score = scoreReview(rows, { precision: 0.98, minLabelled, minVerified }, verify ? parseCsv(fs.readFileSync(verify, 'utf8')) : undefined);
    console.log(JSON.stringify(score, null, 2));
    process.exitCode = score.gate.pass ? 0 : 2;
    return;
  }
  if (command === 'evidence-sheet') {
    const days = args.flatMap((a, i) => (args[i - 1] === '--day' ? [a] : [])).map((pair) => {
      const [traces, verdicts] = pair.split(':');
      return { traces: readTraces(traces), verdicts: fs.readFileSync(verdicts, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as EvidenceVerdict) };
    });
    const out = option(args, '--out');
    if (!days.length || !out) throw new Error('usage: evidence-sheet --day <traces.jsonl>:<verdicts.jsonl> [--day …] --out <sheet.csv> [--seed S] [--size N]');
    const { population, rows } = buildEvidenceSheet(days, { seed: option(args, '--seed') ?? 'phase-3b', size: Number(option(args, '--size')) || 360 });
    fs.writeFileSync(out, toCsv(rows, EVIDENCE_SHEET_COLUMNS));
    console.log(JSON.stringify({ population, rows: rows.length, out }));
    return;
  }
  if (command === 'canonical-audit' && !args.includes('--registry')) return await canonicalAudit(args, false);
  if (command === 'review' || command === 'roster') {
    process.exitCode = runReviewCommand(command, args);
    return;
  }
  if (command === 'evidence') {
    const out = option(args, '--out');
    const [day, ...others] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')).map(readTraces);
    if (!day) throw new Error('usage: evidence <day.jsonl> [<other-day.jsonl> ...] [--tmdb <checks.json>] [--out <file>]');
    const tmdbFile = option(args, '--tmdb');
    const checks: TmdbSearchCheck[] = tmdbFile ? JSON.parse(fs.readFileSync(tmdbFile, 'utf8')) : [];
    const verdicts = adjudicateEvidence(day, others, new Map(checks.map((c) => [`${c.type}:${c.id}`, c])));
    if (out) fs.writeFileSync(out, verdicts.map((v) => JSON.stringify(v)).join('\n') + '\n');
    const result = evaluateEvidence(verdicts);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'pass' ? 0 : 2;
    return;
  }
  const writes = ['approve', 'reject', 'verify'].includes(command) || (command === 'rollback' && args.includes('--apply'));
  const guard = writes ? null : installReadOnlyGuard();
  await connectMongoDB();
  try {
    const flags = readContentIdentityFlags(process.env, mongoose.connection.db?.databaseName);
    const service = new ContentIdentityService(
      new MongoContentEntityRepository(),
      new MongoContentSlugRepository(),
      new MongoContentTitleKeyRepository(),
      'review'
    );
    if (command === 'shadow') {
      const positional = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
      const perClass = Number(option(args, '--sample'));
      const out = option(args, '--out');
      if (option(args, '--sample') !== undefined && (!Number.isInteger(perClass) || perClass < 1 || !out)) {
        throw new Error('--sample needs a positive count and --out <dir>');
      }
      const sample = perClass && out ? { perClass, out, seed: option(args, '--seed'), precision: Number(option(args, '--precision-sample')) || 300 } : undefined;
      return await shadow(positional[0], positional[1] ?? positional[0], sample);
    }
    if (command === 'canonical-audit') return await canonicalAudit(args, true);
    if (command === 'canary-check') return await canaryCheck(args);
    if (command === 'pathless') return await pathless(Number(args[0]) || 10_000);
    if (command === 'queue') return console.log(JSON.stringify(await service.reviewQueue(Number(args[0]) || 50), null, 2));
    if (command === 'rollback') {
      if (writes && !flags.writes) throw new Error('rollback --apply needs CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES=<database name>');
      const since = option(args, '--since');
      return console.log(JSON.stringify(await rollbackProvisional({ apply: writes, since: since ? new Date(since) : undefined }), null, 2));
    }
    if (!['approve', 'reject', 'verify'].includes(command)) throw new Error('usage: shadow|queue|pathless|approve|reject|verify|rollback (see file header)');
    if (!flags.writes) throw new Error('review writes need CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES=<database name>');
    const by = option(args, '--by') as string;
    const note = option(args, '--note');
    if (command === 'verify') {
      const e = await service.verifyEntity(args[0], by, note as string);
      return console.log(JSON.stringify({ command, entityId: e.entityId, status: e.status, by }));
    }
    const ok =
      command === 'approve' ? await service.reviewTitleKey(args[0], args[1], by, note) : await service.rejectTitleKey(args[0], by, note);
    console.log(JSON.stringify({ command, id: args[0], updated: ok }));
  } finally {
    await disconnectMongoDB();
    if (guard) console.error(`read-only guard: ${JSON.stringify(guard.summary())}`);
  }
}

main().catch((error) => {
  console.error(String(error?.message || error));
  process.exit(1);
});
