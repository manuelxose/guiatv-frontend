import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable, catchError, combineLatest, fromEvent, interval, map, merge, of, startWith, switchMap } from 'rxjs';
import { FootballApiService } from './football-api.service';
import { FootballMatchDTO } from './football.models';

const DEFAULT_INTERVAL_MS = 25000;

/**
 * Owns the one live-score polling loop for the football vertical (spec
 * §49-51): adaptive, client-only, single interval per subscription — callers
 * decide *when* to poll (`active$`), this service decides *how* (cadence,
 * SSR guard, error swallowing so a failed poll never breaks the page).
 *
 * Deliberately bypasses `FootballFacade`'s TransferState/in-memory cache —
 * that cache exists so one SSR-rendered value survives hydration; polling
 * needs the opposite; a fresh network call every tick.
 */
@Injectable({ providedIn: 'root' })
export class FootballLiveRefreshService {
  private readonly isBrowser: boolean;

  constructor(
    private readonly api: FootballApiService,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Emits a fresh live-matches snapshot every `intervalMs` while `active$`
   * is `true`. No-ops entirely on the server. A failed poll is swallowed
   * (previous state just doesn't update that tick) rather than surfaced.
   */
  liveMatches(active$: Observable<boolean>, intervalMs = DEFAULT_INTERVAL_MS): Observable<FootballMatchDTO[]> {
    if (!this.isBrowser) return EMPTY;

    const visible$ = merge(
      of(!this.document.hidden),
      fromEvent(this.document, 'visibilitychange').pipe(map(() => !this.document.hidden))
    );

    return combineLatest([active$, visible$]).pipe(
      switchMap(([active, visible]) => (active && visible ? interval(intervalMs).pipe(startWith(0)) : EMPTY)),
      switchMap(() =>
        this.api.getLiveMatches().pipe(
          map((res) => res.data?.matches ?? []),
          // Do not turn a transport failure into an authoritative empty
          // snapshot: EMPTY preserves the last rendered state for this tick.
          catchError(() => EMPTY)
        )
      )
    );
  }
}

/**
 * Merges a fresh live snapshot into an existing match list by id — updates
 * score/minute/status in place, keeps list order and any non-live matches
 * untouched (spec §51: no reordering, no scroll jump on a poll tick).
 */
export function mergeLiveUpdates(matches: FootballMatchDTO[], liveUpdates: FootballMatchDTO[] | null): FootballMatchDTO[] {
  if (!liveUpdates?.length) return matches;
  const byId = new Map(liveUpdates.map((match) => [match.id, match]));
  return matches.map((match) => byId.get(match.id) ?? match);
}

/** A dedicated live route mirrors membership from the latest successful
 * provider snapshot. `null` means no poll has completed yet; an empty array
 * is authoritative and removes matches that have finished. */
export function resolveLiveSnapshot(
  initialMatches: FootballMatchDTO[],
  liveSnapshot: FootballMatchDTO[] | null
): FootballMatchDTO[] {
  return liveSnapshot === null ? initialMatches : liveSnapshot;
}

/** Poll shortly before kickoff as well as during play so an open page can
 * observe scheduled → live without waiting for a navigation or reload. */
export function shouldPollLiveTransitions(matches: FootballMatchDTO[], nowMs = Date.now()): boolean {
  const transitionWindowMs = 20 * 60 * 1000;
  return matches.some((match) => {
    if (match.status === 'live' || match.status === 'halftime') return true;
    if (match.status !== 'scheduled') return false;
    const kickoffMs = new Date(match.kickoffAt).getTime();
    return Number.isFinite(kickoffMs) && kickoffMs >= nowMs - transitionWindowMs && kickoffMs <= nowMs + transitionWindowMs;
  });
}
