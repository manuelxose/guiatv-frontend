import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateFriendActivity } from './SocialSummaryQuery';

/**
 * `aggregateFriendActivity` is the query shared between CatalogService and
 * GetContentDetail's two independent social-summary implementations
 * (consolidated here to remove the duplication). Its own logic — not
 * counting Mongo's aggregate, which needs a real connection — is the early
 * exit for callers that pass nothing to match against.
 */

test('aggregateFriendActivity returns null without querying when there are no friend ids or no match conditions', async () => {
  assert.equal(await aggregateFriendActivity([], [{ contentId: 'x' }]), null);
  assert.equal(await aggregateFriendActivity(['user-1'], []), null);
  assert.equal(await aggregateFriendActivity([], []), null);
});
