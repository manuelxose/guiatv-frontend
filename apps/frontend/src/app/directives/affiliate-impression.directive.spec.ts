import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AffiliateImpressionDirective } from './affiliate-impression.directive';
import { AffiliateService } from '../services/affiliate.service';
import { AffiliateContext, AffiliateResolvedOffer } from '../interfaces/affiliate.interface';

const OFFER: AffiliateResolvedOffer = {
  offerId: 'offer-1',
  merchant: { id: 'm1', slug: 'netflix', name: 'Netflix' },
  category: 'streaming',
  plan: { id: 'standard', name: 'Estándar' },
  display: { disclosure: '' },
  cta: { label: 'Ver oferta', sponsored: true },
  outbound: { path: '/v2/affiliate/go/offer-1' },
};

const CONTEXT: Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId'> = {
  market: 'ES',
  placement: 'where-to-watch',
};

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observe = jasmine.createSpy('observe');
  readonly disconnect = jasmine.createSpy('disconnect');

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

@Component({
  standalone: true,
  imports: [AffiliateImpressionDirective],
  template: `<div
    [appAffiliateImpression]="offer"
    [appAffiliateImpressionContext]="context"
    [appAffiliateImpressionPage]="page"
  ></div>`,
})
class HostComponent {
  offer: AffiliateResolvedOffer | null = OFFER;
  context = CONTEXT;
  page = '/pelicula/x';
}

describe('AffiliateImpressionDirective', () => {
  let trackImpressions: jasmine.Spy;
  let originalIntersectionObserver: typeof IntersectionObserver | undefined;

  beforeEach(() => {
    trackImpressions = jasmine.createSpy('trackImpressions');
    FakeIntersectionObserver.instances = [];
    originalIntersectionObserver = (window as any).IntersectionObserver;
    (window as any).IntersectionObserver = FakeIntersectionObserver;

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: AffiliateService, useValue: { trackImpressions } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  afterEach(() => {
    (window as any).IntersectionObserver = originalIntersectionObserver;
  });

  it('fires exactly one impression once the element becomes visible', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(trackImpressions).not.toHaveBeenCalled();

    FakeIntersectionObserver.instances[0].trigger(true);

    expect(trackImpressions).toHaveBeenCalledTimes(1);
    expect(trackImpressions).toHaveBeenCalledWith([
      {
        offerId: 'offer-1',
        placement: 'where-to-watch',
        market: 'ES',
        contentType: undefined,
        contentId: undefined,
        footballMatchId: undefined,
        competitionId: undefined,
        blogPostId: undefined,
        page: '/pelicula/x',
      },
    ]);
  });

  it('never fires twice, even if the observer reports intersection repeatedly', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger(true);
    observer.trigger(true);

    expect(trackImpressions).toHaveBeenCalledTimes(1);
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('disconnects and never fires while the element is not intersecting', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    FakeIntersectionObserver.instances[0].trigger(false);

    expect(trackImpressions).not.toHaveBeenCalled();
  });

  it('does nothing during SSR — no observer is created and nothing is tracked', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(FakeIntersectionObserver.instances.length).toBe(0);
    expect(trackImpressions).not.toHaveBeenCalled();
  });

  it('falls back to firing immediately when IntersectionObserver is unsupported', () => {
    delete (window as any).IntersectionObserver;

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(trackImpressions).toHaveBeenCalledTimes(1);
  });
});
