/** Regression for the 10 s forced exit 1 on every restart: an open Socket.IO client kept `server.close()` pending. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import { Server as IoServer } from 'socket.io';
import { io as connect } from 'socket.io-client';
import { createShutdown } from './shutdown';

test('shutdown exits 0 well inside the force timeout with a connected websocket client', async () => {
  const httpServer = createServer();
  const io = new IoServer(httpServer);
  const server = httpServer.listen(0);
  const port = (server.address() as AddressInfo).port;
  const client = connect(`http://127.0.0.1:${port}`, { transports: ['websocket'], reconnection: false });
  await new Promise<void>((resolve) => client.on('connect', () => resolve()));

  const codes: number[] = [];
  let cleaned = false;
  const shutdown = createShutdown({
    server,
    closeRealtime: () => new Promise<void>((resolve) => io.close(() => resolve())),
    cleanup: async () => { cleaned = true; },
    exit: (code) => codes.push(code),
    warn: () => undefined,
    forceMs: 3000,
  });
  const started = Date.now();
  await shutdown();
  client.close();

  assert.deepEqual(codes, [0]);
  assert.ok(cleaned, 'the container is cleaned up');
  assert.ok(Date.now() - started < 1500, 'no wait for the force timer');
});

test('a stuck in-flight request is cut after the grace period, still exit 0', async () => {
  const server = createServer((_req, _res) => { /* never answers */ });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const hang = fetch(`http://127.0.0.1:${port}/`).catch(() => undefined);
  await new Promise((r) => setTimeout(r, 100));

  const codes: number[] = [];
  const shutdown = createShutdown({ server, closeRealtime: async () => undefined, cleanup: async () => undefined, exit: (c) => codes.push(c), warn: () => undefined, graceMs: 200, forceMs: 3000 });
  await shutdown();
  await hang;
  assert.deepEqual(codes, [0]);
});
