import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { DiscoverViewComponent } from './discover-view.component';
import { TvDataFacade } from '../../../state/tv-data.facade';
import { UserService } from '../../../services/user.service';
import { EditorialService } from '../../../blog/services/editorial.service';
import { AffiliateService } from '../../../services/affiliate.service';
import { UnifiedProgramCardComponent } from '../../../components/unified-program-card/unified-program-card.component';
import { CatalogItem } from '../../../services/catalog.service';

function resultItem(catalogId: string): CatalogItem {
  return {
    catalogId,
    contentType: 'movie',
    title: `Resultado ${catalogId}`,
    genres: [],
    primaryPlatforms: ['netflix'],
  } as CatalogItem;
}

describe('DiscoverViewComponent — search-result affiliate CTA wiring', () => {
  beforeEach(() => {
    // featureItems() takes the first 4 items; 13 total leaves 9 in the "Resultados"
    // grid, so index 8 (the 9th result card) exercises the `i < 8` upper bound.
    const items = Array.from({ length: 13 }, (_, i) => resultItem(`movie-${i}`));

    TestBed.configureTestingModule({
      imports: [DiscoverViewComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: TvDataFacade,
          useValue: {
            discoverContent: () =>
              of({ items, meta: { total: items.length, page: 1, limit: 24, hasMore: false }, availablePlatforms: [], availableGenres: [] }),
            getLivePrograms: () => of([]),
            getTonightPrograms: () => of([]),
            getForYou: () => of([]),
          },
        },
        {
          provide: UserService,
          useValue: {
            isAuthenticated$: of(false),
            getWatchlist: () => of([]),
            toggleWatchlistItem: () => of(null),
          },
        },
        { provide: EditorialService, useValue: { getHubState: () => of({ guidePosts: [] }), getRankingsPageState: () => of({ posts: [] }) } },
        { provide: AffiliateService, useValue: { resolve: () => of(null), resolveMany: () => of({}), buildOutboundUrl: () => null } },
      ],
    });
  });

  it('enables the affiliate CTA with placement "search-result" only on the first 8 result cards', () => {
    const fixture = TestBed.createComponent(DiscoverViewComponent);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(
      (de) => de.componentInstance instanceof UnifiedProgramCardComponent
    );
    // Only the "Resultados" grid uses variant="discover"; feature/compact rails are untouched.
    const resultCards = cards.filter((de) => de.attributes['variant'] === 'discover');
    expect(resultCards.length).toBe(9);

    resultCards.forEach((card, i) => {
      const instance = card.componentInstance as UnifiedProgramCardComponent;
      expect(instance.enableAffiliateCta).toBe(i < 8, `card ${i} enableAffiliateCta`);
      expect(instance.affiliatePlacement).toBe('search-result');
    });
  });
});
