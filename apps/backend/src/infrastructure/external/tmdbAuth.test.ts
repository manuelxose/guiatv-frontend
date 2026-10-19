import test from 'node:test';
import assert from 'node:assert/strict';
import { tmdbAuth } from './tmdbAuth';

test('a v3 API key is sent as the api_key query parameter, never as a Bearer token', () => {
  const key = '0123456789abcdef0123456789abcdef';
  assert.deepEqual(tmdbAuth(key), { headers: {}, params: { api_key: key } });
});

test('a v4 read access token (JWT) is sent as a Bearer header', () => {
  assert.deepEqual(tmdbAuth('aaa.bbb.ccc'), { headers: { Authorization: 'Bearer aaa.bbb.ccc' }, params: {} });
});

test('an empty key sends no credentials', () => {
  assert.deepEqual(tmdbAuth(''), { headers: {}, params: {} });
});
