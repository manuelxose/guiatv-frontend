import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballNewsDetailComponent } from './football-news-detail.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballNewsDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';

function article(overrides: Partial<FootballNewsDTO> = {}): FootballNewsDTO {
  return {
    id: 'n1',
    slug: 'real-madrid-gana-la-liga',
    title: 'Real Madrid gana LaLiga',
    contentType: 'match-report',
    publishedAt: '2026-08-21T10:00:00.000Z',
    sportsRelations: { teamIds: [], competitionIds: [], matchIds: [] },
    content: '<p>Resumen del partido.</p>',
    ...overrides,
  };
}

describe('FootballNewsDetailComponent (SEO/meta regression + facade usage)', () => {
  // Regression coverage for a real bug: this page used to bypass the
  // football facade entirely (fetching BlogService.getAllPosts() — the
  // ENTIRE blog collection — and filtering by slug client-side) and had
  // the same noindex-before-resolution SEO bug fixed elsewhere. Both are
  // fixed by routing through facade.getNewsItem() with the same
  // discriminated-state pattern as match/competition/team detail.
  function setup(result: FootballNewsDTO | null) {
    const setMetaTags = jasmine.createSpy('setMetaTags');
    const getNewsItem = jasmine.createSpy('getNewsItem').and.returnValue(of(result));
    TestBed.configureTestingModule({
      imports: [FootballNewsDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: 'real-madrid-gana-la-liga' })) } },
        { provide: FootballFacade, useValue: { getNewsItem } },
        { provide: MetaService, useValue: { setMetaTags } },
      ],
    });
    const fixture = TestBed.createComponent(FootballNewsDetailComponent);
    fixture.detectChanges();
    return { setMetaTags, getNewsItem, component: fixture.componentInstance };
  }

  it('resolves the article through FootballFacade.getNewsItem(), not BlogService', () => {
    const { getNewsItem } = setup(article());
    expect(getNewsItem).toHaveBeenCalledWith('real-madrid-gana-la-liga');
  });

  it('a found article never ends up noindex', () => {
    const { setMetaTags } = setup(article());
    const lastCall = setMetaTags.calls.mostRecent().args[0];
    expect(lastCall.robots).toBeUndefined();
    expect(lastCall.title).toContain('Real Madrid gana LaLiga');
  });

  it('a genuinely missing article ends up noindex', () => {
    const { setMetaTags } = setup(null);
    const lastCall = setMetaTags.calls.mostRecent().args[0];
    expect(lastCall.robots).toBe('noindex, follow');
  });

  it('sanitizes and exposes the body only when content is present', () => {
    const { component } = setup(article());
    expect(component.body()).toBeTruthy();
  });

  it('exposes no body when the article has no content', () => {
    const { component } = setup(article({ content: undefined }));
    expect(component.body()).toBeNull();
  });
});
