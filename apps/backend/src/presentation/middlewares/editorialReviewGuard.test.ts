import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorialReviewGuard } from './editorialReviewGuard';

const ENV_KEYS = ['EDITORIAL_REVIEW_KEY', 'AUCTORIO_EDITORIAL_REVIEW_KEY', 'AUCTORIO_EDITORIAL_REVIEWER'] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}

function request(headers: Record<string, string>) {
  return { header: (name: string) => headers[name.toLowerCase()] } as never;
}

test.afterEach(restoreEnv);

test('accepts the dedicated Autorio key only for its configured reviewer', () => {
  process.env.EDITORIAL_REVIEW_KEY = 'human-review-key';
  process.env.AUCTORIO_EDITORIAL_REVIEW_KEY = 'auctorio-review-key';
  process.env.AUCTORIO_EDITORIAL_REVIEWER = 'auctorio-quality-gate';

  let called = false;
  editorialReviewGuard(
    request({ 'x-editorial-review-key': 'auctorio-review-key', 'x-editorial-reviewer': 'auctorio-quality-gate' }),
    {} as never,
    () => { called = true; }
  );
  assert.equal(called, true);
});

test('rejects the Autorio key when the reviewer identity does not match', () => {
  process.env.AUCTORIO_EDITORIAL_REVIEW_KEY = 'auctorio-review-key';
  process.env.AUCTORIO_EDITORIAL_REVIEWER = 'auctorio-quality-gate';

  assert.throws(
    () => editorialReviewGuard(
      request({ 'x-editorial-review-key': 'auctorio-review-key', 'x-editorial-reviewer': 'someone-else' }),
      {} as never,
      () => undefined
    ),
    /Invalid editorial review key/
  );
});
