/**
 * Phase 3B reviewer commands (no database; files only). Run on the server shell, from a copy of the
 * review sheet made by `content-identity shadow --sample`.
 *
 *   content-identity roster add <name> --roster <roster.json>          owner only: prints the person's token once, stores its hash
 *   content-identity roster add "AI <model> <letter>" --ai --authorized-by <owner> --authorization-note <text> --roster <roster.json>
 *                                                                      an AI reviewer, under the owner's recorded authorisation; reports count it as `ai`
 *   content-identity review open <sheet.csv> --ledger <ledger.jsonl> --by <name>
 *   REVIEW_TOKEN=… content-identity review next <sheet.csv> --ledger <l> --roster <r> --by <name> [--limit N] [--second-only]
 *   REVIEW_TOKEN=… content-identity review decide <sheet.csv> --ledger <l> --roster <r> --by <name> --row <candidate_id>
 *       --decision accept|reject|uncertain [--error-category <c>] [--kind-ok y|n] [--tmdb-ok y|n] [--path-ok y|n]
 *       [--critical y|n] [--duplicate-of <id>] [--note <text>] [--correct]
 *   content-identity review report <sheet.csv> --ledger <l>             progress, precision, second reviews, disagreements
 *   content-identity review export <sheet.csv> --ledger <l> --out <dir> primary.csv, second.csv, report.json, ledger copy (exit 2 until the gate passes)
 *   content-identity review verify <ledger.jsonl>                       checks the hash chain
 *
 * The ledger is append-only and hash-chained; the gate is the unchanged `score --verify` (300 labels,
 * 98 % precision, 50 second-reviewer rows). Nothing here accepts a machine verdict as a label.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseCsv, REVIEW_COLUMNS, toCsv } from '../application/services/ContentIdentityAudit';
import { normalizeReviewerName } from '../application/services/ContentIdentityService';
import {
  authenticateMember, hashToken, reviewerName, ledgerReport, nextRows, openLedger, parseLedger, parseRoster, recordDecision, toSheets, type LedgerEntry, type SubLabels,
} from '../application/services/ContentIdentityReviewLedger';

const option = (args: string[], name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const need = (args: string[], name: string) => {
  const v = option(args, name);
  if (!v) throw new Error(`${name} is required`);
  return v;
};

/** One writer at a time: the chain's `prev` is read and appended under a lock file. */
function withLock<T>(file: string, work: () => T): T {
  const lock = `${file}.lock`;
  for (let attempt = 0; ; attempt++) {
    try {
      fs.closeSync(fs.openSync(lock, 'wx'));
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST' || attempt >= 50) throw new Error(`ledger is locked (${lock}); remove it only if no review command is running`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  try {
    return work();
  } finally {
    fs.rmSync(lock, { force: true });
  }
}

const readLedger = (file: string): LedgerEntry[] => parseLedger(fs.readFileSync(file, 'utf8'));
const sheetOf = (args: string[]) => parseCsv(fs.readFileSync(args[0], 'utf8'));
const MACHINE_ONLY = new Set(['reviewer', 'identity_ok', 'kind_ok', 'duplicate_of', 'tmdb_ok', 'path_ok', 'critical', 'error_category', 'notes']);

/** Returns the process exit code. */
export function runReviewCommand(command: string, args: string[]): number {
  if (command === 'roster') {
    if (args[0] !== 'add') throw new Error('usage: roster add <name> --roster <roster.json>');
    const file = need(args, '--roster');
    const ai = args.includes('--ai');
    const name = reviewerName(args[1], ai ? 'ai' : undefined);
    if (ai) {
      // Owner-authorised AI review (the owner's instruction is quoted in the roster, not assumed).
      const by = option(args, '--authorized-by');
      const note = option(args, '--authorization-note');
      if (!by || !note) throw new Error('--ai needs --authorized-by <owner name> and --authorization-note <what was authorised>');
      const existing = fs.existsSync(file) ? parseRoster(fs.readFileSync(file, 'utf8')) : undefined;
      if (existing && !existing.aiAuthorization) {
        existing.aiAuthorization = { by: normalizeReviewerName(by), at: new Date().toISOString(), note };
        fs.writeFileSync(file, JSON.stringify(existing, null, 2) + '\n', { mode: 0o600 });
      } else if (!existing) {
        fs.writeFileSync(file, JSON.stringify({ version: 1, aiAuthorization: { by: normalizeReviewerName(by), at: new Date().toISOString(), note }, reviewers: [] }, null, 2) + '\n', { mode: 0o600 });
      }
    }
    const roster = fs.existsSync(file) ? parseRoster(fs.readFileSync(file, 'utf8')) : { version: 1 as const, reviewers: [] };
    if (roster.reviewers.some((r) => r.name.toLowerCase() === name.toLowerCase())) throw new Error(`${name} is already on the roster`);
    const token = randomBytes(24).toString('base64url');
    roster.reviewers.push({ name, tokenSha256: hashToken(token), ...(ai ? { kind: 'ai' as const } : {}) });
    fs.writeFileSync(file, JSON.stringify(roster, null, 2) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ reviewer: name, token, note: 'shown once: give it to that person only; the roster keeps its hash' }));
    return 0;
  }
  if (command !== 'review') throw new Error('unknown command');
  const [sub, ...rest] = args;
  if (sub === 'verify') {
    try {
      readLedger(rest[0]);
      console.log(JSON.stringify({ ok: true }));
      return 0;
    } catch (e) {
      console.log(JSON.stringify({ ok: false, reason: (e as Error).message }));
      return 2;
    }
  }
  const ledger = need(rest.slice(1), '--ledger');
  const sheet = () => sheetOf(rest);
  if (sub === 'open') {
    const by = need(rest, '--by');
    withLock(ledger, () => {
      if (fs.existsSync(ledger)) throw new Error(`${ledger} already exists`);
      fs.writeFileSync(ledger, JSON.stringify(openLedger(sheet(), by, new Date())) + '\n', { flag: 'wx', mode: 0o640 });
    });
    console.log(JSON.stringify({ ledger, rows: sheet().length }));
    return 0;
  }
  if (sub === 'report') {
    const report = ledgerReport(sheet(), readLedger(ledger));
    console.log(JSON.stringify(report, null, 2));
    return report.chain.ok ? 0 : 2;
  }
  if (sub === 'export') {
    const out = need(rest, '--out');
    const entries = readLedger(ledger);
    const { primary, second } = toSheets(sheet(), entries);
    const report = ledgerReport(sheet(), entries);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'primary.csv'), toCsv(primary, REVIEW_COLUMNS));
    fs.writeFileSync(path.join(out, 'second.csv'), toCsv(second, REVIEW_COLUMNS));
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    fs.copyFileSync(ledger, path.join(out, 'ledger.jsonl'));
    console.log(JSON.stringify({ out, gate: report.score.gate }, null, 2));
    return report.score.gate.pass ? 0 : 2;
  }
  if (sub === 'next' || sub === 'decide') {
    const roster = parseRoster(fs.readFileSync(need(rest, '--roster'), 'utf8'));
    const member = authenticateMember(roster, need(rest, '--by'), process.env.REVIEW_TOKEN);
    const by = member.name;
    if (sub === 'next') {
      const rows = nextRows(readLedger(ledger), sheet(), by, Number(option(rest, '--limit')) || 10, rest.includes('--second-only'));
      console.log(JSON.stringify(rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !MACHINE_ONLY.has(k)))), null, 2));
      return 0;
    }
    const labels: SubLabels = {};
    for (const [flag, key] of [['--kind-ok', 'kind_ok'], ['--tmdb-ok', 'tmdb_ok'], ['--path-ok', 'path_ok'], ['--critical', 'critical'], ['--duplicate-of', 'duplicate_of']] as const) {
      const v = option(rest, flag);
      if (v) labels[key] = v;
    }
    const entry = withLock(ledger, () => {
      const entries = readLedger(ledger);
      const d = recordDecision(entries, sheet(), {
        rowId: need(rest, '--row'), decision: need(rest, '--decision'), reviewer: by, reviewerKind: member.kind, errorCategory: option(rest, '--error-category'),
        labels, note: option(rest, '--note'), correct: rest.includes('--correct'),
      }, new Date());
      fs.appendFileSync(ledger, JSON.stringify(d) + '\n');
      return d;
    });
    console.log(JSON.stringify({ recorded: entry.seq, row: entry.rowId, decision: entry.decision, reviewer: entry.reviewer }));
    return 0;
  }
  throw new Error('usage: review open|next|decide|report|export|verify (see file header)');
}
