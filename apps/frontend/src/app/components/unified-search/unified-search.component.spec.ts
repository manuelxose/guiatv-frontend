import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogItem, CatalogResponse } from '../../services/catalog.service';
import { DiscoveryService } from '../../services/discovery.service';
import { StorageService } from '../../services/storage.service';
import { UnifiedSearchComponent } from './unified-search.component';
import { FootballFacade } from '../../features/football/football.facade';
import { FootballSearchDTO } from '../../features/football/football.models';

const item = (
  catalogId: string,
  contentType: CatalogItem['contentType'],
  title: string,
  detailPath: string
): CatalogItem => ({
  catalogId,
  source: contentType === 'program' ? 'program' : 'tmdb',
  contentType,
  title,
  detailPath,
  genres: [],
  primaryPlatforms: [],
});

describe('UnifiedSearchComponent', () => {
  let fixture: ComponentFixture<UnifiedSearchComponent>;
  let component: UnifiedSearchComponent;
  let discovery: jasmine.SpyObj<DiscoveryService>;
  let football: jasmine.SpyObj<FootballFacade>;
  let router: Router;

  beforeEach(async () => {
    const response: CatalogResponse = {
      items: [
        item('movie:1', 'movie', 'Dune', '/peliculas/dune'),
        item('program:1', 'program', 'Noticias', '/contenido/program:1'),
        item('series:1', 'series', 'Dune: La profecía', '/series/dune-la-profecia'),
      ],
      meta: { page: 1, limit: 5, total: 3, hasMore: false },
      availableGenres: [],
      availablePlatforms: [],
    };
    discovery = jasmine.createSpyObj('DiscoveryService', ['search']);
    discovery.search.and.returnValue(of(response));
    football = jasmine.createSpyObj('FootballFacade', ['search']);
    football.search.and.returnValue(of({ query: '', matches: [], teams: [], competitions: [], news: [], meta: {} }));

    await TestBed.configureTestingModule({
      imports: [UnifiedSearchComponent],
      providers: [
        provideRouter([]),
        { provide: DiscoveryService, useValue: discovery },
        { provide: FootballFacade, useValue: football },
        {
          provide: StorageService,
          useValue: {
            readJson: () => [],
            writeJson: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnifiedSearchComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('groups real cross-domain suggestions and preserves grouped keyboard order', fakeAsync(() => {
    component.query = 'dune';
    component.onFocus();
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('.search-shell__group-heading') as NodeListOf<HTMLElement>
    ).map((element) => element.textContent?.trim());

    expect(discovery.search).toHaveBeenCalledWith({ q: 'dune', limit: 5 });
    expect(headings).toEqual(['Programas', 'Películas y series']);
    expect(component.suggestions.map((entry) => entry.title)).toEqual([
      'Noticias',
      'Dune',
      'Dune: La profecía',
    ]);
  }));

  it('includes football entities in the same grouped search menu', fakeAsync(() => {
    const footballResult: FootballSearchDTO = {
      query: 'real',
      matches: [],
      teams: [{ id: 't1', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' }],
      competitions: [{ id: 'c1', slug: 'laliga', name: 'LaLiga', country: 'Spain', type: 'league', providerIds: {}, lastUpdatedAt: '' }],
      news: [],
      meta: {},
    };
    football.search.and.returnValue(of(footballResult));
    component.query = 'real';
    component.onFocus();
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('.search-shell__group-heading') as NodeListOf<HTMLElement>
    ).map((element) => element.textContent?.trim());
    expect(headings).toContain('Fútbol');
    expect(component.suggestions.map((entry) => entry.title)).toContain('Real Madrid');
    expect(component.suggestions.map((entry) => entry.title)).toContain('LaLiga');
  }));

  it('keeps football results available when catalogue search fails', fakeAsync(() => {
    discovery.search.and.returnValue(throwError(() => new Error('catalog unavailable')));
    football.search.and.returnValue(of({
      query: 'laliga',
      matches: [],
      teams: [],
      competitions: [{ id: 'c1', slug: 'laliga', name: 'LaLiga', country: 'Spain', type: 'league', providerIds: {}, lastUpdatedAt: '' }],
      news: [],
      meta: {},
    }));
    component.query = 'laliga';
    component.onFocus();
    fixture.detectChanges();
    tick(300);

    expect(component.suggestions.map((entry) => entry.title)).toEqual(['LaLiga']);
  }));

  it('opens the canonical detail path for the selected result', async () => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const result = {
      id: 'program:1',
      title: 'Noticias',
      meta: 'Programa',
      detailPath: '/contenido/program:1',
      group: 'program' as const,
    };

    component.openSuggestion(result);

    expect(navigate).toHaveBeenCalledWith('/contenido/program:1');
  });
});
