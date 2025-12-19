import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

interface AnalyticsEventPayload {
  eventId?: string;
  sessionId: string;
  anonId: string;
  userId?: string;
  type: string;
  name?: string;
  path?: string;
  title?: string;
  referrer?: string;
  occurredAt?: string;
  data?: Record<string, any>;
  timezone?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService implements OnDestroy {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly baseUrl = environment.API_BASE_URL;
  private readonly anonStorageKey = 'gtv_anon_id';
  private readonly heartbeatMs = 15000;
  private initialized = false;
  private heartbeatSub?: Subscription;

  private sessionId: string | null = null;
  private anonId: string | null = null;
  private startedAt: number | null = null;
  private lastPath: string | null = null;
  private hasTrackedFirstPageView = false;

  constructor(private http: HttpClient) {}

  init(): void {
    if (!this.isBrowser || this.initialized) return;
    this.initialized = true;

    this.anonId = this.getOrCreateAnonId();
    this.sessionId = this.createSessionId();
    this.startedAt = Date.now();
    this.lastPath = this.getCurrentPath();

    this.postJson('/analytics/session/start', {
      sessionId: this.sessionId,
      anonId: this.anonId,
      initialPath: this.lastPath,
      lastPath: this.lastPath,
      referrer: document.referrer || undefined,
      screen: {
        width: window.screen?.width,
        height: window.screen?.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      language: navigator.language,
      timezone: this.getTimezone(),
      startedAt: new Date(this.startedAt).toISOString(),
    });

    this.startHeartbeat();
    this.bindUnload();
  }

  trackPageView(path: string): void {
    const previousPath = this.hasTrackedFirstPageView ? this.lastPath : null;
    this.init();
    if (!this.sessionId || !this.anonId || !this.isBrowser) return;
    this.lastPath = path;
    this.hasTrackedFirstPageView = true;

    const payload: AnalyticsEventPayload = {
      sessionId: this.sessionId,
      anonId: this.anonId,
      type: 'page_view',
      name: 'page_view',
      path,
      title: document.title || undefined,
      referrer: previousPath || document.referrer || undefined,
      occurredAt: new Date().toISOString(),
      timezone: this.getTimezone(),
    };

    this.postJson('/analytics/event', payload);
  }

  trackEvent(type: string, data?: Record<string, any>, name?: string): void {
    this.init();
    if (!this.sessionId || !this.anonId || !this.isBrowser) return;

    const payload: AnalyticsEventPayload = {
      sessionId: this.sessionId,
      anonId: this.anonId,
      type,
      name,
      path: this.getCurrentPath(),
      title: document.title || undefined,
      referrer: document.referrer || undefined,
      occurredAt: new Date().toISOString(),
      data,
      timezone: this.getTimezone(),
    };

    this.postJson('/analytics/event', payload);
  }

  private startHeartbeat(): void {
    if (!this.isBrowser || !this.sessionId) return;
    this.heartbeatSub = interval(this.heartbeatMs).subscribe(() => {
      if (!this.sessionId) return;
      this.postJson('/analytics/session/heartbeat', {
        sessionId: this.sessionId,
        lastPath: this.lastPath || this.getCurrentPath(),
        lastSeenAt: new Date().toISOString(),
      });
    });
  }

  private bindUnload(): void {
    if (!this.isBrowser) return;
    const handler = () => this.endSession('pagehide');
    window.addEventListener('pagehide', handler);
    window.addEventListener('beforeunload', handler);
  }

  private endSession(reason: string): void {
    if (!this.sessionId || !this.isBrowser) return;

    const payload = {
      sessionId: this.sessionId,
      lastPath: this.lastPath || this.getCurrentPath(),
      endReason: reason,
      endedAt: new Date().toISOString(),
    };

    const url = this.buildUrl('/analytics/session/end');

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      navigator.sendBeacon(url, blob);
    } else {
      this.postJson('/analytics/session/end', payload);
    }
  }

  private postJson(path: string, payload: any): void {
    const url = this.buildUrl(path);
    this.http.post(url, payload, { headers: this.buildHeaders() }).subscribe({
      error: () => {
        // Avoid breaking app flow on analytics errors
      },
    });
  }

  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private getCurrentPath(): string {
    if (!this.isBrowser) return '';
    return `${location.pathname}${location.search}${location.hash}`;
  }

  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  private getOrCreateAnonId(): string {
    if (!this.isBrowser) return this.createSessionId();
    try {
      const stored = localStorage.getItem(this.anonStorageKey);
      if (stored) return stored;
      const anonId = this.createSessionId();
      localStorage.setItem(this.anonStorageKey, anonId);
      return anonId;
    } catch {
      return this.createSessionId();
    }
  }

  private createSessionId(): string {
    if (this.isBrowser && 'crypto' in window && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  ngOnDestroy(): void {
    this.heartbeatSub?.unsubscribe();
  }
}
