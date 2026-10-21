import test from 'node:test';
import assert from 'node:assert/strict';
import { isDirectLocalRead } from './rateLimit';

const req = (method: string, originalUrl: string, remoteAddress = '::ffff:127.0.0.1', headers: Record<string, string> = {}) =>
  ({ method, originalUrl, socket: { remoteAddress }, headers }) as any;

// 2D-2C.2: SSR sends the read-only affiliate resolve over loopback; it must not share one rate-limit bucket.
test('isDirectLocalRead: loopback reads and the read-shaped affiliate resolve only', () => {
  assert.equal(isDirectLocalRead(req('GET', '/v2/catalog?types=movie')), true);
  assert.equal(isDirectLocalRead(req('POST', '/v2/affiliate/resolve')), true);
  assert.equal(isDirectLocalRead(req('POST', '/v2/affiliate/resolve?x=1')), true);
  assert.equal(isDirectLocalRead(req('POST', '/v2/affiliate/impression')), false, 'writes stay limited');
  assert.equal(isDirectLocalRead(req('POST', '/v2/auth/login')), false);
  assert.equal(isDirectLocalRead(req('POST', '/v2/affiliate/resolve', '203.0.113.9')), false, 'remote peer');
  assert.equal(
    isDirectLocalRead(req('POST', '/v2/affiliate/resolve', '127.0.0.1', { 'x-forwarded-for': '203.0.113.9' })),
    false,
    'through nginx'
  );
});
