import type { CertificationReader } from './ContentCertification';
import { ContentIdentityService, normalizeReviewerName } from './ContentIdentityService';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';

/** The public contract deliberately excludes lifecycle, matching and provenance. */
export interface PublicContentEntity {
  entityId: string;
  kind: ContentEntityRecord['kind'];
  title: string;
  canonicalPath: string;
  originalTitle?: string;
  year?: number;
  synopsis?: string;
  genres?: string[];
}

type PublicResolution =
  | { status: 'canonical' | 'redirect'; entity: PublicContentEntity }
  | { status: 'invalid' | 'not_found' | 'gone' | 'integrity_error' };

export class PublicContentEntityService {
  /**
   * `certifications` admits entities certified from an owner-authorised AI review (Phase 3C). Without
   * it, only a named person's verification serves a page and an `ai_attested` entity is not found.
   */
  constructor(
    private readonly identity: Pick<ContentIdentityService, 'resolvePath'>,
    private readonly certifications?: CertificationReader
  ) {}

  async resolve(path: string): Promise<PublicResolution> {
    const result = await this.identity.resolvePath(path);
    if (result.status !== 'canonical' && result.status !== 'redirect') return { status: result.status };
    const canonical = result.status === 'canonical' ? result : await this.identity.resolvePath(result.location);
    if (canonical.status !== 'canonical' || (result.status === 'redirect' && canonical.entity.entityId !== result.entityId)) {
      return { status: 'integrity_error' };
    }
    const entity = canonical.entity;
    if (entity.status !== 'active') return { status: 'not_found' };
    if (entity.matching?.method === 'manual') {
      try {
        normalizeReviewerName(entity.matching.decidedBy);
        normalizeReviewerName(entity.lifecycle?.changedBy);
      } catch { return { status: 'not_found' }; }
    } else if (entity.matching?.method !== 'ai_attested' || !(await this.certifications?.isCertified(entity).catch(() => false))) {
      // Anything else, an AI attestation that is revoked, expired, tampered with or unreadable included, is not a page.
      return { status: 'not_found' };
    }
    const dto: PublicContentEntity = {
      entityId: entity.entityId, kind: entity.kind, title: entity.title, canonicalPath: entity.canonicalPath!,
    };
    if (entity.originalTitle) dto.originalTitle = entity.originalTitle;
    if (entity.year !== undefined) dto.year = entity.year;
    if (entity.metadata?.synopsis) dto.synopsis = entity.metadata.synopsis.value;
    if (entity.metadata?.genres) dto.genres = entity.metadata.genres.value;
    return { status: result.status === 'redirect' || path !== dto.canonicalPath ? 'redirect' : 'canonical', entity: dto };
  }
}
