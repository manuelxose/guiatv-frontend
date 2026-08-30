import { PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AffiliateService } from './affiliate.service';
import { AffiliateContext, AffiliateResolvedOffer } from '../interfaces/affiliate.interface';

const CONTEXT: AffiliateContext = { market: 'ES', placement: 'where-to-watch', contentType: 'movie', contentId: 'abc' };

const OFFER: AffiliateResolvedOffer = {
  offerId: 'offer-1',
  merchant: { id: 'm1', slug: 'netflix', name: 'Netflix' },
  category: 'streaming',
  plan: { id: 'standard', name: 'Estándar' },
  display: { disclosure: 'Enlace afiliado.' },
  cta: { label: 'Ver oferta', sponsored: true },
  outbound: { path: '/v2/affiliate/go/offer-1?placement=where-to-watch&market=ES' },
};

/** A minimal structural stub — avoids fighting HttpClient's overloaded `post` signature in tests. */
interface HttpClientPostStub {
  post(url: string, body?: unknown): Observable<unknown>;
}

function createService(
  http: HttpClientPostStub,
  platform: 'browser' | 'server' = 'browser'
): AffiliateService {
  TestBed.configureTestingModule({
    providers: [
      AffiliateService,
      { provide: HttpClient, useValue: http },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return TestBed.inject(AffiliateService);
}

describe('AffiliateService', () => {
  it('resolveMany posts the context and unwraps the envelope', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const service = createService({
      post: (url: string, body: unknown) => {
        calls.push({ url, body });
        return of({ success: true, data: { items: [OFFER], meta: { market: 'ES', placement: 'where-to-watch', total: 1, generatedAt: '' } } });
      },
    });

    const offers = await firstValueFrom(service.resolveMany(CONTEXT, { maxResults: 4 }));

    expect(offers).toEqual([OFFER]);
    expect(calls[0].url).toContain('/affiliate/resolve');
    expect((calls[0].body as any).context).toEqual(CONTEXT);
    expect((calls[0].body as any).maxResults).toBe(4);
  });

  it('resolveMany forwards category, pinnedOfferIds and autoResolve to the resolve request', async () => {
    const calls: Array<{ body: unknown }> = [];
    const service = createService({
      post: (_url: string, body: unknown) => {
        calls.push({ body });
        return of({ success: true, data: { items: [], meta: {} } });
      },
    });

    await firstValueFrom(
      service.resolveMany(CONTEXT, { category: 'smart-tv', pinnedOfferIds: ['offer-9'], autoResolve: false })
    );

    expect((calls[0].body as any).category).toBe('smart-tv');
    expect((calls[0].body as any).pinnedOfferIds).toEqual(['offer-9']);
    expect((calls[0].body as any).autoResolve).toBe(false);
  });

  it('resolve returns the first offer, requesting only one result', async () => {
    let requestedMax: number | undefined;
    const service = createService({
      post: (_url: string, body: any) => {
        requestedMax = body.maxResults;
        return of({ success: true, data: { items: [OFFER], meta: {} } });
      },
    });

    const offer = await firstValueFrom(service.resolve(CONTEXT));

    expect(offer).toEqual(OFFER);
    expect(requestedMax).toBe(1);
  });

  it('resolve resolves to null when nothing is returned', async () => {
    const service = createService({
      post: () => of({ success: true, data: { items: [], meta: {} } }),
    });

    const offer = await firstValueFrom(service.resolve(CONTEXT));

    expect(offer).toBeNull();
  });

  it('never throws — resolveMany degrades to an empty list on a backend failure', async () => {
    const service = createService({
      post: () => throwError(() => new Error('boom')),
    });

    const offers = await firstValueFrom(service.resolveMany(CONTEXT));

    expect(offers).toEqual([]);
  });

  it('caches identical contexts instead of issuing a second request', async () => {
    let callCount = 0;
    const service = createService({
      post: () => {
        callCount += 1;
        return of({ success: true, data: { items: [OFFER], meta: {} } });
      },
    });

    await firstValueFrom(service.resolveMany(CONTEXT));
    await firstValueFrom(service.resolveMany(CONTEXT));

    expect(callCount).toBe(1);
  });

  it('buildOutboundUrl leaves a relative outbound path untouched', () => {
    const service = createService({ post: () => of() });

    expect(service.buildOutboundUrl(OFFER)).toBe(OFFER.outbound.path);
  });

  it('buildOutboundUrl never appends or edits query parameters', () => {
    const service = createService({ post: () => of() });

    const url = service.buildOutboundUrl(OFFER);

    expect(url).toBe(OFFER.outbound.path);
    expect(url.match(/\?/g)?.length ?? 0).toBe(1);
  });

  it('trackImpressions is a no-op during SSR', () => {
    let posted = false;
    const service = createService(
      { post: () => { posted = true; return of(undefined); } },
      'server'
    );
    const beaconSpy = spyOn(navigator, 'sendBeacon').and.returnValue(true);

    service.trackImpressions([{ offerId: 'offer-1', placement: 'where-to-watch', market: 'ES' }]);

    expect(posted).toBeFalse();
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it('trackImpressions fires exactly once for the same offer+placement pair even when called twice', () => {
    const service = createService({ post: () => of(undefined) }, 'browser');
    const beaconSpy = spyOn(navigator, 'sendBeacon').and.returnValue(true);

    const impression = { offerId: 'offer-1', placement: 'where-to-watch', market: 'ES' };
    service.trackImpressions([impression]);
    service.trackImpressions([impression]);

    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });
});
