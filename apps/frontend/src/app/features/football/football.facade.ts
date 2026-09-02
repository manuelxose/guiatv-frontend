import { Inject, Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import { FootballApiService } from './football-api.service';
import {
  FootballCompetitionDetailDTO,
  FootballHomeDTO,
  FootballMatchDetailDTO,
  FootballMatchesResponseDTO,
  FootballNewsDTO,
  FootballSearchDTO,
  FootballTeamDetailDTO,
} from './football.models';

/**
 * Football data facade.
 *
 * - Single source of truth for football data access.
 * - Reuses SSR-fetched data via Angular TransferState so hydration does not
 *   repeat the exact call the server already made.
 * - Degrades gracefully: provider/network failures fall back to empty state
 *   rather than breaking the whole page.
 */
@Injectable({ providedIn: 'root' })
export class FootballFacade {
  private readonly isServer: boolean;
  private readonly isBrowser: boolean;
  private readonly transferCache = new Map<string, unknown>();

  constructor(
    private readonly api: FootballApiService,
    private readonly transferState: TransferState,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isServer = isPlatformServer(platformId);
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getHome(): Observable<FootballHomeDTO> {
    return this.transferable<FootballHomeDTO>('football:home', () =>
      this.api.getHome().pipe(map((res) => res.data ?? this.emptyHome()))
    ).pipe(catchError(() => of(this.emptyHome(true))));
  }

  getMatches(params: Parameters<FootballApiService['getMatches']>[0] = {}): Observable<FootballMatchesResponseDTO> {
    const key = `football:matches:${JSON.stringify(params)}`;
    return this.transferable<FootballMatchesResponseDTO>(key, () =>
      this.api.getMatches(params).pipe(map((res) => res.data ?? { matches: [], meta: {} }))
    ).pipe(catchError(() => of({ matches: [], meta: { loadError: true } })));
  }

  getLiveMatches(): Observable<FootballMatchesResponseDTO> {
    return this.transferable<FootballMatchesResponseDTO>('football:live', () =>
      this.api.getLiveMatches().pipe(map((res) => res.data ?? { matches: [], meta: {} }))
    ).pipe(catchError(() => of({ matches: [], meta: { loadError: true } })));
  }

  getMatch(idOrSlug: string): Observable<FootballMatchDetailDTO | null> {
    const key = `football:match:${idOrSlug}`;
    return this.transferable<FootballMatchDetailDTO | null>(key, () =>
      this.api.getMatch(idOrSlug).pipe(map((res) => res.data ?? null))
    ).pipe(catchError(() => of(null)));
  }

  getCompetitions(): Observable<FootballCompetitionDetailDTO['competition'][]> {
    return this.transferable('football:competitions', () =>
      this.api.getCompetitions().pipe(map((res) => res.data?.competitions ?? []))
    ).pipe(catchError(() => of([])));
  }

  getCompetition(slug: string): Observable<FootballCompetitionDetailDTO | null> {
    const key = `football:competition:${slug}`;
    return this.transferable<FootballCompetitionDetailDTO | null>(key, () =>
      this.api.getCompetition(slug).pipe(map((res) => res.data ?? null))
    ).pipe(catchError(() => of(null)));
  }

  getTeam(slug: string): Observable<FootballTeamDetailDTO | null> {
    const key = `football:team:${slug}`;
    return this.transferable<FootballTeamDetailDTO | null>(key, () =>
      this.api.getTeam(slug).pipe(map((res) => res.data ?? null))
    ).pipe(catchError(() => of(null)));
  }

  search(q: string): Observable<FootballSearchDTO> {
    const key = `football:search:${q}`;
    return this.transferable<FootballSearchDTO>(key, () =>
      this.api.search(q).pipe(map((res) => res.data ?? this.emptySearch(q)))
    ).pipe(catchError(() => of(this.emptySearch(q))));
  }

  getNews(params: Parameters<FootballApiService['getNews']>[0] = {}): Observable<FootballNewsDTO[]> {
    const key = `football:news:${JSON.stringify(params)}`;
    return this.transferable<FootballNewsDTO[]>(key, () =>
      this.api.getNews(params).pipe(map((res) => res.data?.news ?? []))
    ).pipe(catchError(() => of([])));
  }

  /**
   * Single article by slug — goes through the same football-scoped API/
   * TransferState pipeline as every other detail page. Replaces the old
   * football-news-detail pattern of fetching the entire blog collection
   * client-side and filtering by slug in memory.
   */
  getNewsItem(slug: string): Observable<FootballNewsDTO | null> {
    return this.getNews({ slug, limit: 1 }).pipe(map((items) => items[0] ?? null));
  }

  private transferable<T>(key: string, producer: () => Observable<T>): Observable<T> {
    const stateKey = makeStateKey<T>(key);

    // 1. Already fetched in this session (server or client).
    if (this.transferCache.has(key)) {
      return of(this.transferCache.get(key) as T);
    }

    // 2. Server rendered this data — reuse it, no refetch.
    if (this.isBrowser && this.transferState.hasKey(stateKey)) {
      const value = this.transferState.get(stateKey, null);
      this.transferCache.set(key, value);
      return of(value as T);
    }

    return producer().pipe(
      tap((value) => {
        this.transferCache.set(key, value);
        if (this.isServer) {
          this.transferState.set(stateKey, value);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private emptyHome(loadError = false): FootballHomeDTO {
    return {
      liveMatches: [],
      todayMatches: [],
      featuredMatches: [],
      upcomingMatches: [],
      featuredCompetitions: [],
      standingsSnapshot: null,
      latestNews: [],
      generatedAt: new Date().toISOString(),
      ...(loadError ? { loadError: true } : {}),
    };
  }

  private emptySearch(query: string): FootballSearchDTO {
    return { query, matches: [], teams: [], competitions: [], news: [], meta: {} };
  }
}
