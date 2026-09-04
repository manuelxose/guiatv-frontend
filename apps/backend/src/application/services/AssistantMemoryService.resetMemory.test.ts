import assert from 'node:assert/strict';
import test from 'node:test';
import { AssistantMemoryService } from './AssistantMemoryService';
import { UserAssistantMemoryModel } from '@/infrastructure/database/models/UserAssistantMemory.model';

/**
 * resetMemory must clear only the assistant-owned, user-configurable fields
 * (viewing context, duration, reference titles, negative signals, regional
 * community) and leave profile-owned copies (likedGenres/preferredPlatforms)
 * and auto-learned signals (dislikedGenres/avoidedPlatforms/recentTopics)
 * untouched — see the method's docstring for why.
 */
function fakeMemoryDocument(overrides: Record<string, unknown> = {}) {
  const doc: Record<string, unknown> = {
    userId: 'user-1',
    likedGenres: ['Series'],
    dislikedGenres: ['Terror'],
    preferredPlatforms: ['Netflix'],
    avoidedPlatforms: ['Pluto TV'],
    preferredDurations: ['corto'],
    preferredViewingContexts: ['En pareja'],
    favoriteFranchisesOrTitles: ['The Bear'],
    recentTopics: ['baloncesto'],
    negativeSignals: ['Realities'],
    preferredAutonomousCommunity: 'Galicia',
    autonomicOptIn: true,
    lastCommunityConfirmationAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-20T00:00:00.000Z'),
    ...overrides,
  };
  (doc as { save: () => Promise<void> }).save = async () => undefined;
  return doc;
}

async function withStubbedMemoryFindOne<T>(
  document: ReturnType<typeof fakeMemoryDocument> | null,
  run: () => Promise<T>
): Promise<T> {
  const original = UserAssistantMemoryModel.findOne;
  (UserAssistantMemoryModel as unknown as { findOne: unknown }).findOne = () => ({
    lean: () => ({ exec: async () => document }),
  });
  try {
    return await run();
  } finally {
    (UserAssistantMemoryModel as unknown as { findOne: typeof original }).findOne = original;
  }
}

test('resetMemory clears assistant-owned fields but leaves profile-copy and auto-learned fields untouched', async () => {
  const document = fakeMemoryDocument();
  const service = new AssistantMemoryService();

  const result = await withStubbedMemoryFindOne(document, () => service.resetMemory('user-1'));

  assert.deepEqual(result.preferredViewingContexts, []);
  assert.deepEqual(result.preferredDurations, []);
  assert.deepEqual(result.favoriteFranchisesOrTitles, []);
  assert.deepEqual(result.negativeSignals, []);
  assert.equal(result.preferredAutonomousCommunity, undefined);
  assert.equal(result.autonomicOptIn, 'unknown');

  // Not part of the "AI Assistant" editable card — must survive a reset.
  assert.deepEqual(result.likedGenres, ['Series']);
  assert.deepEqual(result.preferredPlatforms, ['Netflix']);
  assert.deepEqual(result.dislikedGenres, ['Terror']);
  assert.deepEqual(result.avoidedPlatforms, ['Pluto TV']);
  assert.deepEqual(result.recentTopics, ['baloncesto']);
});
