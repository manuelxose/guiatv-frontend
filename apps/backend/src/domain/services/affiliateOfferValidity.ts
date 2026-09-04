import { AffiliateOfferValidity } from '../entities/AffiliateOffer';

/**
 * Canonical "is this offer's validity window open right now" predicate.
 * `MongoAffiliateOfferRepository`'s query-level validity match (validFrom
 * missing-or-past AND validUntil missing-or-future) implements exactly this
 * semantics; kept here as a pure function so the same rule is unit-testable
 * and reusable by in-memory fakes / a future resolver without depending on Mongo.
 */
export function isOfferValidNow(validity: AffiliateOfferValidity, asOf: Date = new Date()): boolean {
  if (validity.validFrom && validity.validFrom.getTime() > asOf.getTime()) return false;
  if (validity.validUntil && validity.validUntil.getTime() < asOf.getTime()) return false;
  return true;
}
