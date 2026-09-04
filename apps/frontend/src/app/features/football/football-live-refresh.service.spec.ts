import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { FootballLiveRefreshService, mergeLiveUpdates, resolveLiveSnapshot, shouldPollLiveTransitions } from './football-live-refresh.service';
import { FootballApiService } from './football-api.service';
import { FootballMatchDTO } from './football.models';

function match(id: string, overrides: Partial<FootballMatchDTO> = {}): FootballMatchDTO {
  return {
    id,
    slug: id,
    providerIds: {},
    competition: { id: 'c', slug: 'laliga', name: 'LaLiga' },
    kickoffAt: '2026-08-21T19:00:00.000Z',
    status: 'live',
    homeTeam: { id: 'h', slug: 'h', name: 'Home', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: 'a', slug: 'a', name: 'Away', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: 0, away: 0 },
    broadcasts: [],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '',
    ...overrides,
  };
}

describe('mergeLiveUpdates', () => {
  it('updates matching matches in place, by id, without reordering the list', () => {
    const base = [match('1', { score: { home: 0, away: 0 } }), match('2', { score: { home: 1, away: 0 } })];
    const updates = [match('1', { score: { home: 1, away: 0 }, minute: 12 })];
    const result = mergeLiveUpdates(base, updates);
    expect(result.map((m) => m.id)).toEqual(['1', '2']);
    expect(result[0].score).toEqual({ home: 1, away: 0 });
    expect(result[0].minute).toBe(12);
    expect(result[1]).toBe(base[1]); // untouched match is the same reference
  });

  it('is a no-op when there are no updates', () => {
    const base = [match('1')];
    expect(mergeLiveUpdates(base, [])).toBe(base);
  });

  it('ignores updates for matches not present in the base list', () => {
    const base = [match('1')];
    const result = mergeLiveUpdates(base, [match('999')]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });
});

describe('resolveLiveSnapshot', () => {
  it('keeps the initial response until the first successful poll completes', () => {
    const base = [match('1')];
    expect(resolveLiveSnapshot(base, null)).toBe(base);
  });

  it('adds newly live matches and removes matches absent from an authoritative snapshot', () => {
    expect(resolveLiveSnapshot([match('old')], [match('new')]).map((item) => item.id)).toEqual(['new']);
    expect(resolveLiveSnapshot([match('old')], [])).toEqual([]);
  });
});

describe('shouldPollLiveTransitions', () => {
  const now = new Date('2026-08-21T19:00:00.000Z').getTime();

  it('polls live matches and scheduled matches close to kickoff', () => {
    expect(shouldPollLiveTransitions([match('live')], now)).toBeTrue();
    expect(shouldPollLiveTransitions([match('soon', { status: 'scheduled', kickoffAt: '2026-08-21T19:15:00.000Z' })], now)).toBeTrue();
  });

  it('does not poll distant scheduled or finished matches', () => {
    expect(shouldPollLiveTransitions([match('later', { status: 'scheduled', kickoffAt: '2026-08-21T21:00:00.000Z' })], now)).toBeFalse();
    expect(shouldPollLiveTransitions([match('done', { status: 'finished' })], now)).toBeFalse();
  });
});

describe('FootballLiveRefreshService (SSR guard)', () => {
  it('never polls on the server — emits nothing', (done) => {
    TestBed.configureTestingModule({
      providers: [
        FootballLiveRefreshService,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: FootballApiService, useValue: { getLiveMatches: () => of({ data: { matches: [] } }) } },
      ],
    });
    const service = TestBed.inject(FootballLiveRefreshService);
    let emitted = false;
    service.liveMatches(of(true)).subscribe({
      next: () => (emitted = true),
      complete: () => {
        expect(emitted).toBeFalse();
        done();
      },
    });
  });
});
