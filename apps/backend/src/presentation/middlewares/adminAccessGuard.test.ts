import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminAccessGuard } from './adminAccessGuard';

function fakeReq(headers: Record<string, string> = {}) {
  return {
    headers,
    header(name: string) {
      return headers[name.toLowerCase()];
    },
  };
}

function fakeAuthService(user: { id: string; role: string } | null) {
  return {
    getSession: async (_token: string) => {
      if (!user) throw new Error('invalid session');
      return user;
    },
  };
}

/**
 * `admin-affiliate.routes.ts` mounts every Phase 9 route behind this exact
 * guard — these cases exercise "non-admin access denied" for the affiliate
 * admin surface at the level the guard is actually shared from.
 */
test('createAdminAccessGuard denies a request with no token and no admin key', async () => {
  const originalKey = process.env.ANALYTICS_ADMIN_KEY;
  delete process.env.ANALYTICS_ADMIN_KEY;
  try {
    const guard = createAdminAccessGuard(fakeAuthService(null) as never);
    let passedError: unknown;
    await guard(fakeReq() as never, {} as never, (err?: unknown) => {
      passedError = err;
    });
    assert.ok(passedError, 'expected next() to be called with an error');
    assert.equal((passedError as { name: string }).name, 'UnauthorizedError');
  } finally {
    if (originalKey !== undefined) process.env.ANALYTICS_ADMIN_KEY = originalKey;
  }
});

test('createAdminAccessGuard denies an authenticated non-admin user', async () => {
  const originalKey = process.env.ANALYTICS_ADMIN_KEY;
  delete process.env.ANALYTICS_ADMIN_KEY;
  try {
    const guard = createAdminAccessGuard(fakeAuthService({ id: 'user-1', role: 'user' }) as never);
    let passedError: unknown;
    await guard(fakeReq({ authorization: 'Bearer token-123' }) as never, {} as never, (err?: unknown) => {
      passedError = err;
    });
    assert.ok(passedError);
    assert.equal((passedError as { name: string }).name, 'ForbiddenError');
  } finally {
    if (originalKey !== undefined) process.env.ANALYTICS_ADMIN_KEY = originalKey;
  }
});

test('createAdminAccessGuard allows an authenticated admin user through', async () => {
  const originalKey = process.env.ANALYTICS_ADMIN_KEY;
  delete process.env.ANALYTICS_ADMIN_KEY;
  try {
    const guard = createAdminAccessGuard(fakeAuthService({ id: 'admin-1', role: 'admin' }) as never);
    let nextCalledWith: unknown = 'not-called';
    await guard(fakeReq({ authorization: 'Bearer token-123' }) as never, {} as never, (err?: unknown) => {
      nextCalledWith = err;
    });
    assert.equal(nextCalledWith, undefined);
  } finally {
    if (originalKey !== undefined) process.env.ANALYTICS_ADMIN_KEY = originalKey;
  }
});
