import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FootballMatchCardComponent } from './football-match-card.component';
import { AffiliateService } from '@app/services/affiliate.service';
import { AffiliateResolvedOffer } from '@app/interfaces/affiliate.interface';
import { FootballMatchDTO } from '@app/features/football/football.models';

function match(overrides: Partial<FootballMatchDTO> = {}): FootballMatchDTO {
  return {
    id: 'm1',
    slug: 'real-madrid-barcelona-2026',
    providerIds: {},
    competition: { id: 'c1', slug: 'laliga', name: 'LaLiga' },
    kickoffAt: '2026-08-21T19:00:00.000Z',
    status: 'scheduled',
    homeTeam: { id: 'h', slug: 'real-madrid', name: 'Real Madrid', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    awayTeam: { id: 'a', slug: 'barcelona', name: 'Barcelona', aliases: [], providerIds: {}, lastUpdatedAt: '' },
    score: { home: null, away: null },
    broadcasts: [],
    sourceProvenance: { source: 'test', confidence: 'high' },
    lastUpdatedAt: '',
    ...overrides,
  };
}

function offer(): AffiliateResolvedOffer {
  return {
    offerId: 'offer-1',
    merchant: { id: 'm1', slug: 'dazn', name: 'DAZN' },
    category: 'streaming',
    plan: { id: 'p1', name: 'Estándar' },
    display: { disclosure: 'Enlace afiliado' },
    cta: { label: 'Ver en DAZN', sponsored: true },
    outbound: { path: '/v2/affiliate/go/offer-1' },
  };
}

describe('FootballMatchCardComponent — affiliate CTA', () => {
  let resolveManySpy: jasmine.Spy;

  beforeEach(() => {
    resolveManySpy = jasmine.createSpy('resolveMany').and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [FootballMatchCardComponent],
      providers: [
        provideRouter([]),
        { provide: AffiliateService, useValue: { resolveMany: resolveManySpy, buildOutboundUrl: (o: AffiliateResolvedOffer) => o.outbound.path } },
      ],
    });
  });

  it('never calls the resolver when enableAffiliateCta is left at its default (false), even for a featured card', () => {
    const fixture = TestBed.createComponent(FootballMatchCardComponent);
    fixture.componentInstance.match = match({ broadcasts: [{ channelId: 'c', channelName: 'DAZN', availability: 'streaming', provenance: 'airing', confidence: 'high' }] });
    fixture.componentInstance.variant = 'featured';
    fixture.componentInstance.ngOnChanges({ match: {} as any });
    fixture.detectChanges();

    expect(resolveManySpy).not.toHaveBeenCalled();
  });

  it('resolves and renders a CTA when a caller opts in (the "featured" rail on football-home)', () => {
    resolveManySpy.and.returnValue(of([offer()]));
    const fixture = TestBed.createComponent(FootballMatchCardComponent);
    fixture.componentInstance.match = match({ broadcasts: [{ channelId: 'c', channelName: 'DAZN', availability: 'streaming', provenance: 'airing', confidence: 'high' }] });
    fixture.componentInstance.variant = 'featured';
    fixture.componentInstance.enableAffiliateCta = true;
    fixture.componentInstance.affiliatePlacement = 'football-home';
    fixture.componentInstance.ngOnChanges({ match: {} as any, enableAffiliateCta: {} as any });
    fixture.detectChanges();

    expect(resolveManySpy).toHaveBeenCalledTimes(1);
    const [context] = resolveManySpy.calls.mostRecent().args;
    expect(context.placement).toBe('football-home');
    expect(context.footballMatchId).toBe('m1');
    expect(context.competitionId).toBe('c1');
    expect(fixture.componentInstance.affiliateOffers().length).toBe(1);

    const ctaLink = fixture.nativeElement.querySelector('app-affiliate-cta a');
    expect(ctaLink).not.toBeNull();
  });

  it('never nests the affiliate CTA anchor inside the card\'s own detail-link anchor', () => {
    resolveManySpy.and.returnValue(of([offer()]));
    const fixture = TestBed.createComponent(FootballMatchCardComponent);
    fixture.componentInstance.match = match({ broadcasts: [{ channelId: 'c', channelName: 'DAZN', availability: 'streaming', provenance: 'airing', confidence: 'high' }] });
    fixture.componentInstance.variant = 'featured';
    fixture.componentInstance.enableAffiliateCta = true;
    fixture.componentInstance.ngOnChanges({ match: {} as any, enableAffiliateCta: {} as any });
    fixture.detectChanges();

    const cardAnchor = fixture.nativeElement.querySelector('a.card');
    expect(cardAnchor).not.toBeNull();
    expect(cardAnchor.querySelector('a')).toBeNull(); // no anchor nested inside the card's own <a>
  });

  it('a match with no confident broadcast never calls the resolver', () => {
    const fixture = TestBed.createComponent(FootballMatchCardComponent);
    fixture.componentInstance.match = match({ broadcasts: [] });
    fixture.componentInstance.enableAffiliateCta = true;
    fixture.componentInstance.ngOnChanges({ match: {} as any, enableAffiliateCta: {} as any });
    fixture.detectChanges();

    expect(resolveManySpy).not.toHaveBeenCalled();
  });
});
