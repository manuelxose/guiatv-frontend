import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryPresenceStore } from './PresenceStore';

test('InMemoryPresenceStore: register makes user online once', async () => {
  const store = new InMemoryPresenceStore();
  const becameOnline = await store.register('u1', 's1');
  assert.equal(becameOnline, true);
  assert.equal(await store.isUserOnline('u1'), true);
  assert.equal(await store.getOnlineCount(), 1);

  const second = await store.register('u1', 's2');
  assert.equal(second, false);
  assert.equal(await store.getSocketCount('u1'), 2);
  assert.equal(await store.getOnlineCount(), 1);
  await store.dispose();
});

test('InMemoryPresenceStore: last socket disconnect marks offline', async () => {
  const store = new InMemoryPresenceStore();
  await store.register('u1', 's1');
  await store.register('u1', 's2');

  const first = await store.unregister('s1');
  assert.equal(first.userId, 'u1');
  assert.equal(first.becameOffline, false);
  assert.equal(await store.isUserOnline('u1'), true);

  const last = await store.unregister('s2');
  assert.equal(last.userId, 'u1');
  assert.equal(last.becameOffline, true);
  assert.equal(await store.isUserOnline('u1'), false);
  assert.equal(await store.getOnlineCount(), 0);
  await store.dispose();
});

test('InMemoryPresenceStore: unknown socket unregister is a no-op', async () => {
  const store = new InMemoryPresenceStore();
  const result = await store.unregister('ghost');
  assert.equal(result.userId, null);
  assert.equal(result.becameOffline, false);
  await store.dispose();
});

test('InMemoryPresenceStore: online ids reflect actual sockets', async () => {
  const store = new InMemoryPresenceStore();
  await store.register('u1', 's1');
  await store.register('u2', 's2');
  await store.register('u3', 's3');
  await store.unregister('s2');
  const ids = (await store.getOnlineUserIds()).sort();
  assert.deepEqual(ids, ['u1', 'u3']);
  assert.equal(await store.getOnlineCount(), 2);
  await store.dispose();
});
