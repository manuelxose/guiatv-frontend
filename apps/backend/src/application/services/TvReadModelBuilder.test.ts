import test from 'node:test';
import assert from 'node:assert/strict';
import { scopeResolvedProgramsToCoreSources, TvReadModelBuilder } from './TvReadModelBuilder';
import { PRIMARY_EPG_SOURCE_URL, SECONDARY_EPG_SOURCE_URL, TDTCHANNELS_EPG_SOURCE_URL } from '@/shared/config/epgSources';

const builder = new TvReadModelBuilder({} as any, {} as any);

test('fallback EPG programmes cannot introduce secondary-only channels', () => {
  const entries = [
    { program: { id: 'primary', sourceFeed: PRIMARY_EPG_SOURCE_URL }, resolvedChannelId: 'la_1' },
    { program: { id: 'tdt', sourceFeed: TDTCHANNELS_EPG_SOURCE_URL }, resolvedChannelId: 'tv3' },
    { program: { id: 'secondary-merge', sourceFeed: SECONDARY_EPG_SOURCE_URL }, resolvedChannelId: 'la_1' },
    { program: { id: 'secondary-only', sourceFeed: SECONDARY_EPG_SOURCE_URL }, resolvedChannelId: 'foreign_only' },
  ];

  assert.deepEqual(
    scopeResolvedProgramsToCoreSources(entries, PRIMARY_EPG_SOURCE_URL).map((entry) => entry.program.id),
    ['primary', 'tdt', 'secondary-merge']
  );
});

test('TvReadModelBuilder resolves Discovery Max aliases to canonical DMAX channel', () => {
  const channels = [
    {
      id: 'discovery_max',
      name: 'Discovery Max',
      type: 'Cable',
      order: 400,
      aliases: ['discovery_max'],
      sourceIds: ['DiscoveryMax.es'],
      country: 'España',
      countryCode: 'ES',
    },
    {
      id: 'dmax',
      name: 'DMAX',
      type: 'TDT',
      order: 10,
      aliases: ['dmax'],
      sourceIds: ['DMAX'],
      country: 'España',
      countryCode: 'ES',
    },
  ];

  const { canonicalChannelById, channelByAlias } = (builder as any).buildCanonicalChannelMaps(channels);
  const channelById = new Map(channels.map((channel) => [channel.id, channel] as const));
  const resolved = (builder as any).resolveChannelDocument(
    ['DiscoveryMax.es', 'discovery_max'],
    canonicalChannelById,
    channelByAlias,
    channelById
  );

  assert.equal(resolved?.id, 'dmax');
  assert.equal(resolved?.order, 10);
});

test('TvReadModelBuilder upgrades unresolved TMDB movie airings to Cine', () => {
  const category = (builder as any).resolveEditorialCategory({
    title: 'Le llamaban Calamidad',
    description:
      'Después de haber robado una cantidad de dinero que transportaba un tren...',
    duration: 95,
    tmdbId: 95998,
    trustFlags: { tmdbKind: 'movie' },
  });

  assert.equal(category, 'Cine');
});

test('TvReadModelBuilder suppresses generic TDT movie blocks when TDTChannels provides a specific title', () => {
  const map = (builder as any).buildTitleResolutionMap([
    {
      program: {
        id: 'primary-generic',
        title: 'Cine',
        genre: 'Cine',
        description: 'Película del oeste',
        sourceFeed: PRIMARY_EPG_SOURCE_URL,
        startTime: new Date('2026-03-27T10:05:00.000Z'),
        endTime: new Date('2026-03-27T11:30:00.000Z'),
        duration: 85,
      },
      resolvedChannelId: 'la_2',
      channelGroup: 'tdt',
      channelDoc: { id: 'la_2' },
    },
    {
      program: {
        id: 'tdtchannels-specific',
        title: 'Repoker de bribones',
        genre: 'Cine',
        description: 'Western',
        sourceFeed: TDTCHANNELS_EPG_SOURCE_URL,
        startTime: new Date('2026-03-27T10:07:00.000Z'),
        endTime: new Date('2026-03-27T11:31:00.000Z'),
        duration: 84,
      },
      resolvedChannelId: 'la_2',
      channelGroup: 'tdt',
      channelDoc: { id: 'la_2' },
    },
  ]);

  assert.deepEqual(map.get('primary-generic'), {
    state: 'generic_suppressed',
    isResolvedTitle: false,
    consumerSuppressed: true,
    suppressionReason: 'generic_replaced_by_specific_source',
    winnerProgramId: 'tdtchannels-specific',
    winnerSourceFeed: TDTCHANNELS_EPG_SOURCE_URL,
  });
  assert.deepEqual(map.get('tdtchannels-specific'), {
    state: 'specific_source_title',
    isResolvedTitle: true,
    consumerSuppressed: false,
  });
});

test('TvReadModelBuilder suppresses unresolved generic TDT movie blocks from consumer surfaces', () => {
  const map = (builder as any).buildTitleResolutionMap([
    {
      program: {
        id: 'primary-generic',
        title: 'Cine',
        genre: 'Cine',
        sourceFeed: PRIMARY_EPG_SOURCE_URL,
        startTime: new Date('2026-03-28T21:45:00.000Z'),
        endTime: new Date('2026-03-28T23:30:00.000Z'),
        duration: 105,
      },
      resolvedChannelId: 'cuatro',
      channelGroup: 'tdt',
      channelDoc: { id: 'cuatro' },
    },
  ]);

  assert.deepEqual(map.get('primary-generic'), {
    state: 'generic_unresolved',
    isResolvedTitle: false,
    consumerSuppressed: true,
    suppressionReason: 'generic_unresolved',
  });
});
