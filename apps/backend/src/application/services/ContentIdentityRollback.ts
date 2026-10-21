/**
 * Phase 2D rollback of provisional entities (ops only, no HTTP endpoint). Removes `candidate`
 * entities with their slugs and unreviewed title-key rows, and nothing else:
 *  - an `active`, `merged` or `removed` entity is never touched (a person verified or retired it);
 *  - a candidate with a title-key row a named person reviewed is kept;
 *  - a candidate an airing references (`program.entityId`) is kept: clear those refs first.
 * Candidates are never public (no route resolves them), so a hard delete is allowed here and only
 * here. Order is title keys, slugs, entity last, so a crash leaves an entity the next run finishes.
 * ponytail: not atomic against a concurrent verification (standalone Mongo, no transactions); run
 * it in a quiet window. The airing-ref check scans unless the hand-built airing index exists.
 */
import { ContentEntityModel } from '@/infrastructure/database/models/ContentEntity.model';
import { ContentSlugModel } from '@/infrastructure/database/models/ContentSlug.model';
import { ContentTitleKeyModel } from '@/infrastructure/database/models/ContentTitleKey.model';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

export interface RollbackReport {
  dryRun: boolean;
  provisional: number;
  keptReviewed: number;
  keptAiringRefs: number;
  removed: { entities: number; slugs: number; titleKeys: number };
}

const CHUNK = 500;
const chunks = <T>(list: T[]) => Array.from({ length: Math.ceil(list.length / CHUNK) }, (_, i) => list.slice(i * CHUNK, (i + 1) * CHUNK));

/**
 * `entityIds` (Phase 3C) limits the rollback to a canary batch: nothing outside the list is touched.
 * Attestation records are never deleted: they are the audit trail of what was certified and revoked.
 */
export async function rollbackProvisional(opts: { apply: boolean; since?: Date; entityIds?: readonly string[] }): Promise<RollbackReport> {
  const filter = { status: 'candidate' as const, ...(opts.since ? { createdAt: { $gte: opts.since } } : {}), ...(opts.entityIds ? { entityId: { $in: [...opts.entityIds] } } : {}) };
  const ids = (await ContentEntityModel.find(filter, { entityId: 1 }).lean().exec()).map((e) => e.entityId);
  const reviewed = new Set<string>();
  const referenced = new Set<string>();
  for (const chunk of chunks(ids)) {
    (await ContentTitleKeyModel.distinct('entityId', { entityId: { $in: chunk }, 'review.by': { $exists: true } })).forEach((id) => reviewed.add(id));
    (await TVReadAiringModel.distinct('program.entityId', { 'program.entityId': { $in: chunk } })).forEach((id) => referenced.add(id));
  }
  const eligible = ids.filter((id) => !reviewed.has(id) && !referenced.has(id));
  const report: RollbackReport = {
    dryRun: !opts.apply,
    provisional: ids.length,
    keptReviewed: ids.filter((id) => reviewed.has(id)).length,
    keptAiringRefs: ids.filter((id) => !reviewed.has(id) && referenced.has(id)).length,
    removed: { entities: 0, slugs: 0, titleKeys: 0 },
  };
  if (!opts.apply) {
    report.removed.entities = eligible.length;
    return report;
  }
  for (const chunk of chunks(eligible)) {
    // Re-read the status: an entity verified since the listing is left alone, with its slugs.
    const still = (await ContentEntityModel.find({ entityId: { $in: chunk }, status: 'candidate' }, { entityId: 1 }).lean().exec()).map((e) => e.entityId);
    report.removed.titleKeys += (await ContentTitleKeyModel.deleteMany({ entityId: { $in: still }, 'review.by': { $exists: false } }).exec()).deletedCount;
    report.removed.slugs += (await ContentSlugModel.deleteMany({ entityId: { $in: still } }).exec()).deletedCount;
    report.removed.entities += (await ContentEntityModel.deleteMany({ entityId: { $in: still }, status: 'candidate' }).exec()).deletedCount;
  }
  return report;
}
