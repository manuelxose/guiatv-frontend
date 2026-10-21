import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createAdminRoutes } from './admin.routes';
import { errorHandler } from '../middlewares/errorHandler';

test('canary stats are admin-only and carry no entity content', async () => {
  const previous = { key: process.env.ANALYTICS_ADMIN_KEY, enabled: process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED, scope: process.env.CONTENT_ENTITY_PUBLIC_READ_SCOPE };
  process.env.ANALYTICS_ADMIN_KEY = 'test-admin-key';
  delete process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED;
  const app = express();
  app.use('/v2/admin', createAdminRoutes(new Proxy({}, { get: () => () => undefined }) as never, { getSession: async () => { throw new Error('no session'); } } as never));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v2/admin/entities/canary`;
  try {
    assert.ok([401, 403].includes((await fetch(url)).status), 'no credentials: refused');
    assert.ok([401, 403].includes((await fetch(url, { headers: { 'x-admin-key': 'wrong' } })).status));
    const ok = await fetch(url, { headers: { 'x-admin-key': 'test-admin-key' } });
    assert.equal(ok.status, 200);
    const body = await ok.json() as { data: { mode: string; breakerOpen: boolean; routes: object } };
    assert.deepEqual([body.data.mode, body.data.breakerOpen, body.data.routes], ['off', false, {}]);
  } finally {
    for (const [name, value] of [['ANALYTICS_ADMIN_KEY', previous.key], ['CONTENT_ENTITY_PUBLIC_READ_ENABLED', previous.enabled], ['CONTENT_ENTITY_PUBLIC_READ_SCOPE', previous.scope]] as const) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
