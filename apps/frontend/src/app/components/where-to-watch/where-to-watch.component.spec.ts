import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StreamingProvidersService } from '../../services/streaming-providers.service';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateResolvedOffer } from '../../interfaces/affiliate.interface';
import { WhereToWatchComponent } from './where-to-watch.component';

function buildOffer(overrides: Partial<AffiliateResolvedOffer> = {}): AffiliateResolvedOffer {
  return {
    offerId: 'offer-1',
    merchant: { id: 'm-1', slug: 'prime-video', name: 'Prime Video' },
    category: 'streaming',
    plan: { id: 'plan-1', name: 'Estándar' },
    display: { disclosure: 'Enlace afiliado' },
    cta: { label: 'Ver oferta', sponsored: true },
    outbound: { path: '/v2/affiliate/go/offer-1?placement=where-to-watch&market=ES' },
    ...overrides,
  };
}

describe('WhereToWatchComponent', () => {
  let resolveManySpy: jasmine.Spy;

  beforeEach(() => {
    resolveManySpy = jasmine.createSpy('resolveMany').and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [WhereToWatchComponent],
      providers: [
        {
          provide: StreamingProvidersService,
          useValue: {
            getProviders: () => of({}),
            getProvidersByTmdb: () => of({}),
            getLocalLogoPath: (name: string) => `/logos/${name}.svg`,
          },
        },
        {
          provide: AffiliateService,
          useValue: {
            resolveMany: resolveManySpy,
            buildOutboundUrl: (offer: AffiliateResolvedOffer) => `https://guiaprogramaciontv.com${offer.outbound.path}`,
          },
        },
      ],
    });
  });

  it('reacts when providersData changes and deduplicates rent and buy', () => {
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.providersData = {
      rent: [{ id: 1, name: 'Prime Video', type: 'rent' }],
      buy: [{ id: 2, name: 'prime video', type: 'buy' }],
    };

    component.ngOnChanges({ providersData: {} as any });

    expect(component.providers).toBe(component.providersData);
    expect(component.paidProviders(component.providers!)).toHaveSize(1);
  });

  it('uses known primary platforms when detailed provider groups are absent', () => {
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.primaryPlatforms = ['Netflix', 'Netflix', 'Max'];

    component.ngOnChanges({ primaryPlatforms: {} as any });

    expect(component.providers?.flatrate?.map((provider) => provider.name)).toEqual(['Netflix', 'Max']);
  });

  it('resolves affiliate offers for every distinct provider name in a single batched call', () => {
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.providersData = {
      flatrate: [{ id: 1, name: 'Prime Video', type: 'flatrate' }],
      rent: [{ id: 2, name: 'Movistar Plus', type: 'rent' }],
    };
    component.placement = 'catalog-detail';
    component.catalogId = 'movie-42';

    component.ngOnChanges({ providersData: {} as any });

    expect(resolveManySpy).toHaveBeenCalledTimes(1);
    const [context, options] = resolveManySpy.calls.mostRecent().args;
    expect(context.placement).toBe('catalog-detail');
    expect(context.contentId).toBe('movie-42');
    expect(options.providerKeys).toEqual(['Prime Video', 'Movistar Plus']);
  });

  it('upgrades a chip to the affiliate outbound link only for a verified merchant match, leaving unmatched providers untouched', () => {
    resolveManySpy.and.returnValue(of([buildOffer()]));
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.providersData = {
      flatrate: [
        { id: 1, name: 'Prime Video', type: 'flatrate', deepLink: 'https://primevideo.com/x' },
        { id: 2, name: 'Non Affiliate TV', type: 'flatrate', deepLink: 'https://non-affiliate.example/x' },
      ],
    };

    component.ngOnChanges({ providersData: {} as any });

    const primeVideo = component.providers!.flatrate![0];
    const nonAffiliate = component.providers!.flatrate![1];
    expect(component.resolveHref(primeVideo)).toBe('https://guiaprogramaciontv.com/v2/affiliate/go/offer-1?placement=where-to-watch&market=ES');
    expect(component.resolveRel(primeVideo)).toBe('sponsored noopener noreferrer');
    expect(component.resolveHref(nonAffiliate)).toBe('https://non-affiliate.example/x');
    expect(component.resolveRel(nonAffiliate)).toBe('noopener');
    expect(component.showSponsoredDisclosure).toBeTrue();
  });

  it('never calls the affiliate resolver when there are no providers to show', () => {
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.providersData = {};

    component.ngOnChanges({ providersData: {} as any });

    expect(resolveManySpy).not.toHaveBeenCalled();
  });
});
