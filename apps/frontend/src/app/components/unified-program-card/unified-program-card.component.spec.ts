import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateResolvedOffer } from '../../interfaces/affiliate.interface';
import { CatalogItem } from '../../services/catalog.service';
import { UnifiedProgramCardComponent, optimizeCardImageUrl } from './unified-program-card.component';

describe('optimizeCardImageUrl', () => {
  it('uses a card-sized TMDB variant instead of the original asset', () => {
    expect(
      optimizeCardImageUrl('https://image.tmdb.org/t/p/original/example.jpg')
    ).toBe('https://image.tmdb.org/t/p/w780/example.jpg');
  });

  it('preserves non-TMDB sources', () => {
    const source = 'https://www.movistarplus.es/recorte/n/dispficha/example';
    expect(optimizeCardImageUrl(source)).toBe(source);
  });
});

function buildOffer(): AffiliateResolvedOffer {
  return {
    offerId: 'offer-9',
    merchant: { id: 'm-9', slug: 'prime-video', name: 'Prime Video' },
    category: 'streaming',
    plan: { id: 'plan-9', name: 'Estándar' },
    display: { disclosure: 'Enlace afiliado' },
    cta: { label: 'Ver oferta', sponsored: true },
    outbound: { path: '/v2/affiliate/go/offer-9?placement=home&market=ES' },
  };
}

const testItem: CatalogItem = {
  catalogId: 'movie-tmdb-42',
  contentType: 'movie',
  title: 'Test Movie',
} as CatalogItem;

describe('UnifiedProgramCardComponent — affiliate opt-in', () => {
  let resolveSpy: jasmine.Spy;

  beforeEach(() => {
    resolveSpy = jasmine.createSpy('resolve').and.returnValue(of(null));
    TestBed.configureTestingModule({
      imports: [UnifiedProgramCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: UserService,
          useValue: {
            isAuthenticated$: of(false),
            getWatchlist: () => of([]),
            toggleWatchlistItem: () => of(null),
          },
        },
        { provide: AffiliateService, useValue: { resolve: resolveSpy, buildOutboundUrl: (o: AffiliateResolvedOffer) => o.outbound.path } },
      ],
    });
  });

  it('never calls the affiliate resolver when enableAffiliateCta is left at its default (false)', () => {
    const fixture = TestBed.createComponent(UnifiedProgramCardComponent);
    fixture.componentInstance.item = testItem;
    fixture.componentInstance.ngOnChanges({ item: {} as any });
    fixture.detectChanges();

    expect(resolveSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.affiliateOffer()).toBeNull();
  });

  it('resolves a single offer scoped to this card\'s content when a caller opts in', () => {
    resolveSpy.and.returnValue(of(buildOffer()));
    const fixture = TestBed.createComponent(UnifiedProgramCardComponent);
    fixture.componentInstance.item = testItem;
    fixture.componentInstance.enableAffiliateCta = true;
    fixture.componentInstance.affiliatePlacement = 'home';
    fixture.componentInstance.ngOnChanges({ item: {} as any, enableAffiliateCta: {} as any });
    fixture.detectChanges();

    expect(resolveSpy).toHaveBeenCalledTimes(1);
    const [context] = resolveSpy.calls.mostRecent().args;
    expect(context.placement).toBe('home');
    expect(context.contentType).toBe('movie');
    expect(context.contentId).toBe('movie-tmdb-42');
    expect(fixture.componentInstance.affiliateOffer()?.offerId).toBe('offer-9');
  });
});
