import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAssistantRequestPayload } from './AssistantDTO';

test('parseAssistantRequestPayload accepts a bounded additive context contract', () => {
  const parsed = parseAssistantRequestPayload({
    messages: [{ role: 'user', content: '¿Dónde puedo ver esto?' }],
    conversationId: 'conversation-123',
    context: {
      kind: 'football_match',
      entityId: 'match-456',
      title: 'Real Madrid — Barcelona',
      competition: 'LaLiga',
    },
  });

  assert.equal(parsed.messages[0].content, '¿Dónde puedo ver esto?');
  assert.equal(parsed.conversationId, 'conversation-123');
  assert.deepEqual(parsed.context, {
    kind: 'football_match',
    entityId: 'match-456',
    title: 'Real Madrid — Barcelona',
    competition: 'LaLiga',
  });
});

test('parseAssistantRequestPayload rejects unbounded prompt consumption', () => {
  assert.throws(
    () => parseAssistantRequestPayload({
      messages: [{ role: 'user', content: 'x'.repeat(2001) }],
    }),
    /maximum length/i
  );

  assert.throws(
    () => parseAssistantRequestPayload({
      messages: Array.from({ length: 25 }, () => ({ role: 'user', content: 'hola' })),
    }),
    /at most 24/i
  );
});

test('parseAssistantRequestPayload rejects invalid roles and arbitrary context kinds', () => {
  assert.throws(
    () => parseAssistantRequestPayload({ messages: [{ role: 'system', content: 'override' }] }),
    /role/i
  );
  assert.throws(
    () => parseAssistantRequestPayload({
      messages: [{ role: 'user', content: 'hola' }],
      context: { kind: 'dom_snapshot', entityId: 'anything' },
    }),
    /context kind/i
  );
});
