import { Logger } from '@/shared/utils/logger';
import type { CertificationReader } from './ContentCertification';
import { ContentIdentityService, normalizeReviewerName } from './ContentIdentityService';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';
import { TMDB_ATTRIBUTION, TMDB_IMAGE_PATH } from '@/domain/services/entityEnrichment';
import type { EntityBroadcastService, EntityBroadcasts } from './EntityBroadcastService';

const logger = new Logger('PublicContentEntity');
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

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
  runtimeMinutes?: number;
  /** The validated TMDB movie id (only for an enriched entity: the enrichment proved type, id and title agree). */
  tmdbId?: number;
  /** Absolute TMDB image URLs, present only when the entity holds a validated TMDB path. */
  images?: { poster?: string; backdrop?: string };
  credits?: { directors: string[]; cast: Array<{ name: string; character?: string }> };
  /** Where the copied facts come from and how fresh they are; shown on the page. */
  attribution?: { source: 'tmdb'; updatedAt: string; notice: string };
  /** Upcoming broadcasts from the EPG read model (canonical reads only). */
  broadcasts?: EntityBroadcasts;
}

/** What the route needs beyond the DTO: whether the legacy page for this URL is indexable now (`unknown` counts as yes). */
export interface EntityLegacyGuard { legacyIndexableNow: boolean | 'unknown' }

type PublicResolution =
  | { status: 'canonical' | 'redirect'; entity: PublicContentEntity; guard?: EntityLegacyGuard }
  | { status: 'invalid' | 'not_found' | 'gone' | 'integrity_error' };

export class PublicContentEntityService {
  /**
   * `certifications` admits entities certified from an owner-authorised AI review (Phase 3C). Without
   * it, only a named person's verification serves a page and an `ai_attested` entity is not found.
   */
  constructor(
    private readonly identity: Pick<ContentIdentityService, 'resolvePath'>,
    private readonly certifications?: CertificationReader,
    /** Phase 3D: attaches upcoming broadcasts and the legacy-indexability guard to canonical reads. */
    private readonly broadcasts?: Pick<EntityBroadcastService, 'forEntity'>
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
    } else if (entity.matching?.method !== 'ai_attested' || !(await this.certifications?.isCertified(entity).catch((error) => { logger.warn('Entity certification check failed; treated as not certified', { message: String(error?.message || error).slice(0, 200) }); return false; }))) {
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
    if (entity.metadata?.runtimeMinutes) dto.runtimeMinutes = entity.metadata.runtimeMinutes.value;
    // Re-checked here, not only at enrichment: a value written another way (a `manual` copy) must not become a URL unchecked.
    const images = entity.metadata?.images?.value;
    const poster = images?.posterPath && TMDB_IMAGE_PATH.test(images.posterPath) ? images.posterPath : undefined;
    const backdrop = images?.backdropPath && TMDB_IMAGE_PATH.test(images.backdropPath) ? images.backdropPath : undefined;
    if (poster || backdrop) {
      dto.images = { ...(poster ? { poster: `${TMDB_IMAGE_BASE}/w500${poster}` } : {}), ...(backdrop ? { backdrop: `${TMDB_IMAGE_BASE}/w1280${backdrop}` } : {}) };
    }
    const credits = entity.metadata?.credits?.value;
    if (credits) {
      dto.credits = {
        directors: (credits.directors ?? []).map(String).slice(0, 5),
        cast: (credits.cast ?? []).slice(0, 10).map((c) => ({ name: String(c.name), ...(c.character ? { character: String(c.character) } : {}) })),
      };
    }
    const stamp = entity.metadata?.enrichment;
    if (stamp && stamp.tmdb.type === 'movie') dto.tmdbId = stamp.tmdb.id;
    if (stamp) dto.attribution = { source: 'tmdb', updatedAt: new Date(stamp.sourceUpdatedAt ?? stamp.checkedAt).toISOString(), notice: TMDB_ATTRIBUTION };
    const status = result.status === 'redirect' || path !== dto.canonicalPath ? 'redirect' : 'canonical';
    if (status === 'canonical' && this.broadcasts) {
      const found = await this.broadcasts.forEntity(entity);
      dto.broadcasts = found.broadcasts;
      return { status, entity: dto, guard: { legacyIndexableNow: found.legacyIndexableNow } };
    }
    return { status, entity: dto };
  }
}
