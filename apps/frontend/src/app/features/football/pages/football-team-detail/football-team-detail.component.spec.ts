import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballTeamDetailComponent } from './football-team-detail.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballTeamDetailDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';

function detail(): FootballTeamDetailDTO {
  return {
    team: { id: 't1', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    nextMatch: null,
    lastResult: null,
    matches: [],
    news: [],
    meta: {},
  };
}

describe('FootballTeamDetailComponent (SEO/meta regression)', () => {
  // Same bug class fixed in football-match-detail/football-competition-detail:
  // meta must never default to noindex before the real found/not-found
  // outcome is known.
  function setup(result: FootballTeamDetailDTO | null) {
    const setMetaTags = jasmine.createSpy('setMetaTags');
    TestBed.configureTestingModule({
      imports: [FootballTeamDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: 'real-madrid' })) } },
        { provide: FootballFacade, useValue: { getTeam: () => of(result), getCompetition: () => of(null) } },
        { provide: MetaService, useValue: { setMetaTags } },
      ],
    });
    const fixture = TestBed.createComponent(FootballTeamDetailComponent);
    fixture.detectChanges();
    return { setMetaTags, component: fixture.componentInstance };
  }

  it('a found team never ends up noindex', () => {
    const { setMetaTags } = setup(detail());
    const lastCall = setMetaTags.calls.mostRecent().args[0];
    expect(lastCall.robots).toBeUndefined();
    expect(lastCall.title).toContain('Real Madrid');
  });

  it('a genuinely missing team ends up noindex', () => {
    const { setMetaTags } = setup(null);
    const lastCall = setMetaTags.calls.mostRecent().args[0];
    expect(lastCall.robots).toBe('noindex, follow');
  });

  it('exposes loading()/detail() consistently with the resolved state', () => {
    const { component } = setup(detail());
    expect(component.loading()).toBeFalse();
    expect(component.detail()?.team.slug).toBe('real-madrid');
  });
});
