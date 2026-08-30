import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CanalCompletoComponent } from './canal-completo.component';
import { TvDataService } from '../../state/tv-data.service';
import { MetaService } from '../../services/meta.service';
import { ApiConfigService } from '../../api/api-config.service';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateResolvedOffer } from '../../interfaces/affiliate.interface';
import { TvChannelSurfaceDTO } from '../../api/models';

function buildOffer(): AffiliateResolvedOffer {
  return {
    offerId: 'offer-channel-1',
    merchant: { id: 'm-1', slug: 'movistar-plus', name: 'Movistar Plus+' },
    category: 'streaming',
    plan: { id: 'plan-1', name: 'Estándar' },
    display: { disclosure: 'Enlace afiliado' },
    cta: { label: 'Ver oferta', sponsored: true },
    outbound: { path: '/v2/affiliate/go/offer-channel-1?placement=channel-page&market=ES' },
  };
}

function buildSurface(overrides: Partial<TvChannelSurfaceDTO['channel']> = {}): TvChannelSurfaceDTO {
  return {
    channel: {
      id: 'movistar-cine',
      name: 'Movistar Cine',
      access: 'pay',
      distribution: 'operator',
      operator: 'Movistar Plus+',
      providers: ['Movistar Plus+'],
      ...overrides,
    },
    scheduleItems: [],
  } as unknown as TvChannelSurfaceDTO;
}

describe('CanalCompletoComponent — channel-page affiliate CTA', () => {
  let resolveManySpy: jasmine.Spy;

  function configure(surface: TvChannelSurfaceDTO) {
    resolveManySpy = jasmine.createSpy('resolveMany').and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [CanalCompletoComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: surface.channel!.id })) },
        },
        { provide: TvDataService, useValue: { loadChannelSurface: () => of(surface) } },
        { provide: MetaService, useValue: { setMetaTags: () => undefined } },
        { provide: ApiConfigService, useValue: { getAssetBaseUrl: () => '' } },
        { provide: AffiliateService, useValue: { resolveMany: resolveManySpy, buildOutboundUrl: (o: AffiliateResolvedOffer) => o.outbound.path } },
      ],
    });
  }

  it('resolves a channel-page offer from the channel\'s canonical provider labels, never the raw channel name', () => {
    const surface = buildSurface();
    configure(surface);

    const fixture = TestBed.createComponent(CanalCompletoComponent);
    fixture.detectChanges();

    expect(resolveManySpy).toHaveBeenCalledTimes(1);
    const [context, options] = resolveManySpy.calls.mostRecent().args;
    expect(context.placement).toBe('channel-page');
    expect(context.channelId).toBe('movistar-cine');
    expect(options.providerKeys).toEqual(['Movistar Plus+']);
  });

  it('renders nothing when the resolver finds no verified merchant for this channel', () => {
    configure(buildSurface());
    const fixture = TestBed.createComponent(CanalCompletoComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.channelAffiliateOffers).toEqual([]);
  });

  it('exposes the resolved offer(s) and sponsored disclosure state for a channel with a verified affiliate relationship', () => {
    configure(buildSurface());
    resolveManySpy.and.returnValue(of([buildOffer()]));
    const fixture = TestBed.createComponent(CanalCompletoComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.channelAffiliateOffers.length).toBe(1);
    expect(fixture.componentInstance.showChannelSponsoredDisclosure).toBeTrue();
  });

  it('skips the affiliate lookup entirely for a channel with no provider/operator labels', () => {
    configure(buildSurface({ providers: [], operator: undefined }));
    const fixture = TestBed.createComponent(CanalCompletoComponent);
    fixture.detectChanges();

    expect(resolveManySpy).not.toHaveBeenCalled();
  });
});
