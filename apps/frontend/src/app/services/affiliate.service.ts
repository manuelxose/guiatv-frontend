import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  AffiliateContext,
  AffiliateImpressionInput,
  AffiliateResolvedOffer,
} from '../interfaces/affiliate.interface';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
}

interface AffiliateResolveResponse {
  items: AffiliateResolvedOffer[];
  meta: { market: string; placement: string; total: number; generatedAt: string };
}

export interface AffiliateResolveOptions {
  intent?: string;
  providerKeys?: string[];
  maxResults?: number;
  /** Restricts candidates to one AffiliateOffer.category (e.g. 'smart-tv') — see AffiliateResolveDTO.ts. */
  category?: string;
  /** Editor-chosen offer ids shown first, ahead of automatic ranking. */
  pinnedOfferIds?: string[];
  /** false = only `pinnedOfferIds` are resolved, the automatic candidate search never runs. Defaults to true. */
  autoResolve?: boolean;
}

interface AffiliateCacheEntry {
  expiresAt: number;
  offers: AffiliateResolvedOffer[];
}

/** Minutes, not hours — offers can be paused. Mirrors docs/affiliate-engine-architecture.md §18. */
const RESOLVE_CACHE_TTL_MS = 60_000;
/** Mirrors AffiliateController's server-side batch cap. */
const MAX_IMPRESSIONS_PER_BATCH = 25;

/**
 * Single frontend entry point to the generic Affiliate Engine
 * (`POST /v2/affiliate/resolve`, `POST /v2/affiliate/impression`). Every
 * later surface (cards, EPG, search, chatbot, football, blog, comparison)
 * consumes offers through this service — never `HttpClient` directly, and
 * never a provider-specific branch. It never constructs, exposes, or caches
 * a raw affiliate URL: the only thing it returns to a component is a
 * server-relative `outbound.path`, resolved through `buildOutboundUrl`.
 */
@Injectable({ providedIn: 'root' })
export class AffiliateService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly baseUrl = environment.API_BASE_URL;

  private readonly cache = new Map<string, AffiliateCacheEntry>();
  private readonly inFlight = new Map<string, Observable<AffiliateResolvedOffer[]>>();
  /** offerId:placement pairs already beaconed — a session-lifetime guard against duplicate impressions. */
  private readonly firedImpressions = new Set<string>();

  /**
   * The single best offer for a context (e.g. one WhereToWatch CTA).
   * Never throws — resolves to `null` on a missing offer or any failure so a
   * failed affiliate lookup never breaks the page it's embedded in.
   */
  resolve(context: AffiliateContext, options: AffiliateResolveOptions = {}): Observable<AffiliateResolvedOffer | null> {
    return this.resolveMany(context, { ...options, maxResults: options.maxResults ?? 1 }).pipe(
      map((offers) => offers[0] ?? null)
    );
  }

  /**
   * Every eligible offer for a context, most-relevant first (e.g. a
   * comparison rail or a where-to-watch list). Never throws — resolves to
   * `[]` on any failure. Results are cached per distinct context/options for
   * a short TTL; `resolveRedirect`-equivalent (the actual `go/:offerId`
   * click) is a plain outbound link, never routed through this cache.
   */
  resolveMany(context: AffiliateContext, options: AffiliateResolveOptions = {}): Observable<AffiliateResolvedOffer[]> {
    const key = this.cacheKey(context, options);

    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return of(cached.offers);
    }

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const request$ = this.http
      .post<ApiEnvelope<AffiliateResolveResponse>>(`${this.baseUrl}/affiliate/resolve`, {
        context,
        intent: options.intent,
        providerKeys: options.providerKeys,
        maxResults: options.maxResults,
        category: options.category,
        pinnedOfferIds: options.pinnedOfferIds,
        autoResolve: options.autoResolve,
      })
      .pipe(
        map((response) => (response.success && response.data ? response.data.items : [])),
        catchError(() => of([] as AffiliateResolvedOffer[])),
        map((offers) => {
          this.cache.set(key, { offers, expiresAt: Date.now() + RESOLVE_CACHE_TTL_MS });
          this.inFlight.delete(key);
          return offers;
        }),
        shareReplay(1)
      );

    this.inFlight.set(key, request$);
    return request$;
  }

  /**
   * Resolves `outbound.path` (server-relative, already carrying `placement`
   * and `market` per docs/affiliate-engine-architecture.md §11) to an
   * absolute URL only when the API itself is cross-origin. Never appends,
   * edits, or reconstructs a query parameter — the resolver already built
   * them; this is the one and only place a component turns an offer into an
   * `href`.
   */
  buildOutboundUrl(offer: Pick<AffiliateResolvedOffer, 'outbound'>): string {
    const path = offer.outbound.path;
    if (/^https?:\/\//i.test(this.baseUrl)) {
      return `${new URL(this.baseUrl).origin}${path}`;
    }
    return path;
  }

  /**
   * Batches impressions to `POST /v2/affiliate/impression`. Browser-only
   * (SSR has no viewport, so nothing has been "seen" yet) and deduped per
   * `offerId:placement` for the service's lifetime — calling this twice for
   * the same pair, from a re-render, an extra change-detection pass, or two
   * independent components, is a guaranteed no-op on the second call.
   * sendBeacon-first so a page unload never drops a pending batch.
   */
  trackImpressions(
    impressions: AffiliateImpressionInput[],
    identity?: { anonId?: string; sessionId?: string }
  ): void {
    if (!this.isBrowser || impressions.length === 0) return;

    const fresh = impressions.filter((impression) => {
      const key = `${impression.offerId}:${impression.placement}`;
      if (this.firedImpressions.has(key)) return false;
      this.firedImpressions.add(key);
      return true;
    });
    if (fresh.length === 0) return;

    const payload = { context: identity, impressions: fresh.slice(0, MAX_IMPRESSIONS_PER_BATCH) };
    const url = this.buildAbsoluteUrl('/affiliate/impression');

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }

    this.http.post(url, payload, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).subscribe({
      error: () => {
        // Tracking failures must never surface to the UI.
      },
    });
  }

  private buildAbsoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(this.baseUrl)) {
      return `${this.baseUrl}${path}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${this.baseUrl}${path}`;
    }
    return `${this.baseUrl}${path}`;
  }

  private cacheKey(context: AffiliateContext, options: AffiliateResolveOptions): string {
    return JSON.stringify({
      market: context.market,
      placement: context.placement,
      pageType: context.pageType,
      contentType: context.contentType,
      contentId: context.contentId,
      providerKey: context.providerKey,
      channelId: context.channelId,
      catalogId: context.catalogId,
      movieId: context.movieId,
      seriesId: context.seriesId,
      footballMatchId: context.footballMatchId,
      competitionId: context.competitionId,
      blogPostId: context.blogPostId,
      searchQuery: context.searchQuery,
      intent: options.intent,
      providerKeys: options.providerKeys,
      maxResults: options.maxResults,
      category: options.category,
      pinnedOfferIds: options.pinnedOfferIds,
      autoResolve: options.autoResolve,
    });
  }
}
