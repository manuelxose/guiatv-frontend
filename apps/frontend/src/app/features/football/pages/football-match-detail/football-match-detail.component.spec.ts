import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballMatchDetailComponent } from './football-match-detail.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballMatchDetailDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';

function detail(overrides: Partial<FootballMatchDetailDTO['match']> = {}): FootballMatchDetailDTO {
  return {
    match: {
      id: 'm1',
      slug: 'real-madrid-barcelona',
      providerIds: {},
      competition: { id: 'c1', slug: 'laliga', name: 'LaLiga' },
      kickoffAt: '2026-08-21T19:00:00.000Z',
      status: 'scheduled',
      homeTeam: { id: 't1', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' },
      awayTeam: { id: 't2', slug: 'barcelona', name: 'Barcelona', aliases: [], providerIds: {}, lastUpdatedAt: '' },
      score: { home: null, away: null },
      broadcasts: [],
      sourceProvenance: { source: 'test', confidence: 'high' },
      lastUpdatedAt: '',
      ...overrides,
    },
    relatedNews: [],
    meta: {},
  };
}

describe('FootballMatchDetailComponent (SEO/meta regression)', () => {
  // Regression coverage for a real production bug: the previous version set
  // `robots: noindex` synchronously on init and only cleared it once the
  // match resolved, but that clearing step didn't reliably win the race
  // against SSR serialization — every match page shipped `noindex` to
  // crawlers. This locks in the discriminated-state fix: a found match must
  // end up indexable, a genuinely missing one must end up noindex.

  function setup(matchResult: FootballMatchDetailDTO | null) {
    const setMetaTags = jasmine.createSpy('setMetaTags');
    TestBed.configureTestingModule({
      imports: [FootballMatchDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ slug: 'real-madrid-barcelona' })) },
        },
        {
          provide: FootballFacade,
          useValue: { getMatch: () => of(matchResult), getCompetition: () => of(null) },
        },
        { provide: MetaService, useValue: { setMetaTags } },
      ],
    });
    const fixture = TestBed.createComponent(FootballMatchDetailComponent);
    fixture.detectChanges();
    return { fixture, setMetaTags };
  }

  it('a found match never ends up noindex', () => {
    const { setMetaTags } = setup(detail());
    const calls = setMetaTags.calls.allArgs().map((args) => args[0]);
    const lastCall = calls[calls.length - 1];
    expect(lastCall.robots).toBeUndefined(); // MetaService defaults undefined robots to indexable
    expect(lastCall.title).toContain('Real Madrid');
  });

  it('a genuinely missing match ends up noindex', () => {
    const { setMetaTags } = setup(null);
    const calls = setMetaTags.calls.allArgs().map((args) => args[0]);
    const lastCall = calls[calls.length - 1];
    expect(lastCall.robots).toBe('noindex, follow');
  });

  it('exposes loading()/detail() consistently with the resolved state', () => {
    const { fixture } = setup(detail());
    const component = fixture.componentInstance;
    expect(component.loading()).toBeFalse();
    expect(component.detail()?.match.slug).toBe('real-madrid-barcelona');
  });
});
