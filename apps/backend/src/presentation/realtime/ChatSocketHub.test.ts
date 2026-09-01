/**
 * Integration tests for ChatSocketHub over a real HTTP server with real
 * socket.io clients. Auth, conversation and message repositories are stubbed
 * so no database is required.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { ChatSocketHub } from './ChatSocketHub';
import { InMemoryPresenceStore } from './PresenceStore';
import { AuthService } from '../../domain/services/AuthService';

interface StubConversation {
  pairKey?: string;
  participants: string[];
}

class StubConversationRepo {
  conversations = new Map<string, StubConversation>();
  constructor(rows: Record<string, StubConversation> = {}) {
    this.conversations = new Map(Object.entries(rows));
  }
  async findById(id: string): Promise<StubConversation | null> {
    return this.conversations.get(id) || null;
  }
}

class StubMessageRepo {
  reads: Array<{ conversationId: string; readerId: string }> = [];
  async markAllRead(conversationId: string, readerId: string): Promise<void> {
    this.reads.push({ conversationId, readerId });
  }
}

const stubAuth = {
  async getSession(token: string) {
    if (!token || token === 'bad') {
      throw new Error('Unauthorized');
    }
    return { id: `user-${token}`, email: `${token}@test.local`, name: token };
  },
} as unknown as AuthService;

function once(socket: Socket, event: string, timeoutMs = 3_000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeoutMs
    );
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function connectClient(
  port: number,
  token: string,
  listeners: Record<string, (payload: any) => void> = {}
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      path: '/v2/ws',
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
      forceNew: true,
      timeout: 3_000,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
    for (const [event, handler] of Object.entries(listeners)) {
      socket.on(event, handler);
    }
  });
}

test('ChatSocketHub realtime lifecycle', async (t) => {
  const server: HttpServer = createServer();
  const presenceStore = new InMemoryPresenceStore();
  const conversations = new StubConversationRepo({
    'conv-ab': { pairKey: 'user-a:user-b', participants: ['user-a', 'user-b'] },
    'conv-general': { pairKey: '__general__', participants: [] },
  });
  const messages = new StubMessageRepo();

  const hub = new ChatSocketHub();
  await hub.initialize(server, stubAuth, {
    presenceStore,
    conversationRepo: conversations,
    messageRepo: messages,
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;

  t.after(async () => {
    await hub.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  await t.test('unauthorized socket is rejected', async () => {
    await assert.rejects(
      () => connectClient(port, 'bad'),
      /xhr poll error|Unauthorized|websocket error/i
    );
  });

  await t.test('authorized socket receives presence snapshot', async () => {
    const snapshotPromise = new Promise<{ onlineUserIds: string[]; onlineCount: number }>(
      (resolve) => {
        void connectClient(port, 'a', {
          'chat:presence:snapshot': resolve,
        }).then((socket) => {
          t.after(() => socket.disconnect());
        });
      }
    );
    const snapshot = await snapshotPromise;
    assert.ok(Array.isArray(snapshot.onlineUserIds));
    assert.ok(snapshot.onlineUserIds.includes('user-a'));
    assert.equal(typeof snapshot.onlineCount, 'number');
  });

  await t.test('presence connect/disconnect deltas broadcast', async () => {
    const deltas: any[] = [];
    const socketA = await connectClient(port, 'a', {
      'chat:presence': (payload) => deltas.push(payload),
    });
    t.after(() => socketA.disconnect());

    const socketB = await connectClient(port, 'b');
    t.after(() => socketB.disconnect());
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.ok(
      deltas.some((d) => d.userId === 'user-b' && d.isOnline === true),
      `expected online delta for B, got ${JSON.stringify(deltas)}`
    );

    socketB.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(
      deltas.some((d) => d.userId === 'user-b' && d.isOnline === false),
      `expected offline delta for B, got ${JSON.stringify(deltas)}`
    );
  });

  await t.test('multi-socket: closing one socket keeps user online', async () => {
    const deltas: any[] = [];
    const observer = await connectClient(port, 'obs', {
      'chat:presence': (payload) => deltas.push(payload),
    });
    t.after(() => observer.disconnect());

    const first = await connectClient(port, 'multi');
    const second = await connectClient(port, 'multi');
    t.after(() => first.disconnect());
    t.after(() => second.disconnect());
    await new Promise((resolve) => setTimeout(resolve, 100));

    first.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(
      !deltas.some((d) => d.userId === 'user-multi' && d.isOnline === false),
      `user must stay online while a socket remains: ${JSON.stringify(deltas)}`
    );

    second.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.ok(
      deltas.some((d) => d.userId === 'user-multi' && d.isOnline === false),
      `user must go offline when the last socket closes: ${JSON.stringify(deltas)}`
    );
  });

  await t.test('DM message emission reaches the recipient room', async () => {
    const socketA = await connectClient(port, 'a');
    t.after(() => socketA.disconnect());

    const received = once(socketA, 'chat:message:new');
    hub.emitMessageNew(['user-a'], {
      conversationId: 'conv-ab',
      message: { id: 'm1', text: 'hello' },
    });
    const payload = await received;
    assert.equal(payload.message.text, 'hello');
    assert.equal(payload.conversationId, 'conv-ab');
  });

  await t.test('general message emission reaches every connected client', async () => {
    const socketB = await connectClient(port, 'b');
    t.after(() => socketB.disconnect());

    const received = once(socketB, 'chat:message:new');
    hub.emitGeneralMessageNew({
      conversationId: 'conv-general',
      message: { id: 'm2', text: 'general hi' },
    });
    const payload = await received;
    assert.equal(payload.message.text, 'general hi');
  });

  await t.test('typing is forwarded only between participants', async () => {
    const socketA = await connectClient(port, 'a');
    const socketB = await connectClient(port, 'b');
    const outsider = await connectClient(port, 'c');
    t.after(() => socketA.disconnect());
    t.after(() => socketB.disconnect());
    t.after(() => outsider.disconnect());

    // Outsider (user-c) is not a participant of conv-ab: no emission to B.
    let bTyping: any = null;
    socketB.on('chat:typing', (payload) => (bTyping = payload));
    outsider.emit('chat:typing', { conversationId: 'conv-ab', isTyping: true });
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(bTyping, null, 'non-participant typing must not be forwarded');

    const typingPromise = once(socketB, 'chat:typing');
    socketA.emit('chat:typing', { conversationId: 'conv-ab', isTyping: true });
    const payload = await typingPromise;
    assert.equal(payload.userId, 'user-a');
    assert.equal(payload.isTyping, true);

    // Disconnecting the typer clears the indicator for the peer.
    const clearPromise = once(socketB, 'chat:typing');
    socketA.disconnect();
    const cleared = await clearPromise;
    assert.equal(cleared.userId, 'user-a');
    assert.equal(cleared.isTyping, false);
  });

  await t.test('typing is throttled server-side', async () => {
    const socketA = await connectClient(port, 'a');
    const socketB = await connectClient(port, 'b');
    t.after(() => socketA.disconnect());
    t.after(() => socketB.disconnect());

    let count = 0;
    socketB.on('chat:typing', (payload) => {
      if (payload.userId === 'user-a') count += 1;
    });
    for (let i = 0; i < 10; i += 1) {
      socketA.emit('chat:typing', { conversationId: 'conv-ab', isTyping: true });
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.ok(
      count >= 1 && count <= 2,
      `expected throttled typing emissions (1-2), got ${count}`
    );
  });

  await t.test('read receipts validate membership and persist', async () => {
    const socketB = await connectClient(port, 'b');
    const outsider = await connectClient(port, 'c');
    t.after(() => socketB.disconnect());
    t.after(() => outsider.disconnect());

    outsider.emit('chat:read', { conversationId: 'conv-ab' });
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(messages.reads.length, 0, 'non-participant read must be rejected');

    const readPromise = once(socketB, 'chat:read:updated');
    const socketA = await connectClient(port, 'a');
    t.after(() => socketA.disconnect());
    socketA.emit('chat:read', { conversationId: 'conv-ab' });
    const payload = await readPromise;
    assert.equal(payload.userId, 'user-a');
    assert.equal(payload.conversationId, 'conv-ab');
    assert.ok(messages.reads.some((r) => r.readerId === 'user-a'));
  });

  await t.test('malformed payloads do not crash handlers', async () => {
    const socketA = await connectClient(port, 'a');
    t.after(() => socketA.disconnect());
    socketA.emit('chat:typing', null);
    socketA.emit('chat:typing', { conversationId: 42, isTyping: 'yes' });
    socketA.emit('chat:read', { conversationId: '' });
    socketA.emit('chat:read', {});
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(await presenceStore.isUserOnline('user-a'), true);
  });

  await t.test('disconnect reasons are recorded', async () => {
    const socketA = await connectClient(port, 'a');
    socketA.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 150));
    const stats = hub.getStats();
    assert.ok(
      stats.totalDisconnections >= 1,
      'disconnection counter must increment'
    );
    assert.ok(
      Object.keys(stats.disconnectReasons).length >= 1,
      'disconnect reasons must be captured'
    );
  });
});
