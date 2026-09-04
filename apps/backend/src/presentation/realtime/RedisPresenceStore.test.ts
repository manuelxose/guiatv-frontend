/**
 * Integration tests for RedisPresenceStore against a real Valkey/Redis.
 * Runs only when TEST_REDIS_URL is set, e.g.:
 *   TEST_REDIS_URL=redis://127.0.0.1:6379 npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RedisPresenceStore } from './RedisPresenceStore';

const redisUrl = process.env.TEST_REDIS_URL;
const hasRedis = Boolean(redisUrl);

test(
  'RedisPresenceStore distributed presence semantics',
  { skip: hasRedis ? false : 'TEST_REDIS_URL not set' },
  async () => {
    const keyPrefix = `test:gtv:presence:${Date.now()}:`;
    const storeA = new RedisPresenceStore(redisUrl!, 'node-a', { keyPrefix });
    const storeB = new RedisPresenceStore(redisUrl!, 'node-b', { keyPrefix });
    await storeA.connect();
    await storeB.connect();

    try {
      // Two users land on different nodes.
      assert.equal(await storeA.register('u1', 'a1'), true);
      assert.equal(await storeB.register('u2', 'b1'), true);

      // Each node sees the full cross-node picture.
      assert.equal(await storeA.isUserOnline('u2'), true);
      assert.equal(await storeB.isUserOnline('u1'), true);
      assert.deepEqual(
        (await storeA.getOnlineUserIds()).sort(),
        ['u1', 'u2']
      );
      assert.equal(await storeA.getOnlineCount(), 2);

      // Multi-socket on the same user: closing one keeps them online.
      await storeA.register('u1', 'a2');
      const closed = await storeA.unregister('a1');
      assert.equal(closed.becameOffline, false);
      assert.equal(await storeB.isUserOnline('u1'), true);

      // Last socket across nodes makes the user offline for everyone.
      const last = await storeA.unregister('a2');
      assert.equal(last.becameOffline, true);
      assert.equal(await storeB.isUserOnline('u1'), false);
      assert.deepEqual(await storeB.getOnlineUserIds(), ['u2']);
      assert.equal(await storeB.getOnlineCount(), 1);
    } finally {
      await storeA.dispose();
      await storeB.dispose();
    }
  }
);
