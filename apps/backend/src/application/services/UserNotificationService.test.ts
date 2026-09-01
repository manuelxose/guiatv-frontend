import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserNotificationService } from './UserNotificationService';
import { ChatSocketHub } from '../../presentation/realtime/ChatSocketHub';

function makeFakeModel() {
  const rows: any[] = [];
  let seq = 1;
  const fakeDoc = (data: any) => ({
    ...data,
    _id: `n${seq++}`,
    createdAt: data.createdAt || new Date(),
    save() {
      return Promise.resolve(this);
    },
  });
  const model: any = {
    rows,
    async create(data: any) {
      const doc = fakeDoc(data);
      rows.push(doc);
      return doc;
    },
    findOne(query: Record<string, unknown>) {
      const match = rows.filter((row) => {
        for (const [key, value] of Object.entries(query)) {
          if (key === 'readAt' && (value as any)?.$exists === false) {
            if (row.readAt !== undefined) return false;
            continue;
          }
          if (row[key] !== value) return false;
        }
        return true;
      });
      return {
        sort: () => ({ exec: async () => (match.length ? match[match.length - 1] : null) }),
      };
    },
  };
  return model;
}

test('notifyMessage creates one notification for a new conversation', async () => {
  const model = makeFakeModel();
  const service = new UserNotificationService(model as any);
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-a',
    actorName: 'A',
    conversationId: 'c1',
    preview: 'hola',
  });
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].type, 'message');
  assert.equal(model.rows[0].title, 'Nuevo mensaje de A');
});

test('notifyMessage consolidates unread notifications for the same conversation', async () => {
  const model = makeFakeModel();
  const service = new UserNotificationService(model as any);
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-a',
    actorName: 'A',
    conversationId: 'c1',
    preview: 'primero',
  });
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-a',
    actorName: 'A',
    conversationId: 'c1',
    preview: 'segundo',
  });
  // Still one row: the unread one was refreshed.
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].description, 'segundo');
});

test('notifyMessage creates a new notification once the previous one was read', async () => {
  const model = makeFakeModel();
  const service = new UserNotificationService(model as any);
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-a',
    actorName: 'A',
    conversationId: 'c1',
    preview: 'primero',
  });
  model.rows[0].readAt = new Date();
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-a',
    actorName: 'A',
    conversationId: 'c1',
    preview: 'despues de leer',
  });
  assert.equal(model.rows.length, 2);
  assert.equal(model.rows[1].description, 'despues de leer');
});

test('notifyMessage keeps separate notifications per conversation', async () => {
  const model = makeFakeModel();
  const service = new UserNotificationService(model as any);
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-a',
    actorName: 'A',
    conversationId: 'c1',
    preview: 'uno',
  });
  await service.notifyMessage({
    recipientId: 'u-b',
    actorId: 'u-c',
    actorName: 'C',
    conversationId: 'c2',
    preview: 'dos',
  });
  assert.equal(model.rows.length, 2);
});

test('notifyMessage emits a socket notification', async () => {
  const emitted: any[] = [];
  const hub = ChatSocketHub.getInstance() as any;
  const original = hub.emitNotification;
  hub.emitNotification = (recipientId: string, payload: any) => emitted.push({ recipientId, payload });
  try {
    const model = makeFakeModel();
    const service = new UserNotificationService(model as any);
    await service.notifyMessage({
      recipientId: 'u-b',
      actorId: 'u-a',
      actorName: 'A',
      conversationId: 'c1',
      preview: 'hola',
    });
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].recipientId, 'u-b');
    assert.equal(emitted[0].payload.type, 'message');
  } finally {
    hub.emitNotification = original;
  }
});
