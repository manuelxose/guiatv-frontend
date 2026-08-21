import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballNewsComponent } from './football-news.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballNewsDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';

function article(slug: string, contentType: FootballNewsDTO['contentType']): FootballNewsDTO {
  return {
    id: slug,
    slug,
    title: slug,
    contentType,
    publishedAt: '2026-08-21T10:00:00.000Z',
    sportsRelations: { teamIds: [], competitionIds: [], matchIds: [] },
  };
}

describe('FootballNewsComponent', () => {
  function setup(news: FootballNewsDTO[]) {
    TestBed.configureTestingModule({
      imports: [FootballNewsComponent],
      providers: [
        provideRouter([]),
        { provide: FootballFacade, useValue: { getNews: () => of(news) } },
        { provide: MetaService, useValue: { setMetaTags: () => {} } },
      ],
    });
    const fixture = TestBed.createComponent(FootballNewsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('does not show a type filter when only one content type exists', () => {
    const component = setup([article('a', 'guide'), article('b', 'guide')]);
    expect(component.showTypeFilter()).toBeFalse();
  });

  it('shows a type filter when 2+ distinct content types are present', () => {
    const component = setup([article('a', 'guide'), article('b', 'ranking')]);
    expect(component.showTypeFilter()).toBeTrue();
    expect(component.availableTypes().sort()).toEqual(['guide', 'ranking']);
  });

  it('does not show a type filter for an empty list — no fake taxonomy tabs', () => {
    const component = setup([]);
    expect(component.showTypeFilter()).toBeFalse();
  });

  it('filters the visible list by the selected type', () => {
    const component = setup([article('a', 'guide'), article('b', 'ranking'), article('c', 'guide')]);
    component.selectType('guide');
    expect(component.filteredNews().map((n) => n.slug)).toEqual(['a', 'c']);
  });

  it('"all" shows the full unfiltered list', () => {
    const component = setup([article('a', 'guide'), article('b', 'ranking')]);
    component.selectType('guide');
    component.selectType('all');
    expect(component.filteredNews().length).toBe(2);
  });
});
