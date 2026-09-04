import { ValidationError } from '../../shared/errors';

/**
 * Reusable, typed context threaded through the generic Affiliate Engine
 * resolution pipeline (candidate selection → provider normalization → active
 * program → eligible offer → placement rules → deep-link strategy → redirect
 * → analytics). Every field beyond `market`/`placement` is optional — callers
 * attach only what their surface actually knows (an EPG card passes
 * `channelId`, a football page passes `footballMatchId`/`teamIds`, a blog
 * post passes `blogPostId`, etc.). Never collect more than the surface needs;
 * there is no generic user-identifying field beyond anonymous session/
 * correlation identifiers already used by the existing analytics pipeline.
 */
export interface AffiliateContext {
  /** ISO market code, e.g. 'ES'. Required — every resolution is market-scoped. */
  market: string;
  /** Canonical or legacy placement key. Required — resolved against AffiliatePlacement. */
  placement: string;
  pageType?: string;
  contentType?: string;
  contentId?: string;
  /** Free-text provider reference from the calling surface ("Movistar+", "M+", ...). */
  providerKey?: string;
  programId?: string;
  channelId?: string;
  catalogId?: string;
  movieId?: string;
  seriesId?: string;
  footballMatchId?: string;
  competitionId?: string;
  teamIds?: string[];
  blogPostId?: string;
  searchQuery?: string;
  chatbotConversationId?: string;
  /** Path the user arrived from, for analytics only — never used for redirect decisions. */
  referrerPath?: string;
  /** Anonymous, already-pseudonymous identifiers reused from the existing analytics pipeline. */
  anonId?: string;
  sessionId?: string;
  correlationId?: string;
}

const OPTIONAL_STRING_KEYS: Array<keyof AffiliateContext> = [
  'pageType',
  'contentType',
  'contentId',
  'providerKey',
  'programId',
  'channelId',
  'catalogId',
  'movieId',
  'seriesId',
  'footballMatchId',
  'competitionId',
  'blogPostId',
  'searchQuery',
  'chatbotConversationId',
  'referrerPath',
  'anonId',
  'sessionId',
  'correlationId',
];

/**
 * Builds a context object containing only the fields the caller actually
 * supplied (drops undefined/empty-string values) — keeps every downstream
 * consumer (cache keys, analytics payloads) free of noisy empty fields.
 */
export function buildAffiliateContext(input: Partial<AffiliateContext> & { market: string; placement: string }): AffiliateContext {
  const context: AffiliateContext = {
    market: String(input.market || '').toUpperCase().trim(),
    placement: String(input.placement || '').toLowerCase().trim(),
  };

  for (const key of OPTIONAL_STRING_KEYS) {
    const value = input[key] as string | undefined;
    if (typeof value === 'string' && value.trim()) {
      (context as unknown as Record<string, unknown>)[key] = value.trim();
    }
  }

  if (Array.isArray(input.teamIds) && input.teamIds.length > 0) {
    context.teamIds = input.teamIds.filter((id) => typeof id === 'string' && id.trim());
  }

  return context;
}

/** Throws a ValidationError listing every missing required field. */
export function assertAffiliateContext(context: Partial<AffiliateContext>): asserts context is AffiliateContext {
  const details: Array<{ field: string; message: string; value?: unknown }> = [];
  if (!context.market || !String(context.market).trim()) {
    details.push({ field: 'market', message: 'market is required', value: context.market });
  }
  if (!context.placement || !String(context.placement).trim()) {
    details.push({ field: 'placement', message: 'placement is required', value: context.placement });
  }
  if (details.length > 0) {
    throw new ValidationError('Invalid affiliate context', details);
  }
}
