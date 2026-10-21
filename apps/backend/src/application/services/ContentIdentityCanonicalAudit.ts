/**
 * Phase 3B: canonical-ownership audit. Pure functions, no database access, deterministic output.
 *
 *  - `auditProposedPaths`: the paths a write run WOULD allocate (replay traces) against the rules a
 *    public path must meet: one owner, valid syntax, the kind's namespace, no legacy-route conflict.
 *  - `auditRegistry`: what is STORED (entities + slug rows): one canonical row per live entity, a
 *    consistent denormalised cache, redirects that end at an active canonical in one hop, no cycles,
 *    and no live path left on a removed or superseded identity.
 *
 * Findings of severity `blocker` are deterministic engineering defects; `quarantine` means the item
 * is held out of publication; `review` is semantic ambiguity a person must settle. Nothing is
 * resolved here: the audit never picks a winner between two owners of a path.
 */
import { KIND_PATH_PREFIX, normalizeContentPath, type ContentKind } from '@/domain/services/contentIdentity';
import type { ContentEntityRecord, ContentSlugRecord } from '@/domain/repositories/IContentIdentityRepository';
import type { IdentityTrace } from './ContentIdentityIngestion';

export type Severity = 'blocker' | 'quarantine' | 'review';
export interface AuditFinding {
  code: string;
  severity: Severity;
  path?: string;
  entityId?: string;
  candidateId?: string;
  identity?: string;
  detail?: string;
}

const bySeverity = (findings: readonly AuditFinding[]) => ({
  blocker: findings.filter((f) => f.severity === 'blocker').length,
  quarantine: findings.filter((f) => f.severity === 'quarantine').length,
  review: findings.filter((f) => f.severity === 'review').length,
});
const sorted = (findings: AuditFinding[]) =>
  findings.sort((a, b) => `${a.code}|${a.path ?? ''}|${a.entityId ?? a.candidateId ?? ''}`.localeCompare(`${b.code}|${b.path ?? ''}|${b.entityId ?? b.candidateId ?? ''}`));
const slugOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export interface ProposedPathReport {
  summary: { proposed: number; withPath: number; pathless: number; legacyInherited: number; severity: ReturnType<typeof bySeverity> };
  /** More than one proposed identity wants the same path (after trimming and case folding). */
  collisions: Array<{ path: string; identities: string[] }>;
  /** Items held out of publication, with the reason; also in `findings`. */
  quarantine: AuditFinding[];
  findings: AuditFinding[];
  pass: boolean;
}

/** `accepted`: identity ids the evidence gate accepts; a pathless one is a blocker, not just a quarantine. */
export function auditProposedPaths(traces: readonly IdentityTrace[], accepted: ReadonlySet<string> = new Set()): ProposedPathReport {
  const findings: AuditFinding[] = [];
  const proposed = new Map<string, IdentityTrace>();
  for (const t of traces) if (t.decision === 'create' && t.identity && !proposed.has(t.identity)) proposed.set(t.identity, t);
  const owners = new Map<string, Set<string>>();
  const slugKinds = new Map<string, Set<string>>();
  let withPath = 0;
  let inherited = 0;
  for (const [identity, t] of proposed) {
    const at = { candidateId: t.candidateId, identity };
    if (!t.path) {
      const reason = t.pathless ?? 'unknown';
      const blocking = accepted.has(identity);
      findings.push({ ...at, code: `pathless_${reason}`, severity: blocking ? 'blocker' : 'quarantine', detail: blocking ? 'accepted without a canonical path' : undefined });
      continue;
    }
    withPath++;
    if (t.historicOwner) inherited++;
    const check = normalizeContentPath(t.path);
    if (!check.ok) findings.push({ ...at, code: `path_${check.reason}`, severity: 'blocker', path: t.path });
    else if (check.path !== t.path) findings.push({ ...at, code: 'path_not_normalised', severity: 'blocker', path: t.path, detail: check.path });
    if (!t.path.startsWith(`${KIND_PATH_PREFIX[t.kind as ContentKind] ?? '/?'}/`)) findings.push({ ...at, code: 'path_namespace_kind_mismatch', severity: 'blocker', path: t.path, detail: t.kind });
    const key = t.path.toLowerCase().replace(/\/$/, '');
    owners.set(key, (owners.get(key) ?? new Set()).add(identity));
    slugKinds.set(slugOf(key), (slugKinds.get(slugOf(key)) ?? new Set()).add(key));
  }
  const collisions = [...owners].filter(([, ids]) => ids.size > 1).map(([path, ids]) => ({ path, identities: [...ids].sort() })).sort((a, b) => a.path.localeCompare(b.path));
  for (const c of collisions) findings.push({ code: 'path_collision', severity: 'blocker', path: c.path, detail: c.identities.join(' | ') });
  // The same slug under two namespaces is legal (two paths) but is a homonym a person should see.
  for (const [slug, paths] of slugKinds) if (paths.size > 1) findings.push({ code: 'same_slug_several_namespaces', severity: 'review', detail: `${slug}: ${[...paths].sort().join(' ')}` });
  sorted(findings);
  const severity = bySeverity(findings);
  return {
    summary: { proposed: proposed.size, withPath, pathless: proposed.size - withPath, legacyInherited: inherited, severity },
    collisions,
    quarantine: findings.filter((f) => f.severity !== 'blocker' && f.code.startsWith('pathless_')),
    findings,
    pass: severity.blocker === 0,
  };
}

export interface RegistryReport {
  summary: { entities: number; slugs: number; canonicalSlugs: number; redirects: number; gone: number; severity: ReturnType<typeof bySeverity> };
  findings: AuditFinding[];
  pass: boolean;
}

type EntityRow = Pick<ContentEntityRecord, 'entityId' | 'kind' | 'status' | 'canonicalPath' | 'mergedInto'>;
type SlugRow = Pick<ContentSlugRecord, 'path' | 'entityId' | 'role'>;

export function auditRegistry(entities: readonly EntityRow[], slugs: readonly SlugRow[]): RegistryReport {
  const findings: AuditFinding[] = [];
  const add = (f: AuditFinding) => findings.push(f);
  const byId = new Map<string, EntityRow>();
  for (const e of entities) {
    if (byId.has(e.entityId)) add({ code: 'duplicate_entity_id', severity: 'blocker', entityId: e.entityId });
    byId.set(e.entityId, e);
  }
  const byPath = new Map<string, SlugRow>();
  const canonicalOf = new Map<string, SlugRow[]>();
  for (const s of slugs) {
    if (byPath.has(s.path)) add({ code: 'duplicate_path_owner', severity: 'blocker', path: s.path, entityId: s.entityId, detail: `also ${byPath.get(s.path)!.entityId}` });
    byPath.set(s.path, s);
    const check = normalizeContentPath(s.path);
    if (!check.ok) add({ code: `path_${check.reason}`, severity: 'blocker', path: s.path, entityId: s.entityId });
    else if (check.path !== s.path) add({ code: 'path_not_normalised', severity: 'blocker', path: s.path, entityId: s.entityId });
    const owner = byId.get(s.entityId);
    if (!owner) {
      add({ code: 'slug_owner_missing', severity: 'blocker', path: s.path, entityId: s.entityId });
      continue;
    }
    if (!s.path.startsWith(`${KIND_PATH_PREFIX[owner.kind]}/`)) add({ code: 'path_namespace_kind_mismatch', severity: 'blocker', path: s.path, entityId: s.entityId, detail: owner.kind });
    if (s.role === 'canonical') canonicalOf.set(s.entityId, [...(canonicalOf.get(s.entityId) ?? []), s]);
    // A merge demotes the canonical row to a redirect. (A removed entity deliberately keeps its row: the path stays
    // reserved and answers 410, it is never handed to another identity.)
    if (s.role === 'canonical' && owner.status === 'merged') add({ code: 'merged_entity_keeps_canonical', severity: 'blocker', path: s.path, entityId: s.entityId });
  }
  for (const e of entities) {
    const rows = canonicalOf.get(e.entityId) ?? [];
    if (rows.length > 1) add({ code: 'several_canonical_rows', severity: 'blocker', entityId: e.entityId, detail: rows.map((r) => r.path).join(' ') });
    if (e.status === 'active' || e.status === 'candidate') {
      // A candidate may legitimately be pathless (quarantined path); an active entity may not.
      if (!rows.length && e.status === 'active') add({ code: 'active_without_canonical_row', severity: 'blocker', entityId: e.entityId });
      if (rows.length === 1 && e.canonicalPath !== rows[0].path) add({ code: 'canonical_cache_mismatch', severity: 'blocker', entityId: e.entityId, path: rows[0].path, detail: String(e.canonicalPath) });
      if (!rows.length && e.canonicalPath) add({ code: 'cache_without_canonical_row', severity: 'blocker', entityId: e.entityId, path: e.canonicalPath });
    }
    if (e.status === 'merged') {
      const target = e.mergedInto ? byId.get(e.mergedInto) : undefined;
      if (!target) add({ code: 'merge_target_missing', severity: 'blocker', entityId: e.entityId, detail: String(e.mergedInto) });
      else if (target.status !== 'active') add({ code: target.status === 'merged' ? 'merge_chain' : 'merge_target_not_active', severity: 'blocker', entityId: e.entityId, detail: `${e.mergedInto} is ${target.status}` });
    }
  }
  // Redirect rows: the owner must lead, in one hop, to an active entity with a canonical row.
  for (const s of slugs) {
    if (s.role !== 'redirect') continue;
    const owner = byId.get(s.entityId);
    if (!owner) continue;
    const seen = new Set<string>([owner.entityId]);
    let hop: EntityRow | undefined = owner;
    let hops = 0;
    while (hop?.status === 'merged' && hop.mergedInto && !seen.has(hop.mergedInto)) {
      seen.add(hop.mergedInto);
      hop = byId.get(hop.mergedInto);
      hops++;
    }
    if (hop?.status === 'merged') add({ code: 'redirect_cycle', severity: 'blocker', path: s.path, entityId: s.entityId });
    else if (hops > 1) add({ code: 'redirect_chain', severity: 'blocker', path: s.path, entityId: s.entityId, detail: `${hops} hops` });
    else if (hop?.status === 'active' && !(canonicalOf.get(hop.entityId)?.length)) add({ code: 'redirect_to_pathless_entity', severity: 'blocker', path: s.path, entityId: s.entityId });
    else if (hop && hop.status !== 'active' && hop.status !== 'removed') add({ code: 'redirect_to_inactive_entity', severity: 'review', path: s.path, entityId: s.entityId, detail: hop.status });
    // A redirect that points at its own canonical path is a loop for the client.
    if (hop && hop.canonicalPath === s.path) add({ code: 'redirect_to_itself', severity: 'blocker', path: s.path, entityId: s.entityId });
  }
  sorted(findings);
  const severity = bySeverity(findings);
  const count = (role: string) => slugs.filter((s) => s.role === role).length;
  return {
    summary: { entities: entities.length, slugs: slugs.length, canonicalSlugs: count('canonical'), redirects: count('redirect'), gone: count('gone'), severity },
    findings,
    pass: severity.blocker === 0,
  };
}
