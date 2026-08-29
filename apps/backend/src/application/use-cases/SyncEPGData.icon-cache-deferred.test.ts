import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { SyncEPGData } from './SyncEPGData';
import { Channel } from '@/domain/entities/Channel';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import { XMLParser } from '@/infrastructure/parsers/XMLParser';
import { ProgramDataParser } from '@/infrastructure/parsers/ProgramDataParser';

/**
 * Regression guard for the deferred channel-icon-caching fix: the sequential
 * channel identity-resolution loop used to `await this.cacheChannelIcon(...)`
 * inline for every new/changed channel — a real network call (up to ~20s on
 * failure, with a retry) that fully blocked the loop from moving on to the
 * next channel. Icon fetches are now queued during that loop and drained
 * afterward with bounded concurrency, so a slow/hanging icon fetch must not
 * hold up channel processing.
 */

function fakeChannelRepository() {
  const byId = new Map<string, Channel>();
  const saveLog: Array<{ id: string; icon: string | null }> = [];
  return {
    findAll: async () => [],
    findById: async (id: ChannelId) => byId.get(id.value) || null,
    findByNormalizedName: async () => null,
    save: async (channel: Channel) => {
      byId.set(channel.id, channel);
      saveLog.push({ id: channel.id, icon: channel.icon });
    },
    delete: async () => {},
    saveLog,
  };
}

function fakeProgramRepository() {
  return {
    findById: async () => null,
    findByChannel: async () => [],
    findByDateRange: async () => [],
    findByDate: async () => [],
    findNowPlaying: async () => [],
    search: async () => ({ items: [], total: 0 }),
    save: async () => undefined,
    saveBatch: async () => undefined,
    deleteByDateRange: async () => undefined,
    deleteOverlappingByChannels: async () => undefined,
    deleteOverlappingBySourceAndChannels: async () => undefined,
    backfillComputedFields: async () => 0,
    findByTitleApprox: async () => [],
    findEnrichedByTitles: async () => [],
  };
}

function fakeCacheRepository() {
  return {
    get: async () => null,
    set: async () => undefined,
    delete: async () => undefined,
    clear: async () => undefined,
  };
}

function fakeStorageRepository(uploadedPath: string) {
  return {
    exists: async () => false,
    upload: async () => uploadedPath,
    download: async () => Buffer.from(''),
    delete: async () => undefined,
    getMetadata: async () => ({}),
    list: async () => [],
  };
}

function fakeTmdbService() {
  return {};
}

async function withStubbedAxiosGet<T>(
  impl: () => Promise<{ data: ArrayBuffer }>,
  run: () => Promise<T>
): Promise<T> {
  const original = axios.get;
  (axios as any).get = impl;
  try {
    return await run();
  } finally {
    (axios as any).get = original;
  }
}

const parsedChannel = {
  id: 'src-1',
  displayName: 'Canal Test',
  icon: 'https://example.test/icon.png',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('icon fetches for new channels run with bounded concurrency, not one at a time', async () => {
  const channelRepository = fakeChannelRepository();
  const channelCount = 16;
  const perFetchDelayMs = 150;
  // The old code awaited cacheChannelIcon() inline in the sequential
  // identity-resolution loop — N channels meant N sequential fetches. The
  // fix queues them and drains with a concurrency limit of 8, so total wall
  // time should track ceil(N / 8) batches, not N.
  const oldSequentialBoundMs = channelCount * perFetchDelayMs;
  const parsedChannels = Array.from({ length: channelCount }, (_, i) => ({
    id: `src-${i}`,
    displayName: `Canal Distinct ${i}`,
    icon: `https://example.test/icon-${i}.png`,
  }));

  const startedAt = Date.now();
  await withStubbedAxiosGet(
    async () => {
      await delay(perFetchDelayMs);
      return { data: new ArrayBuffer(4) };
    },
    async () => {
      const useCase = new SyncEPGData(
        channelRepository as any,
        fakeProgramRepository() as any,
        fakeCacheRepository() as any,
        fakeStorageRepository('channel_icons/cached.webp') as any,
        new XMLParser(),
        new ProgramDataParser(),
        fakeTmdbService() as any
      );

      const result = await useCase.execute({
        sourceUrl: 'https://example.test/epg.xml',
        xmlContent: '<tv></tv>',
        parsedData: { channels: parsedChannels, programmes: [] },
        skipSaveXml: true,
      });

      assert.equal(result.success, true);
    }
  );
  const elapsedMs = Date.now() - startedAt;

  const uniqueChannelIds = new Set(channelRepository.saveLog.map((entry) => entry.id));
  assert.equal(uniqueChannelIds.size, channelCount);

  assert.ok(
    elapsedMs < oldSequentialBoundMs / 2,
    `expected bounded-concurrency draining well under the ${oldSequentialBoundMs}ms serial bound, took ${elapsedMs}ms`
  );

  // Every channel was saved immediately with its raw feed icon URL (visible
  // as the first save per channel) before any fetch had a chance to resolve.
  const firstSaveIcons = new Set(
    channelRepository.saveLog.slice(0, channelCount).map((entry) => entry.icon)
  );
  parsedChannels.forEach((parsed) => assert.ok(firstSaveIcons.has(parsed.icon)));
});

test('a queued icon fetch that succeeds is applied as a follow-up save once it resolves', async () => {
  const channelRepository = fakeChannelRepository();
  const cachedPath = 'channel_icons/canal-test.webp';

  await withStubbedAxiosGet(
    async () => ({ data: new ArrayBuffer(4) }),
    async () => {
      const useCase = new SyncEPGData(
        channelRepository as any,
        fakeProgramRepository() as any,
        fakeCacheRepository() as any,
        fakeStorageRepository(cachedPath) as any,
        new XMLParser(),
        new ProgramDataParser(),
        fakeTmdbService() as any
      );

      const result = await useCase.execute({
        sourceUrl: 'https://example.test/epg.xml',
        xmlContent: '<tv></tv>',
        parsedData: { channels: [parsedChannel], programmes: [] },
        skipSaveXml: true,
      });

      assert.equal(result.success, true);
    }
  );

  // Two saves for the one channel: the immediate save with the raw feed URL,
  // then the follow-up save once the queued fetch resolved with the locally
  // cached path — and execute() only returns after that follow-up lands.
  assert.equal(channelRepository.saveLog.length, 2);
  assert.equal(channelRepository.saveLog[0].icon, parsedChannel.icon);
  assert.equal(channelRepository.saveLog[1].icon, cachedPath);
});
