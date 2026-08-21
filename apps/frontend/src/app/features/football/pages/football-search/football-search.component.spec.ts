import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballSearchComponent } from './football-search.component';
import { FootballFacade } from '@app/features/football/football.facade';
import { FootballSearchDTO } from '@app/features/football/football.models';
import { MetaService } from '@app/services/meta.service';

function result(overrides: Partial<FootballSearchDTO> = {}): FootballSearchDTO {
  return { query: 'real', matches: [], teams: [], competitions: [], news: [], meta: {}, ...overrides };
}

describe('FootballSearchComponent', () => {
  function setup(searchResult: FootballSearchDTO, queryParams: Record<string, string> = { q: 'real' }) {
    const search = jasmine.createSpy('search').and.returnValue(of(searchResult));
    TestBed.configureTestingModule({
      imports: [FootballSearchComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(queryParams)) } },
        { provide: FootballFacade, useValue: { search } },
        { provide: MetaService, useValue: { setMetaTags: () => {} } },
      ],
    });
    const fixture = TestBed.createComponent(FootballSearchComponent);
    fixture.detectChanges();
    return { search, component: fixture.componentInstance };
  }

  it('calls FootballFacade.search() with the `q` query param', () => {
    const { search } = setup(result());
    expect(search).toHaveBeenCalledWith('real');
  });

  it('never calls search() when there is no query — no empty-string request', () => {
    const { search } = setup(result({ query: '' }), {});
    expect(search).not.toHaveBeenCalled();
  });

  it('hasResults is true when any group has content', () => {
    const { component } = setup(result({ teams: [{ id: 't1', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' }] }));
    expect(component.hasResults()).toBeTrue();
  });

  it('hasResults is false when every group is empty', () => {
    const { component } = setup(result());
    expect(component.hasResults()).toBeFalse();
  });

  it('groups results by entity type via distinct computed signals', () => {
    const { component } = setup(
      result({
        teams: [{ id: 't1', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' }],
        competitions: [{ id: 'c1', slug: 'laliga', name: 'LaLiga', type: 'league', providerIds: {}, lastUpdatedAt: '' }],
      })
    );
    expect(component.teams().length).toBe(1);
    expect(component.competitions().length).toBe(1);
    expect(component.matches().length).toBe(0);
    expect(component.news().length).toBe(0);
  });
});
