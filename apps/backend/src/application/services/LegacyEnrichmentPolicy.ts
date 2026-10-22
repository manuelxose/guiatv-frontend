/**
 * Phase 3E: which legacy detail pages may receive verified enrichment. Independent of every entity / identity flag.
 *
 *   CONTENT_LEGACY_ENRICHMENT_ENABLED=true   master switch; off (anything else) = payloads are byte-identical to before
 *   CONTENT_LEGACY_ENRICHMENT_SCOPE=all | /peliculas/a,/series/b   `all` must be written out; a list bounds the rollout; unset serves nothing
 *   CONTENT_LEGACY_ENRICHMENT_KILL=true | CONTENT_LEGACY_ENRICHMENT_KILL_FILE=<path that exists>   instant off, no restart
 *
 * The decision is per request and reads no database. Turning it off needs no data rollback: nothing is ever written.
 */
import fs from 'node:fs';

const DETAIL_PATH = /^\/(?:peliculas|series|programas)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A bounded rollout is a short list; a longer one is a configuration mistake and serves nothing. */
export const LEGACY_SCOPE_MAX_PATHS = 200;
const RECHECK_MS = 5_000;

export type LegacyEnrichmentDecision = { enabled: true; mode: 'all' | 'list' } | { enabled: false; reason: string };

export class LegacyEnrichmentPolicy {
  private killCheckedAt = 0;
  private killed = false;
  private listSource = '';
  private list = new Set<string>();

  constructor(
    private readonly env: NodeJS.ProcessEnv = process.env,
    private readonly now: () => number = Date.now,
    private readonly exists: (file: string) => boolean = fs.existsSync
  ) {}

  private isKilled(): boolean {
    if (this.env.CONTENT_LEGACY_ENRICHMENT_KILL === 'true') return true;
    const file = this.env.CONTENT_LEGACY_ENRICHMENT_KILL_FILE;
    if (!file) return false;
    const at = this.now();
    if (at - this.killCheckedAt >= RECHECK_MS) {
      this.killCheckedAt = at;
      try { this.killed = this.exists(file); } catch { this.killed = true; }
    }
    return this.killed;
  }

  private scopeList(raw: string): Set<string> | null {
    if (raw !== this.listSource) {
      this.listSource = raw;
      const paths = raw.split(',').map((p) => p.trim()).filter(Boolean);
      this.list = paths.length > LEGACY_SCOPE_MAX_PATHS || !paths.every((p) => DETAIL_PATH.test(p)) ? new Set() : new Set(paths);
    }
    return this.list.size ? this.list : null;
  }

  /**
   * A short token that changes whenever the set of pages that receive enrichment changes (on/off, kill, scope). The SSR
   * server reads it from the health response and drops its rendered-page cache when it moves, so a page rendered under
   * the previous state is never served after a switch.
   */
  epoch(): string {
    if (this.env.CONTENT_LEGACY_ENRICHMENT_ENABLED !== 'true' || this.isKilled()) return 'off';
    const scope = (this.env.CONTENT_LEGACY_ENRICHMENT_SCOPE ?? '').trim();
    if (scope === 'all') return 'all';
    const list = scope ? this.scopeList(scope) : null;
    return list ? `list:${[...list].sort().join(',')}` : 'off';
  }

  decide(detailPath: string): LegacyEnrichmentDecision {
    if (this.env.CONTENT_LEGACY_ENRICHMENT_ENABLED !== 'true') return { enabled: false, reason: 'disabled' };
    if (this.isKilled()) return { enabled: false, reason: 'killed' };
    const scope = (this.env.CONTENT_LEGACY_ENRICHMENT_SCOPE ?? '').trim();
    if (scope === 'all') return { enabled: true, mode: 'all' };
    const list = scope ? this.scopeList(scope) : null;
    if (!list) return { enabled: false, reason: 'scope_unset' };
    return list.has(detailPath) ? { enabled: true, mode: 'list' } : { enabled: false, reason: 'not_in_scope' };
  }
}

export const legacyEnrichmentPolicy = new LegacyEnrichmentPolicy();
