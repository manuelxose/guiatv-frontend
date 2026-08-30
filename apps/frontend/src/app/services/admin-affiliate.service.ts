import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Admin-only wire types for the Phase 9 Affiliate / Monetization admin
 * surface (`/v2/admin/affiliate/*`). Deliberately separate from
 * `interfaces/affiliate.interface.ts` (the public resolver contract) — these
 * carry fields (commission, attribution, verification, secret status) an
 * ordinary content surface never needs and must never receive.
 */

export type AdminMerchantCategory = 'streaming' | 'smart-tv' | 'device' | 'ticketing' | 'event' | 'retail' | 'vpn' | 'other' | string;
export type AdminMerchantStatus = 'active' | 'inactive' | 'pending';

export interface AdminAffiliateMerchant {
  id: string;
  slug: string;
  canonicalProviderKey: string;
  name: string;
  aliases: string[];
  logo?: string;
  category: AdminMerchantCategory;
  officialUrl: string;
  markets: string[];
  status: AdminMerchantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMerchantInput {
  name: string;
  canonicalProviderKey: string;
  aliases: string[];
  category: AdminMerchantCategory;
  logo?: string;
  officialUrl: string;
  markets: string[];
  status: AdminMerchantStatus;
}

export type AdminNetworkTrackingType = 'direct' | 'url_template' | 'redirect_endpoint' | 'tag_param' | 'api';
export type AdminNetworkStatus = 'active' | 'paused' | 'inactive';

export interface AdminAffiliateNetwork {
  id: string;
  slug: string;
  name: string;
  trackingType: AdminNetworkTrackingType;
  markets: string[];
  status: AdminNetworkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNetworkInput {
  name: string;
  trackingType: AdminNetworkTrackingType;
  markets: string[];
  status: AdminNetworkStatus;
}

export type AdminCommercialRelationship =
  | 'affiliate_configured'
  | 'direct_commercial_link'
  | 'no_affiliate_available'
  | 'unknown'
  | 'manual_agreement_required';
export type AdminProgramStatus = 'active' | 'inactive' | 'pending';
export type AdminProgramVerificationStatus = 'pending' | 'approved' | 'needs_review';
export type AdminSecretStatus = 'configured' | 'missing' | 'not_applicable';

export interface AdminAffiliateProgram {
  id: string;
  merchantId: string;
  networkId: string;
  market: string;
  externalProgramId?: string;
  relationship: AdminCommercialRelationship;
  status: AdminProgramStatus;
  allowedHosts: string[];
  disclosure: string;
  commission?: { type?: string; value?: number; currency?: string; notes?: string };
  attribution?: { cookieDays?: number; clickIdParam?: string };
  secretRefName?: string;
  secretStatus: AdminSecretStatus;
  verification: { source?: string; verifiedAt?: string; status: AdminProgramVerificationStatus };
  createdAt: string;
  updatedAt: string;
}

export interface AdminProgramInput {
  merchantId: string;
  networkId: string;
  market: string;
  externalProgramId?: string;
  relationship: AdminCommercialRelationship;
  status: AdminProgramStatus;
  allowedHosts: string[];
  disclosure: string;
  commission?: { type?: string; value?: number; currency?: string; notes?: string };
  attribution?: { cookieDays?: number; clickIdParam?: string; secretRef?: string };
  verification: { source?: string; verifiedAt?: string; status: AdminProgramVerificationStatus };
}

export type AdminOfferCategory = AdminMerchantCategory;
export type AdminOfferStatus = 'active' | 'inactive' | 'expired' | 'draft';
export type AdminOfferVerificationStatus = 'current' | 'stale' | 'needs_review';
export type AdminDeepLinkStrategy = 'direct_url' | 'url_template' | 'network_redirect' | 'tag_param' | 'api_generated';

export interface AdminAffiliateOffer {
  id: string;
  merchantId: string;
  affiliateProgramId: string;
  market: string;
  category: AdminOfferCategory;
  plan: { id: string; name: string };
  pricing: {
    currency: string;
    monthlyAmount: number | null;
    annualAmount: number | null;
    monthlyLabel: string;
    annualLabel: string;
    activationFeeAmount: number | null;
  };
  features: Record<string, unknown>;
  requirements: { commitmentMonths: number; fibreRequired: boolean; mobileRequired: boolean; device: string | null };
  trial: { days: number | null };
  recommendationIntents: string[];
  placements?: string[];
  destination: { strategy: AdminDeepLinkStrategy; url: string; template?: string; params?: Record<string, string> };
  validity: { validFrom?: string; validUntil?: string };
  status: AdminOfferStatus;
  verification: { source?: string; verifiedAt?: string; status: AdminOfferVerificationStatus };
  display: { bestFor?: string; highlight?: string; disclosure: string };
  expired: boolean;
  verificationDisplay: 'current' | 'stale' | 'needs_review';
  daysSinceVerified: number | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminOfferInput = Omit<
  AdminAffiliateOffer,
  'id' | 'expired' | 'verificationDisplay' | 'daysSinceVerified' | 'createdAt' | 'updatedAt'
>;

export interface AdminAffiliatePlacement {
  id: string;
  key: string;
  page: string;
  description?: string;
  enabled: boolean;
  legacyKeys?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminPlacementInput {
  key: string;
  page: string;
  description?: string;
  enabled: boolean;
  legacyKeys?: string[];
}

export interface AdminVerificationQueueItem {
  entityType: 'program' | 'offer';
  entityId: string;
  merchantId: string;
  merchantName: string;
  label: string;
  market: string;
  sourceUrl?: string;
  verifiedAt?: string;
  daysSinceVerified: number | null;
  displayStatus: 'current' | 'stale' | 'needs_review';
}

export interface AdminAnalyticsCount {
  key: string;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AdminAffiliateAnalyticsReport {
  range: { from: string; to: string };
  totals: { impressions: number; clicks: number; ctr: number };
  byMerchant: AdminAnalyticsCount[];
  byPlacement: AdminAnalyticsCount[];
  byOffer: AdminAnalyticsCount[];
  topContent: Array<{ contentType?: string; contentId: string; clicks: number; impressions: number }>;
  note: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminAffiliateService {
  private readonly baseUrl = `${environment.API_BASE_URL}/admin/affiliate`;

  constructor(private http: HttpClient) {}

  // Merchants -----------------------------------------------------------

  listMerchants(params: { status?: string; category?: string; market?: string; search?: string } = {}): Observable<AdminAffiliateMerchant[]> {
    return this.http
      .get<ApiResponse<{ merchants: AdminAffiliateMerchant[] }>>(`${this.baseUrl}/merchants`, {
        headers: this.buildHeaders(),
        params: this.buildParams(params),
      })
      .pipe(map((resp) => resp.data.merchants || []));
  }

  createMerchant(input: AdminMerchantInput): Observable<AdminAffiliateMerchant> {
    return this.http
      .post<ApiResponse<{ merchant: AdminAffiliateMerchant }>>(`${this.baseUrl}/merchants`, input, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.merchant));
  }

  updateMerchant(id: string, input: AdminMerchantInput): Observable<AdminAffiliateMerchant> {
    return this.http
      .put<ApiResponse<{ merchant: AdminAffiliateMerchant }>>(`${this.baseUrl}/merchants/${encodeURIComponent(id)}`, input, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data.merchant));
  }

  // Networks --------------------------------------------------------------

  listNetworks(): Observable<AdminAffiliateNetwork[]> {
    return this.http
      .get<ApiResponse<{ networks: AdminAffiliateNetwork[] }>>(`${this.baseUrl}/networks`, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.networks || []));
  }

  createNetwork(input: AdminNetworkInput): Observable<AdminAffiliateNetwork> {
    return this.http
      .post<ApiResponse<{ network: AdminAffiliateNetwork }>>(`${this.baseUrl}/networks`, input, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.network));
  }

  updateNetwork(id: string, input: AdminNetworkInput): Observable<AdminAffiliateNetwork> {
    return this.http
      .put<ApiResponse<{ network: AdminAffiliateNetwork }>>(`${this.baseUrl}/networks/${encodeURIComponent(id)}`, input, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data.network));
  }

  // Programs --------------------------------------------------------------

  listPrograms(params: { merchantId?: string; networkId?: string; market?: string; status?: string } = {}): Observable<AdminAffiliateProgram[]> {
    return this.http
      .get<ApiResponse<{ programs: AdminAffiliateProgram[] }>>(`${this.baseUrl}/programs`, {
        headers: this.buildHeaders(),
        params: this.buildParams(params),
      })
      .pipe(map((resp) => resp.data.programs || []));
  }

  createProgram(input: AdminProgramInput): Observable<AdminAffiliateProgram> {
    return this.http
      .post<ApiResponse<{ program: AdminAffiliateProgram }>>(`${this.baseUrl}/programs`, input, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.program));
  }

  updateProgram(id: string, input: AdminProgramInput): Observable<AdminAffiliateProgram> {
    return this.http
      .put<ApiResponse<{ program: AdminAffiliateProgram }>>(`${this.baseUrl}/programs/${encodeURIComponent(id)}`, input, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data.program));
  }

  // Offers ------------------------------------------------------------------

  listOffers(
    params: { merchantId?: string; affiliateProgramId?: string; market?: string; status?: string; category?: string } = {}
  ): Observable<{ offers: AdminAffiliateOffer[]; total: number }> {
    return this.http
      .get<ApiResponse<{ offers: AdminAffiliateOffer[]; total: number }>>(`${this.baseUrl}/offers`, {
        headers: this.buildHeaders(),
        params: this.buildParams(params),
      })
      .pipe(map((resp) => ({ offers: resp.data.offers || [], total: resp.data.total || 0 })));
  }

  createOffer(input: AdminOfferInput): Observable<AdminAffiliateOffer> {
    return this.http
      .post<ApiResponse<{ offer: AdminAffiliateOffer }>>(`${this.baseUrl}/offers`, input, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.offer));
  }

  updateOffer(id: string, input: AdminOfferInput): Observable<AdminAffiliateOffer> {
    return this.http
      .put<ApiResponse<{ offer: AdminAffiliateOffer }>>(`${this.baseUrl}/offers/${encodeURIComponent(id)}`, input, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data.offer));
  }

  deactivateOffer(id: string): Observable<AdminAffiliateOffer> {
    return this.http
      .post<ApiResponse<{ offer: AdminAffiliateOffer }>>(`${this.baseUrl}/offers/${encodeURIComponent(id)}/deactivate`, {}, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data.offer));
  }

  // Placements --------------------------------------------------------------

  listPlacements(): Observable<AdminAffiliatePlacement[]> {
    return this.http
      .get<ApiResponse<{ placements: AdminAffiliatePlacement[] }>>(`${this.baseUrl}/placements`, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.placements || []));
  }

  createPlacement(input: AdminPlacementInput): Observable<AdminAffiliatePlacement> {
    return this.http
      .post<ApiResponse<{ placement: AdminAffiliatePlacement }>>(`${this.baseUrl}/placements`, input, { headers: this.buildHeaders() })
      .pipe(map((resp) => resp.data.placement));
  }

  updatePlacement(id: string, input: Omit<AdminPlacementInput, 'key'>): Observable<AdminAffiliatePlacement> {
    return this.http
      .put<ApiResponse<{ placement: AdminAffiliatePlacement }>>(`${this.baseUrl}/placements/${encodeURIComponent(id)}`, input, {
        headers: this.buildHeaders(),
      })
      .pipe(map((resp) => resp.data.placement));
  }

  // Verification --------------------------------------------------------------

  getVerificationQueue(market?: string): Observable<AdminVerificationQueueItem[]> {
    return this.http
      .get<ApiResponse<{ items: AdminVerificationQueueItem[] }>>(`${this.baseUrl}/verification`, {
        headers: this.buildHeaders(),
        params: this.buildParams(market ? { market } : {}),
      })
      .pipe(map((resp) => resp.data.items || []));
  }

  // Analytics --------------------------------------------------------------

  getAnalyticsReport(params: { from?: string; to?: string } = {}): Observable<AdminAffiliateAnalyticsReport> {
    return this.http
      .get<ApiResponse<AdminAffiliateAnalyticsReport>>(`${this.baseUrl}/analytics`, {
        headers: this.buildHeaders(),
        params: this.buildParams(params),
      })
      .pipe(map((resp) => resp.data));
  }

  private buildParams(params: Record<string, string | undefined>): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    }
    return httpParams;
  }

  private buildHeaders(): HttpHeaders {
    // Authorization is attached globally by authRefreshInterceptor for every
    // outgoing request that has a session token — admin auth is Bearer-only.
    return new HttpHeaders();
  }
}
