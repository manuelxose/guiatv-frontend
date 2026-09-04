import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAffiliateVerificationDisplay } from './affiliateVerificationStatus';

const NOW = new Date('2026-08-29T00:00:00.000Z');

test('computeAffiliateVerificationDisplay: needs_review always wins regardless of date', () => {
  const result = computeAffiliateVerificationDisplay('needs_review', new Date('2026-08-28T00:00:00.000Z'), NOW);
  assert.equal(result.displayStatus, 'needs_review');
});

test('computeAffiliateVerificationDisplay: never verified is needs_review, not current', () => {
  const result = computeAffiliateVerificationDisplay('approved', undefined, NOW);
  assert.equal(result.displayStatus, 'needs_review');
  assert.equal(result.daysSinceVerified, null);
});

test('computeAffiliateVerificationDisplay: recently verified is current', () => {
  const result = computeAffiliateVerificationDisplay('current', new Date('2026-08-20T00:00:00.000Z'), NOW);
  assert.equal(result.displayStatus, 'current');
  assert.equal(result.daysSinceVerified, 9);
});

test('computeAffiliateVerificationDisplay: verified beyond the stale window degrades to stale', () => {
  const verifiedAt = new Date(NOW.getTime() - 120 * 24 * 60 * 60 * 1000);
  const result = computeAffiliateVerificationDisplay('current', verifiedAt, NOW);
  assert.equal(result.displayStatus, 'stale');
  assert.equal(result.daysSinceVerified, 120);
});

test('computeAffiliateVerificationDisplay: a custom staleDays threshold is respected', () => {
  const verifiedAt = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
  const result = computeAffiliateVerificationDisplay('approved', verifiedAt, NOW, 5);
  assert.equal(result.displayStatus, 'stale');
});
