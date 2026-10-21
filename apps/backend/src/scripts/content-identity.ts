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
 *   node dist/scripts/content-identity.js queue [limit]                 review queue (reads)
 *   node dist/scripts/content-identity.js pathless [limit]              stored entities without a path, by reason (reads)
 *   node dist/scripts/content-identity.js approve <titleKeyId> <entityId> --by <name> [--note <text>]
 *   node dist/scripts/content-identity.js reject <titleKeyId> --by <name> [--note <text>]
 *
 * `approve` and `reject` need the write flags (CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES
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
} from '../infrastructure/repositories/MongoContentIdentityRepositories';
import { ContentIdentityService } from '../application/services/ContentIdentityService';
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
import { adjudicateEvidence, evaluateEvidence, TmdbSearchCheck } from '../application/services/ContentIdentityEvidence';
import { readContentIdentityFlags } from '../shared/config/contentEntities';
import { installReadOnlyGuard } from './readOnlyGuard';

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
  const guard = command === 'approve' || command === 'reject' ? null : installReadOnlyGuard();
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
    if (command === 'pathless') return await pathless(Number(args[0]) || 10_000);
    if (command === 'queue') return console.log(JSON.stringify(await service.reviewQueue(Number(args[0]) || 50), null, 2));
    if (command !== 'approve' && command !== 'reject') throw new Error('usage: shadow|queue|pathless|approve|reject (see file header)');
    if (!flags.writes) throw new Error('review writes need CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES=<database name>');
    const by = option(args, '--by') as string;
    const note = option(args, '--note');
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
