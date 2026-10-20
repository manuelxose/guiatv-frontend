import test from 'node:test';
import assert from 'node:assert/strict';
import express, { NextFunction, Request, Response } from 'express';
import type { AddressInfo } from 'node:net';
import { createRateLimiter } from './rateLimit';

// A real express app with the production proxy setting (`trust proxy` 1, app.ts). The test client connects over
// loopback, exactly like nginx and Angular SSR do on the server; what tells them apart is nginx's forwarding header.
async function withApp(run: (call: (init?: { method?: string; headers?: Record<string, string> }) => Promise<number>) => Promise<void>) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(createRateLimiter({ windowMs: 60_000, max: 2 }));
  app.all('/v2/x', (_req, res) => res.status(200).end());
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => res.status(err.statusCode || 500).end());
  const server = app.listen(0, '127.0.0.1');
  await new Promise((ok) => server.once('listening', ok));
  const { port } = server.address() as AddressInfo;
  try {
    await run(async (init = {}) => (await fetch(`http://127.0.0.1:${port}/v2/x`, init)).status);
  } finally {
    await new Promise((ok) => server.close(ok));
  }
}

const statuses = async (call: () => Promise<number>, n: number) => {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(await call());
  return out;
};

test('external clients (arriving through nginx, with X-Forwarded-For) stay rate-limited', async () => {
  await withApp(async (call) => {
    const viaNginx = () => call({ headers: { 'x-forwarded-for': '203.0.113.7, 198.51.100.1', 'x-real-ip': '198.51.100.1' } });
    assert.deepEqual(await statuses(viaNginx, 3), [200, 200, 429]);
  });
});

test('direct reads from this host (Angular SSR → 127.0.0.1:4000, no forwarding header) do not share one bucket', async () => {
  await withApp(async (call) => {
    assert.deepEqual(await statuses(() => call(), 6), [200, 200, 200, 200, 200, 200]);
  });
});

test('a spoofed forwarding header never grants the exemption', async () => {
  await withApp(async (call) => {
    const spoofed: Array<Record<string, string>> = [{ 'x-forwarded-for': '127.0.0.1' }, { 'x-forwarded-for': '' }, { 'x-real-ip': '127.0.0.1' }, { forwarded: 'for=127.0.0.1' }];
    for (const headers of spoofed) {
      const results = await statuses(() => call({ headers }), 3);
      assert.equal(results[2], 429, `still limited with ${JSON.stringify(headers)}`);
    }
  });
});

test('writes from this host stay rate-limited', async () => {
  await withApp(async (call) => {
    assert.deepEqual(await statuses(() => call({ method: 'POST' }), 3), [200, 200, 429]);
  });
});
