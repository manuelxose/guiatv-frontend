import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballBroadcastListComponent } from './football-broadcast-list.component';
import { AffiliateService } from '@app/services/affiliate.service';
import { AffiliateContext, AffiliateResolvedOffer } from '@app/interfaces/affiliate.interface';
import { FootballBroadcastDTO } from '@app/features/football/football.models';

function broadcast(overrides: Partial<FootballBroadcastDTO> = {}): FootballBroadcastDTO {
  return {
    channelId: 'ch-1',
    channelName: 'DAZN',
    availability: 'streaming',
    provenance: 'airing',
    confidence: 'high',
    ...overrides,
  };
}

function offer(overrides: Partial<AffiliateResolvedOffer> = {}): AffiliateResolvedOffer {
  return {
    offerId: 'offer-1',
    merchant: { id: 'm1', slug: 'dazn', name: 'DAZN' },
    category: 'streaming',
    plan: { id: 'p1', name: 'Estándar' },
    display: { disclosure: 'Enlace afiliado' },
    cta: { label: 'Ver en DAZN', sponsored: true },
    outbound: { path: '/v2/affiliate/go/offer-1?placement=football-match&market=ES' },
    ...overrides,
  };
}

describe('FootballBroadcastListComponent — affiliate CTA', () => {
  let resolveManySpy: jasmine.Spy;

  beforeEach(() => {
    resolveManySpy = jasmine.createSpy('resolveMany').and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [FootballBroadcastListComponent],
      providers: [
        provideRouter([]),
        { provide: AffiliateService, useValue: { resolveMany: resolveManySpy, buildOutboundUrl: (o: AffiliateResolvedOffer) => o.outbound.path } },
      ],
    });
  });

  function create(broadcasts: FootballBroadcastDTO[], enable = true) {
    const fixture = TestBed.createComponent(FootballBroadcastListComponent);
    fixture.componentInstance.broadcasts = broadcasts;
    fixture.componentInstance.enableAffiliateCta = enable;
    fixture.componentInstance.affiliatePlacement = 'football-match';
    fixture.componentInstance.footballMatchId = 'match-1';
    fixture.componentInstance.competitionId = 'laliga';
    fixture.componentInstance.ngOnChanges({ broadcasts: {} as any, enableAffiliateCta: {} as any });
    fixture.detectChanges();
    return fixture;
  }

  it('never calls the resolver when enableAffiliateCta is left at its default (false)', () => {
    const fixture = TestBed.createComponent(FootballBroadcastListComponent);
    fixture.componentInstance.broadcasts = [broadcast()];
    fixture.componentInstance.ngOnChanges({ broadcasts: {} as any });
    fixture.detectChanges();

    expect(resolveManySpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.affiliateOffers()).toEqual([]);
  });

  it('resolves a DAZN-only match to a single CTA scoped to the match/competition context', () => {
    resolveManySpy.and.returnValue(of([offer()]));
    const fixture = create([broadcast({ channelName: 'DAZN' })]);

    expect(resolveManySpy).toHaveBeenCalledTimes(1);
    const [context, options] = resolveManySpy.calls.mostRecent().args as [AffiliateContext, { providerKeys: string[] }];
    expect(context.placement).toBe('football-match');
    expect(context.footballMatchId).toBe('match-1');
    expect(context.competitionId).toBe('laliga');
    expect(options.providerKeys).toEqual(['DAZN']);
    expect(fixture.componentInstance.affiliateOffers().length).toBe(1);
  });

  it('resolves a Movistar Plus+-only match to a single CTA', () => {
    resolveManySpy.and.returnValue(of([offer({ merchant: { id: 'm2', slug: 'movistar-plus', name: 'Movistar Plus+' } })]));
    create([broadcast({ channelName: 'Movistar Plus+' })]);

    const [, options] = resolveManySpy.calls.mostRecent().args as [AffiliateContext, { providerKeys: string[] }];
    expect(options.providerKeys).toEqual(['Movistar Plus+']);
  });

  it('a match broadcast on both DAZN and Movistar Plus+ resolves two CTAs', () => {
    resolveManySpy.and.returnValue(
      of([
        offer({ offerId: 'o-dazn', merchant: { id: 'm1', slug: 'dazn', name: 'DAZN' } }),
        offer({ offerId: 'o-movistar', merchant: { id: 'm2', slug: 'movistar-plus', name: 'Movistar Plus+' } }),
      ])
    );
    const fixture = create([broadcast({ channelName: 'DAZN' }), broadcast({ channelId: 'ch-2', channelName: 'Movistar Plus+' })]);

    const [, options] = resolveManySpy.calls.mostRecent().args as [AffiliateContext, { providerKeys: string[] }];
    expect(options.providerKeys).toEqual(['DAZN', 'Movistar Plus+']);
    expect(fixture.componentInstance.affiliateOffers().length).toBe(2);
  });

  it('a free-to-air / unmapped match with no eligible offer renders no CTA (resolver returns empty)', () => {
    resolveManySpy.and.returnValue(of([]));
    const fixture = create([broadcast({ channelName: 'La 1', availability: 'tv' })]);

    expect(resolveManySpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.affiliateOffers()).toEqual([]);
  });

  it('a match with no broadcast mapping at all never calls the resolver', () => {
    const fixture = create([]);
    expect(resolveManySpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.affiliateOffers()).toEqual([]);
  });

  it('dedupes multiple channels for the same broadcaster into one provider key', () => {
    resolveManySpy.and.returnValue(of([offer()]));
    create([broadcast({ channelName: 'DAZN' }), broadcast({ channelId: 'ch-2', channelName: 'DAZN' })]);

    const [, options] = resolveManySpy.calls.mostRecent().args as [AffiliateContext, { providerKeys: string[] }];
    expect(options.providerKeys).toEqual(['DAZN']);
  });

  it('excludes low-confidence ("delayed broadcast information") broadcasts from the provider hints', () => {
    resolveManySpy.and.returnValue(of([offer()]));
    const fixture = create([
      broadcast({ channelName: 'DAZN', confidence: 'high' }),
      broadcast({ channelId: 'ch-3', channelName: 'Unconfirmed Channel', confidence: 'low' }),
    ]);

    const [, options] = resolveManySpy.calls.mostRecent().args as [AffiliateContext, { providerKeys: string[] }];
    expect(options.providerKeys).toEqual(['DAZN']);
    expect(fixture).toBeTruthy();
  });
});
