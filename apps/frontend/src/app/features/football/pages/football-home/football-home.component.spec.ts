import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballHomeComponent } from './football-home.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballLiveRefreshService } from '@app/features/football/football-live-refresh.service';
import { FootballHomeDTO, FootballMatchDTO } from '@app/features/football/football.models';
import { FootballMatchCardComponent } from '@app/features/football/components/football-match-card/football-match-card.component';
import { MetaService } from '@app/services/meta.service';
import { AffiliateService } from '@app/services/affiliate.service';

function match(id: string): FootballMatchDTO {
  return {
    id,
    slug: id,
    providerIds: {},
    competition: { id: 'c1', slug: 'laliga', name: 'LaLiga' },
    kickoffAt: '2026-08-21T19:00:00.000Z',
    status: 'scheduled',
    homeTeam: { id: 'h', slug: 'h', name: 'Home', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: 'a', slug: 'a', name: 'Away', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: null, away: null },
    broadcasts: [],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '',
  };
}

function home(): FootballHomeDTO {
  return {
    liveMatches: [],
    todayMatches: [],
    featuredMatches: [match('featured-1')],
    upcomingMatches: [match('upcoming-1')],
    featuredCompetitions: [],
    latestNews: [],
    generatedAt: new Date().toISOString(),
  };
}

describe('FootballHomeComponent — affiliate CTA is scoped to the featured rail only', () => {
  it('enables the affiliate CTA on the featured-matches card but not on the upcoming (compact) card', () => {
    TestBed.configureTestingModule({
      imports: [FootballHomeComponent],
      providers: [
        provideRouter([]),
        { provide: FootballFacade, useValue: { getHome: () => of(home()) } },
        { provide: FootballLiveRefreshService, useValue: { liveMatches: () => of([]) } },
        { provide: MetaService, useValue: { setMetaTags: () => {} } },
        { provide: AffiliateService, useValue: { resolveMany: () => of([]), buildOutboundUrl: () => null } },
      ],
    });

    const fixture = TestBed.createComponent(FootballHomeComponent);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll((de) => de.componentInstance instanceof FootballMatchCardComponent);
    const featuredCard = cards.find((c) => (c.componentInstance as FootballMatchCardComponent).variant === 'featured');
    const compactCard = cards.find((c) => (c.componentInstance as FootballMatchCardComponent).variant === 'compact');

    expect(featuredCard).toBeTruthy();
    expect((featuredCard!.componentInstance as FootballMatchCardComponent).enableAffiliateCta).toBe(true);
    expect(compactCard).toBeTruthy();
    expect((compactCard!.componentInstance as FootballMatchCardComponent).enableAffiliateCta).toBe(false);
  });
});
