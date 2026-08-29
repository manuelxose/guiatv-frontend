import assert from 'node:assert/strict';
import test from 'node:test';
import { GetContentDetail } from './GetContentDetail';
import { Program, ProgramProps } from '@/domain/entities/Program';
import { DateRange } from '@/domain/value-objects/DateRange';
import { DateUtils } from '@/shared/utils/dateUtils';

/**
 * Regression guard for the perf fix in loadRelated/loadUpcomingAirings: both
 * used to pull an entire day (or two full days, across every channel) via
 * `programRepository.findByDate(...)` with no limit, just to filter/sort/
 * slice a handful of items in process. They were rewritten to push the
 * filter down to Mongo via `findByDateRange` (genre + limit) and
 * `findByTitleApprox` (indexed title/time-window search) instead.
 *
 * This test fails loudly if either method is ever reintroduced: the fake
 * repository's `findByDate` throws, so any regression to the old full-day-
 * scan pattern surfaces immediately instead of silently reappearing as a
 * production slowdown.
 */

function makeProgram(overrides: Partial<ProgramProps> = {}): Program {
  return Program.create({
    id: 'prog-1',
    channelId: 'chan-1',
    title: 'Test Show',
    startTime: new Date('2026-08-29T20:00:00.000Z'),
    endTime: new Date('2026-08-29T21:00:00.000Z'),
    ...overrides,
  });
}

function fakeCacheRepository() {
  return {
    get: async () => null,
    set: async () => undefined,
    delete: async () => undefined,
    clear: async () => undefined,
  };
}

function fakeTmdbService() {
  return {
    getImageUrl: () => undefined,
    // No tmdbId on the fixture program and genre 'Cine' triggers a movie
    // lookup by title in resolveTmdb(); returning nothing keeps the rest of
    // execute() on its no-tmdbId branch without needing a real TMDB result.
    searchMovie: async () => null,
    searchSeries: async () => null,
    getMovieById: async () => null,
    getTVById: async () => null,
  };
}

function fakeStreamingProvidersService() {
  return {
    getMovieProviders: async () => null,
    getTVProviders: async () => null,
    getLogoUrl: () => '',
  };
}

function fakeInteractionRepository() {
  return {
    findByUserAndContent: async () => null,
    findByUser: async () => [],
  };
}

test('loadRelated calls findByDateRange with a genre filter and a bounded limit, never findByDate', async () => {
  const calls = {
    findByDate: 0,
    findByDateRange: [] as Array<{ start: Date; end: Date; filters: any }>,
    findByTitleApprox: [] as Array<{ titleFragment: string; windowHours?: number }>,
  };

  const programRepository = {
    findById: async () => makeProgram({ genre: 'Cine' }),
    findByDate: async () => {
      calls.findByDate += 1;
      throw new Error(
        'loadRelated/loadUpcomingAirings must not call findByDate — that reintroduces the unbounded full-day scan this fix removed'
      );
    },
    findByDateRange: async (range: DateRange, filters?: any) => {
      calls.findByDateRange.push({ start: range.start, end: range.end, filters });
      return [makeProgram({ id: 'prog-2', title: 'Related Show', genre: 'Cine' })];
    },
    findByTitleApprox: async (titleFragment: string, windowHours?: number) => {
      calls.findByTitleApprox.push({ titleFragment, windowHours });
      return [];
    },
  };

  const channelRepository = { findAll: async () => [] };

  const useCase = new GetContentDetail(
    programRepository as any,
    channelRepository as any,
    fakeCacheRepository() as any,
    fakeTmdbService() as any,
    fakeStreamingProvidersService() as any,
    fakeInteractionRepository() as any
  );

  const result = await useCase.execute({ programId: 'prog-1' });

  assert.equal(calls.findByDate, 0, 'findByDate should never be called');
  assert.equal(calls.findByDateRange.length, 1);

  const { start, end, filters } = calls.findByDateRange[0];
  const expected = DateUtils.getDayRangeYYYYMMDD('20260829');
  assert.equal(start.getTime(), expected.start.getTime());
  assert.equal(end.getTime(), expected.end.getTime());
  assert.equal(filters.genre, 'Cine');
  assert.equal(filters.limit, 30);

  assert.equal(result.related?.[0]?.title, 'Related Show');
});

test('loadUpcomingAirings calls findByTitleApprox (indexed, bounded) instead of scanning every channel for two days', async () => {
  const calls = {
    findByDate: 0,
    findByTitleApprox: [] as Array<{ titleFragment: string; windowHours?: number }>,
  };

  const programRepository = {
    findById: async () => makeProgram({ title: 'Documentary Special' }),
    findByDate: async () => {
      calls.findByDate += 1;
      throw new Error(
        'loadUpcomingAirings must not call findByDate — that reintroduces the two-full-day, all-channel scan this fix removed'
      );
    },
    findByDateRange: async () => [],
    findByTitleApprox: async (titleFragment: string, windowHours?: number) => {
      calls.findByTitleApprox.push({ titleFragment, windowHours });
      return [
        makeProgram({
          id: 'prog-3',
          channelId: 'chan-2',
          title: 'Documentary Special',
          startTime: new Date('2026-08-30T21:00:00.000Z'),
          endTime: new Date('2026-08-30T22:00:00.000Z'),
        }),
      ];
    },
  };

  const channelRepository = {
    findAll: async () => [{ id: 'chan-2', name: 'Channel Two', icon: 'icon.png' }],
  };

  const useCase = new GetContentDetail(
    programRepository as any,
    channelRepository as any,
    fakeCacheRepository() as any,
    fakeTmdbService() as any,
    fakeStreamingProvidersService() as any,
    fakeInteractionRepository() as any
  );

  const result = await useCase.execute({ programId: 'prog-1' });

  assert.equal(calls.findByDate, 0, 'findByDate should never be called');
  assert.equal(calls.findByTitleApprox.length, 1);
  assert.equal(calls.findByTitleApprox[0].titleFragment, 'Documentary Special');
  assert.equal(calls.findByTitleApprox[0].windowHours, 48);

  assert.equal(result.upcomingAirings?.length, 1);
  assert.equal(result.upcomingAirings?.[0]?.channelName, 'Channel Two');
});
