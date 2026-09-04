import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type CommercialRelationship = 'affiliate_configured' | 'direct_commercial_link' | 'no_affiliate_available' | 'unknown' | 'manual_agreement_required';
export type MonetizationIntent = 'cheapest' | 'football' | 'movies' | 'family' | 'no-contract' | 'premium';
export type MonetizationFeature = 'downloads' | 'live' | 'sports' | 'football' | 'family' | '4k';
export type MonetizationSort = 'recommended' | 'price-asc' | 'price-desc' | 'provider';
export type MonetizationPlacement = 'comparison-card' | 'comparison-table' | 'comparison-selection' | 'content-detail' | 'provider-summary';

export interface MonetizationOffer {
  id: string;
  market: 'ES';
  provider: { id: string; name: string };
  plan: { id: string; name: string };
  pricing: {
    currency: 'EUR';
    monthlyAmount: number | null;
    annualAmount: number | null;
    monthlyLabel: string;
    annualLabel: string;
    activationFeeAmount: number | null;
    promotion?: { label: string; expiresAt?: string };
  };
  features: {
    simultaneousStreams: string;
    maxResolution: string;
    downloads: boolean | null;
    ads: boolean | null;
    liveContent: boolean | null;
    sports: boolean;
    football: boolean;
    movies: boolean;
    series: boolean;
    family: boolean;
    fourK: boolean;
  };
  requirements: {
    commitmentMonths: number;
    fibreRequired: boolean;
    mobileRequired: boolean;
    device: string | null;
  };
  trialDays: number | null;
  bestFor: string;
  highlight: string;
  disclosure: string;
  verification: {
    lastVerifiedAt: string;
    sourceUrl: string;
    status: 'current' | 'stale' | 'needs_review';
  };
  outbound: {
    path: string;
    relationship: CommercialRelationship;
    label: string;
    isSponsored: boolean;
  };
  recommendation: { intents: MonetizationIntent[] };
}

export interface MonetizationOffersResponse {
  items: MonetizationOffer[];
  meta: { market: 'ES'; total: number; generatedAt: string; disclosure: string };
  filters: { intents: MonetizationIntent[]; features: MonetizationFeature[] };
}

export interface MonetizationQuery {
  intent?: MonetizationIntent;
  features?: MonetizationFeature[];
  maxMonthlyPrice?: number;
  sort?: MonetizationSort;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class MonetizationService {
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly http = inject(HttpClient);

  getOffers(query: MonetizationQuery = {}): Observable<MonetizationOffersResponse> {
    let params = new HttpParams().set('market', 'ES');
    if (query.intent) params = params.set('intent', query.intent);
    if (query.features?.length) params = params.set('features', query.features.join(','));
    if (query.maxMonthlyPrice !== undefined) params = params.set('maxMonthlyPrice', String(query.maxMonthlyPrice));
    if (query.sort) params = params.set('sort', query.sort);

    return this.http.get<ApiEnvelope<MonetizationOffersResponse>>(
      `${this.baseUrl}/monetization/offers`,
      { params }
    ).pipe(map((response) => {
      if (!response.success || !response.data) throw new Error('La respuesta de ofertas no es válida.');
      return response.data;
    }));
  }

  buildOutboundUrl(path: string, placement: MonetizationPlacement): string {
    const separator = path.includes('?') ? '&' : '?';
    if (/^https?:\/\//i.test(this.baseUrl)) {
      const origin = new URL(this.baseUrl).origin;
      return `${origin}${path}${separator}placement=${encodeURIComponent(placement)}`;
    }
    return `${path}${separator}placement=${encodeURIComponent(placement)}`;
  }
}
