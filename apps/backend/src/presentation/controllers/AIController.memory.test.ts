import test from 'node:test';
import assert from 'node:assert/strict';
import { AIController } from './AIController';

/**
 * Regression coverage for the Mi GuíaTV / assistant-memory transparency
 * surface (see docs on AssistantMemoryService.resetMemory and the
 * `/ai/memory` routes): a lightweight GET so the profile screen can read
 * memory without loading full chat history, a DELETE to reset only the
 * assistant-owned fields, and a PATCH that can explicitly clear the regional
 * "preferredAutonomousCommunity" preference — previously there was no way to
 * unset it once chosen, because an empty string was treated the same as the
 * field being absent.
 */

function responseDouble() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
}

function authedRequest(body: Record<string, unknown> = {}) {
  return { user: { id: 'user-1' }, body } as never;
}

function buildController(assistantMemoryService: Record<string, unknown>) {
  return new AIController({} as never, {} as never, assistantMemoryService as never, {} as never);
}

test('AIController.getMemory returns the current snapshot without mutating it', async () => {
  const calls: string[] = [];
  const memoryService = {
    getMemorySnapshot: async (userId: string) => {
      calls.push(userId);
      return { likedGenres: ['Series'], negativeSignals: [] };
    },
  };
  const controller = buildController(memoryService);
  const response = responseDouble();

  await controller.getMemory(authedRequest(), response as never);

  assert.deepEqual(calls, ['user-1']);
  assert.equal(response.statusCode, 200);
  assert.deepEqual((response.body as { data: { memory: unknown } }).data.memory, {
    likedGenres: ['Series'],
    negativeSignals: [],
  });
});

test('AIController.getMemory requires authentication', async () => {
  const controller = buildController({});
  await assert.rejects(
    controller.getMemory({ user: undefined, body: {} } as never, responseDouble() as never),
    /authentication required/i
  );
});

test('AIController.resetMemory delegates to AssistantMemoryService.resetMemory and returns the reset snapshot', async () => {
  const calls: string[] = [];
  const memoryService = {
    resetMemory: async (userId: string) => {
      calls.push(userId);
      return { preferredViewingContexts: [], negativeSignals: [], preferredAutonomousCommunity: undefined };
    },
  };
  const controller = buildController(memoryService);
  const response = responseDouble();

  await controller.resetMemory(authedRequest(), response as never);

  assert.deepEqual(calls, ['user-1']);
  assert.equal(response.statusCode, 200);
  assert.equal((response.body as { data: { memory: { preferredAutonomousCommunity?: string } } }).data.memory.preferredAutonomousCommunity, undefined);
});

test('AIController.updateMemory rejects an empty body (no fields, no community change)', async () => {
  const controller = buildController({});
  await assert.rejects(
    controller.updateMemory(authedRequest({}), responseDouble() as never),
    /at least one field must be provided/i
  );
});

test('AIController.updateMemory sets the community with autonomicOptIn=true when given a non-empty value', async () => {
  const calls: unknown[] = [];
  const memoryService = {
    saveCommunityPreference: async (input: unknown) => { calls.push(input); },
    updateMemory: async () => ({}),
    getMemorySnapshot: async () => ({}),
  };
  const controller = buildController(memoryService);

  await controller.updateMemory(
    authedRequest({ preferredAutonomousCommunity: 'Galicia' }),
    responseDouble() as never
  );

  assert.deepEqual(calls, [{ userId: 'user-1', preferredAutonomousCommunity: 'Galicia', autonomicOptIn: true }]);
});

test('AIController.updateMemory explicitly clears the community when the key is present but empty', async () => {
  const calls: unknown[] = [];
  const memoryService = {
    saveCommunityPreference: async (input: unknown) => { calls.push(input); },
    updateMemory: async () => ({}),
    getMemorySnapshot: async () => ({ preferredAutonomousCommunity: undefined }),
  };
  const controller = buildController(memoryService);
  const response = responseDouble();

  await controller.updateMemory(
    authedRequest({ preferredAutonomousCommunity: '' }),
    response as never
  );

  assert.deepEqual(calls, [{ userId: 'user-1', preferredAutonomousCommunity: '', autonomicOptIn: 'unknown' }]);
  assert.equal(response.statusCode, 200);
});

test('AIController.updateMemory leaves the community untouched when the key is absent entirely', async () => {
  const calls: unknown[] = [];
  const memoryService = {
    saveCommunityPreference: async (input: unknown) => { calls.push(input); },
    updateMemory: async (userId: string, updates: Record<string, string[]>) => {
      assert.equal(userId, 'user-1');
      assert.deepEqual(updates, { negativeSignals: ['Terror'] });
      return { negativeSignals: ['Terror'] };
    },
  };
  const controller = buildController(memoryService);

  await controller.updateMemory(
    authedRequest({ negativeSignals: ['Terror'] }),
    responseDouble() as never
  );

  assert.deepEqual(calls, []);
});
