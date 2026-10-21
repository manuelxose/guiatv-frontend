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
  constructor(private readonly identity: Pick<ContentIdentityService, 'resolvePath'>) {}

  async resolve(path: string): Promise<PublicResolution> {
    const result = await this.identity.resolvePath(path);
    if (result.status !== 'canonical' && result.status !== 'redirect') return { status: result.status };
    const canonical = result.status === 'canonical' ? result : await this.identity.resolvePath(result.location);
    if (canonical.status !== 'canonical' || (result.status === 'redirect' && canonical.entity.entityId !== result.entityId)) {
      return { status: 'integrity_error' };
    }
    const entity = canonical.entity;
    if (entity.status !== 'active' || entity.matching?.method !== 'manual') return { status: 'not_found' };
    try {
      normalizeReviewerName(entity.matching.decidedBy);
      normalizeReviewerName(entity.lifecycle?.changedBy);
    } catch { return { status: 'not_found' }; }
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
