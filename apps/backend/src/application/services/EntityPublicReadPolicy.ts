/**
 * Phase 3B: who may see an entity page. One policy object decides, per request, whether the public
 * entity read serves an entity or falls back to the legacy page, so the 3A flag alone can never
 * expose the whole eligible corpus.
 *
 *   CONTENT_ENTITY_PUBLIC_READ_ENABLED=true     master switch (3A); alone it serves nothing
 *   CONTENT_ENTITY_PUBLIC_READ_SCOPE=canary|all `all` is the 3A behaviour and must be written out
 *   CONTENT_ENTITY_CANARY_FILE=<json>           allowlist {version:1, entities:[{entityId, canonicalPath, approvedBy, approvedAt}]}
 *   CONTENT_ENTITY_CANARY_MAX=<n>               visible-entity ceiling (≤ HARD_CAP); a longer file disables the canary
 *   CONTENT_ENTITY_PUBLIC_READ_KILL=true | CONTENT_ENTITY_KILL_FILE=<path that exists>   instant legacy fallback, no restart
 *
 * Every refusal in canary scope answers like "disabled" (legacy page), never 404/503: the canary can
 * only add pages, never remove existing ones. The allowlist file is re-read when it changes.
 */
import fs from 'node:fs';
import { Logger } from '@/shared/utils/logger';
import { CERTIFICATION_HARD_CAP } from '@/domain/services/contentCertification';
import { normalizeReviewerName } from './ContentIdentityService';

/** The canary is a handful of pages; a larger list is a configuration mistake, not a rollout. */
export const CANARY_HARD_CAP = CERTIFICATION_HARD_CAP;
const ENTITY_PATH = /^\/(peliculas|series|programas)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RECHECK_MS = 5_000;
/** ponytail: in-memory breaker, per process, until restart; a shared breaker needs a store. */
const BREAKER_ERRORS = 5;
const BREAKER_WINDOW_MS = 60_000;

export type ReadMode = 'off' | 'canary' | 'all';
export interface CanaryEntry { entityId: string; canonicalPath: string; approvedBy: string; approvedAt: string }
export type Decision =
  | { action: 'entity'; mode: 'all'; entry?: undefined }
  | { action: 'entity'; mode: 'canary'; entry: CanaryEntry }
  | { action: 'legacy'; reason: string };

export interface PolicyDeps {
  env?: NodeJS.ProcessEnv;
  now?: () => number;
  stat?: (file: string) => { mtimeMs: number; size: number } | null;
  read?: (file: string) => string;
  exists?: (file: string) => boolean;
  warn?: (message: string) => void;
}

const defaultStat = (file: string) => { try { const s = fs.statSync(file); return { mtimeMs: s.mtimeMs, size: s.size }; } catch { return null; } };

const logger = new Logger('EntityCanary');
export const normalizeEntityPath = (path: string) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

/** The allowlist document as entries; throws on anything that is not a clean, bounded list of named approvals. */
export function parseCanaryAllowlist(text: string, max: number): CanaryEntry[] {
  if (!Number.isInteger(max) || max < 1 || max > CANARY_HARD_CAP) throw new Error(`CONTENT_ENTITY_CANARY_MAX must be an integer 1..${CANARY_HARD_CAP}`);
  const doc = JSON.parse(text) as { version?: number; entities?: unknown };
  if (doc.version !== 1 || !Array.isArray(doc.entities)) throw new Error('allowlist must be {version:1, entities:[…]}');
  if (doc.entities.length > max) throw new Error(`allowlist has ${doc.entities.length} entities, ceiling is ${max}`);
  const entries: CanaryEntry[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const raw of doc.entities as Array<Record<string, unknown>>) {
    const { entityId, canonicalPath, approvedBy, approvedAt } = raw as Record<string, string>;
    if (typeof entityId !== 'string' || !entityId || typeof canonicalPath !== 'string' || !ENTITY_PATH.test(canonicalPath)) throw new Error('invalid allowlist entry');
    if (Number.isNaN(Date.parse(approvedAt))) throw new Error(`entry ${entityId} has no approvedAt`);
    if (paths.has(canonicalPath) || ids.has(entityId)) throw new Error(`duplicate allowlist entry ${entityId} ${canonicalPath}`);
    ids.add(entityId);
    paths.add(canonicalPath);
    entries.push({ entityId, canonicalPath, approvedBy: normalizeReviewerName(approvedBy), approvedAt });
  }
  return entries;
}

export class EntityPublicReadPolicy {
  private readonly env: NodeJS.ProcessEnv;
  private readonly now: () => number;
  private readonly stat: NonNullable<PolicyDeps['stat']>;
  private readonly read: NonNullable<PolicyDeps['read']>;
  private readonly exists: NonNullable<PolicyDeps['exists']>;
  private readonly warn: (message: string) => void;
  private list: { file?: string; signature: string; checkedAt: number; entries: Map<string, CanaryEntry>; error?: string } | null = null;
  private errors: number[] = [];
  private breaker = false;
  private readonly counters = new Map<string, Record<string, number>>();

  constructor(deps: PolicyDeps = {}) {
    this.env = deps.env ?? process.env;
    this.now = deps.now ?? Date.now;
    this.stat = deps.stat ?? defaultStat;
    this.read = deps.read ?? ((file) => fs.readFileSync(file, 'utf8'));
    this.exists = deps.exists ?? ((file) => defaultStat(file) !== null);
    this.warn = deps.warn ?? (() => undefined);
  }

  /** Why nothing is served, or the mode that is. Order: master switch, kill switches, scope. */
  private mode(): { mode: ReadMode } | { mode: 'off'; reason: string } {
    if (this.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED !== 'true') return { mode: 'off', reason: 'disabled' };
    const killFile = this.env.CONTENT_ENTITY_KILL_FILE;
    if (this.env.CONTENT_ENTITY_PUBLIC_READ_KILL === 'true' || (killFile && this.exists(killFile))) return { mode: 'off', reason: 'killed' };
    if (this.breaker) return { mode: 'off', reason: 'breaker_open' };
    const scope = this.env.CONTENT_ENTITY_PUBLIC_READ_SCOPE;
    if (scope === 'all' || scope === 'canary') return { mode: scope };
    return { mode: 'off', reason: 'scope_unset' };
  }

  /** The mode, for callers that only need to know how much of the corpus is visible (sitemap). */
  readMode(): ReadMode {
    return this.mode().mode;
  }

  /** Allowlisted canonical paths while in canary scope; used to keep exactly those out of sitemaps. */
  canaryPaths(): ReadonlySet<string> {
    return this.mode().mode === 'canary' ? new Set(this.loadList().entries.keys()) : new Set();
  }

  /** A string that changes whenever the visible set may have changed (sitemap cache partition). */
  partition(): string {
    const m = this.mode();
    return m.mode === 'canary' ? `canary:${this.loadList().signature}` : m.mode;
  }

  decide(path: string): Decision {
    const m = this.mode();
    if (m.mode === 'off') {
      const reason = 'reason' in m ? m.reason : 'disabled';
      if (reason !== 'disabled') this.bump(path, reason);
      return { action: 'legacy', reason };
    }
    if (m.mode === 'all') return { action: 'entity', mode: 'all' };
    const list = this.loadList();
    const refuse = (reason: string): Decision => { this.bump(path, reason); return { action: 'legacy', reason }; };
    if (list.error) return refuse('canary_config_invalid');
    const entry = list.entries.get(normalizeEntityPath(path));
    return entry ? { action: 'entity', mode: 'canary', entry } : refuse('not_allowlisted');
  }

  /** Record what a canary request ended as; `error` and `integrity_error` feed the breaker. */
  outcome(path: string, outcome: string): void {
    this.bump(path, outcome);
    if (outcome !== 'error' && outcome !== 'integrity_error') return;
    const t = this.now();
    this.errors = [...this.errors.filter((e) => t - e < BREAKER_WINDOW_MS), t];
    if (this.errors.length >= BREAKER_ERRORS && !this.breaker) {
      this.breaker = true;
      this.warn('entity canary breaker open: public entity reads fall back to legacy until restart');
    }
  }

  /** Counted per allowlisted path; every other request path shares one bucket so the map stays bounded. */
  private bump(path: string, outcome: string): void {
    const n = normalizeEntityPath(path);
    const route = this.list?.entries.has(n) ? n : '(other)';
    const row = this.counters.get(route) ?? {};
    row[outcome] = (row[outcome] ?? 0) + 1;
    this.counters.set(route, row);
  }

  private loadList() {
    const file = this.env.CONTENT_ENTITY_CANARY_FILE;
    const t = this.now();
    if (this.list && this.list.file === file && t - this.list.checkedAt < RECHECK_MS) return this.list;
    const st = file ? this.stat(file) : null;
    const signature = st ? `${st.mtimeMs}:${st.size}` : 'missing';
    if (this.list && this.list.file === file && this.list.signature === signature) {
      this.list.checkedAt = t;
      return this.list;
    }
    const empty = (error: string) => ({ file, signature, checkedAt: t, entries: new Map<string, CanaryEntry>(), error });
    try {
      if (!file || !st) this.list = empty('canary file missing');
      else this.list = { file, signature, checkedAt: t, entries: this.parse(this.read(file)) };
    } catch (e) {
      this.list = empty(e instanceof Error ? e.message : String(e));
    }
    if (this.list.error) this.warn(`entity canary disabled: ${this.list.error}`);
    return this.list;
  }

  private parse(text: string): Map<string, CanaryEntry> {
    return new Map(parseCanaryAllowlist(text, Number(this.env.CONTENT_ENTITY_CANARY_MAX)).map((e) => [e.canonicalPath, e]));
  }

  /** Operator view: mode, switches, ceiling, per-route outcomes. Contains no entity content. */
  stats() {
    const m = this.mode();
    const list = this.env.CONTENT_ENTITY_PUBLIC_READ_SCOPE === 'canary' ? this.loadList() : null;
    const routes = Object.fromEntries([...this.counters].sort(([a], [b]) => a.localeCompare(b)));
    const totals: Record<string, number> = {};
    for (const row of this.counters.values()) for (const [k, v] of Object.entries(row)) totals[k] = (totals[k] ?? 0) + v;
    const served = (totals.served ?? 0) + (totals.redirect ?? 0);
    const failures = (totals.error ?? 0) + (totals.integrity_error ?? 0) + (totals.revalidation_failed ?? 0);
    return {
      mode: m.mode,
      reason: 'reason' in m ? m.reason : undefined,
      breakerOpen: this.breaker,
      allowlisted: list?.entries.size ?? 0,
      max: Number(this.env.CONTENT_ENTITY_CANARY_MAX) || null,
      configError: list?.error,
      totals,
      /** Failed canary reads over canary reads (served + failed); null before the first one. */
      errorRate: served + failures ? failures / (served + failures) : null,
      routes,
    };
  }
}

let shared: EntityPublicReadPolicy | undefined;
/** The process-wide policy (routes, sitemap and the admin stats read the same counters and breaker). */
export const entityPublicReadPolicy = (): EntityPublicReadPolicy => (shared ??= new EntityPublicReadPolicy({ warn: (m) => logger.warn(m) }));
