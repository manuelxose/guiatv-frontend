import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { MonetizationOffersResponse, MonetizationService } from './monetization.service';

describe('MonetizationService', () => {
  function createService(http: Pick<HttpClient, 'get'>): MonetizationService {
    TestBed.configureTestingModule({
      providers: [
        MonetizationService,
        { provide: HttpClient, useValue: http },
      ],
    });
    return TestBed.inject(MonetizationService);
  }

  it('loads normalized offers with bounded query parameters', async () => {
    const calls: Array<{ url: string; options: { params: HttpParams } }> = [];
    const response = { items: [{ id: 'prime-video-prime' }], meta: { market: 'ES', total: 1 }, filters: {} };
    const service = createService({
      get: (url: string, options: { params: HttpParams }) => {
        calls.push({ url, options });
        return of({ success: true, data: response });
      },
    } as Pick<HttpClient, 'get'>);

    const result = await firstValueFrom(service.getOffers({
      intent: 'movies', features: ['downloads', '4k'], maxMonthlyPrice: 12, sort: 'price-asc',
    }));

    expect(result).toEqual(response as unknown as MonetizationOffersResponse);
    expect(calls[0].url).toContain('/monetization/offers');
    expect(calls[0].options.params.get('intent')).toBe('movies');
    expect(calls[0].options.params.get('features')).toBe('downloads,4k');
    expect(calls[0].options.params.get('maxMonthlyPrice')).toBe('12');
  });

  it('builds an encoded internal outbound URL instead of exposing provider destinations', () => {
    const service = createService({ get: () => of() } as Pick<HttpClient, 'get'>);

    const url = service.buildOutboundUrl(
      '/v2/monetization/go/netflix/netflix-standard-with-ads',
      'comparison-table'
    );

    expect(url).toContain('/v2/monetization/go/netflix/netflix-standard-with-ads');
    expect(url).toContain('placement=comparison-table');
    expect(url).not.toContain('netflix.com');
  });

  it('propagates offer API failures for a visible retry state', async () => {
    const service = createService({
      get: () => throwError(() => new Error('Offers unavailable')),
    } as Pick<HttpClient, 'get'>);

    await expectAsync(firstValueFrom(service.getOffers())).toBeRejectedWithError('Offers unavailable');
  });
});
