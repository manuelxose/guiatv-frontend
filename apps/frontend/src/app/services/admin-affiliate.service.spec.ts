import { PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';
import { AdminAffiliateService, AdminAffiliateProgram } from './admin-affiliate.service';

/** Structural stub mirroring the pattern already used by affiliate.service.spec.ts. */
interface HttpClientStub {
  get(url: string, options?: unknown): Observable<unknown>;
  post(url: string, body?: unknown, options?: unknown): Observable<unknown>;
  put(url: string, body?: unknown, options?: unknown): Observable<unknown>;
}

function createService(http: HttpClientStub): AdminAffiliateService {
  TestBed.configureTestingModule({
    providers: [AdminAffiliateService, { provide: HttpClient, useValue: http }, { provide: PLATFORM_ID, useValue: 'browser' }],
  });
  return TestBed.inject(AdminAffiliateService);
}

const PROGRAM: AdminAffiliateProgram = {
  id: 'program-1',
  merchantId: 'merchant-1',
  networkId: 'network-1',
  market: 'ES',
  relationship: 'affiliate_configured',
  status: 'active',
  allowedHosts: ['tienda.example.com'],
  disclosure: 'Enlace de afiliado',
  secretRefName: 'AWIN_TOKEN',
  secretStatus: 'configured',
  verification: { status: 'approved' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminAffiliateService', () => {
  it('listMerchants calls /admin/affiliate/merchants and unwraps the envelope', async () => {
    const calls: Array<{ url: string }> = [];
    const service = createService({
      get: (url: string) => {
        calls.push({ url });
        return of({ success: true, data: { merchants: [] } });
      },
      post: () => of({}),
      put: () => of({}),
    });

    const merchants = await firstValueFrom(service.listMerchants({ search: 'movistar' }));

    expect(merchants).toEqual([]);
    expect(calls[0].url).toContain('/admin/affiliate/merchants');
  });

  it('createMerchant posts to /admin/affiliate/merchants and returns the created merchant', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const service = createService({
      get: () => of({}),
      post: (url: string, body: unknown) => {
        calls.push({ url, body });
        return of({ success: true, data: { merchant: { id: 'm1', name: 'Netflix' } } });
      },
      put: () => of({}),
    });

    const input = {
      name: 'Netflix',
      canonicalProviderKey: 'netflix',
      aliases: ['netflix'],
      category: 'streaming' as const,
      officialUrl: 'https://www.netflix.com',
      markets: ['ES'],
      status: 'active' as const,
    };
    const merchant = await firstValueFrom(service.createMerchant(input));

    expect(merchant).toEqual({ id: 'm1', name: 'Netflix' } as never);
    expect(calls[0].url).toContain('/admin/affiliate/merchants');
    expect(calls[0].body).toEqual(input);
  });

  it('a program response never carries anything beyond the derived secretStatus/secretRefName', async () => {
    const service = createService({
      get: () => of({ success: true, data: { programs: [PROGRAM] } }),
      post: () => of({}),
      put: () => of({}),
    });

    const programs = await firstValueFrom(service.listPrograms());

    expect(programs[0].secretStatus).toBe('configured');
    expect(programs[0].secretRefName).toBe('AWIN_TOKEN');
    expect(JSON.stringify(programs[0])).not.toContain('secretValue');
  });

  it('deactivateOffer posts to the offer-scoped deactivate endpoint', async () => {
    const calls: Array<{ url: string }> = [];
    const service = createService({
      get: () => of({}),
      post: (url: string) => {
        calls.push({ url });
        return of({ success: true, data: { offer: { id: 'offer-1', status: 'inactive' } } });
      },
      put: () => of({}),
    });

    await firstValueFrom(service.deactivateOffer('offer-1'));

    expect(calls[0].url).toContain('/admin/affiliate/offers/offer-1/deactivate');
  });
});
