/**
 * Shared "is this commercial data still trustworthy" predicate for the Phase 9
 * admin Verification workflow. Both `AffiliateProgram.verification.status`
 * ('pending' | 'approved' | 'needs_review') and `AffiliateOffer.verification.status`
 * ('current' | 'stale' | 'needs_review') feed the same three-bucket display —
 * `needs_review` always wins, an unverified or never-verified row is never
 * shown as `current`, and `current` silently degrades to `stale` once
 * `verifiedAt` is older than `staleDays`. Pure/date-injectable so it's
 * unit-testable without a clock or a database.
 */
export type AffiliateVerificationDisplayStatus = 'current' | 'stale' | 'needs_review';

export const DEFAULT_AFFILIATE_VERIFICATION_STALE_DAYS = 90;

export interface AffiliateVerificationDisplay {
  displayStatus: AffiliateVerificationDisplayStatus;
  daysSinceVerified: number | null;
}

export function computeAffiliateVerificationDisplay(
  status: string | undefined,
  verifiedAt: Date | undefined,
  now: Date = new Date(),
  staleDays: number = DEFAULT_AFFILIATE_VERIFICATION_STALE_DAYS
): AffiliateVerificationDisplay {
  if (status === 'needs_review') {
    return { displayStatus: 'needs_review', daysSinceVerified: daysSince(verifiedAt, now) };
  }

  if (!verifiedAt) {
    // Never verified (including a Program still 'pending') is never shown as current.
    return { displayStatus: 'needs_review', daysSinceVerified: null };
  }

  const days = daysSince(verifiedAt, now)!;
  if (days > staleDays) {
    return { displayStatus: 'stale', daysSinceVerified: days };
  }
  return { displayStatus: 'current', daysSinceVerified: days };
}

function daysSince(verifiedAt: Date | undefined, now: Date): number | null {
  if (!verifiedAt) return null;
  return Math.max(0, Math.floor((now.getTime() - verifiedAt.getTime()) / (24 * 60 * 60 * 1000)));
}
