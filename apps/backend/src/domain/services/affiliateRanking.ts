import { AffiliateOffer } from '../entities/AffiliateOffer';

/**
 * Ranking inputs only — never a payout figure. Per the Affiliate Engine
 * recommendation-neutrality mandate, resolver ranking may use content/
 * provider match, availability, placement relevance, intent, market, and
 * validity. It must NEVER read `AffiliateProgram.commission` or any
 * network-preference signal. This function's signature is a structural
 * guarantee of that: it only ever receives an `AffiliateOffer`, which has no
 * commission field at all (commission lives on `AffiliateProgram`, a type
 * this module deliberately never imports).
 */
export interface AffiliateRankingContext {
  intent?: string;
  placement: string;
  contentType?: string;
  contentId?: string;
}

export function scoreAffiliateOffer(offer: AffiliateOffer, context: AffiliateRankingContext): number {
  let score = 0;

  if (context.intent && offer.recommendationIntents.includes(context.intent)) {
    score += 10;
  }

  if (!offer.placements || offer.placements.length === 0) {
    score += 1; // eligible on every enabled placement — broadly relevant
  } else if (offer.placements.includes(context.placement)) {
    score += 3; // explicitly curated for this placement
  }

  if (context.contentType && offer.category === context.contentType) {
    score += 2;
  }

  if (offer.verification.status === 'current') {
    score += 2;
  } else if (offer.verification.status === 'needs_review') {
    score -= 1;
  }

  if (offer.trial.days && offer.trial.days > 0) {
    score += 1;
  }

  return score;
}

/**
 * Stable sort by neutral relevance (highest first), tie-broken by plan name
 * so ordering never depends on an unrelated field.
 */
export function rankAffiliateOffers<T extends { offer: AffiliateOffer }>(
  candidates: T[],
  context: AffiliateRankingContext
): T[] {
  return [...candidates]
    .map((candidate) => ({ candidate, score: scoreAffiliateOffer(candidate.offer, context) }))
    .sort((a, b) => b.score - a.score || a.candidate.offer.plan.name.localeCompare(b.candidate.offer.plan.name))
    .map(({ candidate }) => candidate);
}
