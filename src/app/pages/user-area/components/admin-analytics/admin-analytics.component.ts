import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import {
  AdminAnalyticsEvent,
  AdminAnalyticsLiveSession,
  AdminAnalyticsOverview,
  AdminAnalyticsService,
} from '../../../../services/admin-analytics.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Admin Analytics</h2>
          <p class="text-gray-400 text-sm">Realtime monitoring and metrics</p>
        </div>
        <div class="text-xs text-gray-500" *ngIf="lastUpdated">
          Updated: {{ lastUpdated | date: 'shortTime' }}
        </div>
      </div>

      <div *ngIf="error" class="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl">
        {{ error }}
      </div>

      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Active Now</p>
          <p class="text-3xl font-bold text-white mt-2">{{ activeNow !== null ? activeNow : (overview?.activeNow || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Last 90s</p>
        </div>
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Sessions (24h)</p>
          <p class="text-3xl font-bold text-white mt-2">{{ overview?.totalSessions || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Unique: {{ overview?.uniqueVisitors || 0 }}</p>
        </div>
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Page Views (24h)</p>
          <p class="text-3xl font-bold text-white mt-2">{{ overview?.totalPageViews || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Top pages tracked</p>
        </div>
        <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Avg Session</p>
          <p class="text-3xl font-bold text-white mt-2">{{ formatDuration(overview?.avgSessionDurationSec || 0) }}</p>
          <p class="text-xs text-gray-500 mt-1">Ended sessions</p>
        </div>
      </div>

      <div class="grid xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-6">
          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Active Sessions</h3>
              <span class="text-xs text-gray-400">
                {{ activeNow !== null ? activeNow : liveSessions.length }} users
              </span>
            </div>
            <div *ngIf="liveSessions.length === 0" class="text-sm text-gray-500 py-6 text-center">
              No active sessions right now.
            </div>
            <div class="space-y-3" *ngIf="liveSessions.length > 0">
              <div
                *ngFor="let session of liveSessions; trackBy: trackBySession"
                class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 flex flex-col gap-3"
              >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p class="text-white text-sm font-medium">{{ session.lastPath || '/' }}</p>
                    <p class="text-xs text-gray-500">
                      {{ session.sessionId.slice(0, 8) }} · {{ formatDuration(session.durationSec || 0) }}
                      <span *ngIf="getIdleLabel(session)" class="ml-2 text-yellow-400">
                        {{ getIdleLabel(session) }}
                      </span>
                    </p>
                  </div>
                  <div class="text-xs text-gray-500">
                    Last seen: {{ session.lastSeenAt | date: 'shortTime' }}
                  </div>
                </div>

                <div class="text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>{{ getDeviceSummary(session) }}</span>
                  <span *ngIf="getBrowserSummary(session.userAgent)">• {{ getBrowserSummary(session.userAgent) }}</span>
                  <span *ngIf="getOsSummary(session.userAgent)">• {{ getOsSummary(session.userAgent) }}</span>
                  <span *ngIf="getConnectionSummary(session)">• {{ getConnectionSummary(session) }}</span>
                </div>

                <button
                  type="button"
                  class="text-xs text-red-400 hover:text-red-300 self-start"
                  (click)="toggleSession(session.sessionId)"
                >
                  {{ isExpanded(session.sessionId) ? 'Hide details' : 'Show details' }}
                </button>

                <div *ngIf="isExpanded(session.sessionId)" class="text-xs text-gray-400 grid sm:grid-cols-2 gap-2">
                  <div>
                    <span class="text-gray-500">IP:</span> {{ session.ip || 'unknown' }}
                  </div>
                  <div>
                    <span class="text-gray-500">Referrer:</span> {{ session.referrer || 'direct' }}
                  </div>
                  <div>
                    <span class="text-gray-500">Language:</span> {{ session.language || '-' }}
                  </div>
                  <div>
                    <span class="text-gray-500">Timezone:</span> {{ session.timezone || '-' }}
                  </div>
                  <div>
                    <span class="text-gray-500">Screen:</span>
                    {{ session.screen?.width || '-' }}x{{ session.screen?.height || '-' }}
                  </div>
                  <div>
                    <span class="text-gray-500">Viewport:</span>
                    {{ session.viewport?.width || '-' }}x{{ session.viewport?.height || '-' }}
                  </div>
                  <div class="sm:col-span-2">
                    <span class="text-gray-500">UA:</span>
                    <span class="break-all">{{ session.userAgent || '-' }}</span>
                  </div>
                  <div *ngIf="session.metadata?.utm" class="sm:col-span-2">
                    <span class="text-gray-500">UTM:</span>
                    {{ session.metadata?.utm | json }}
                  </div>
                  <div class="sm:col-span-2">
                    <span class="text-gray-500">Events:</span>
                    <div *ngIf="sessionEvents[session.sessionId] === null" class="text-gray-500">
                      Loading...
                    </div>
                    <div
                      *ngIf="sessionEvents[session.sessionId]?.length"
                      class="mt-2 space-y-2"
                    >
                      <div
                        *ngFor="let event of sessionEvents[session.sessionId]; trackBy: trackByEvent"
                        class="text-xs text-gray-300"
                      >
                        {{ event.type }} · {{ event.path || event.name || '-' }} ·
                        {{ event.occurredAt | date: 'shortTime' }}
                      </div>
                    </div>
                    <div *ngIf="sessionEvents[session.sessionId]?.length === 0" class="text-gray-500">
                      No events
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">Recent Activity</h3>
              <span class="text-xs text-gray-400">Last {{ recentEvents.length }} events</span>
            </div>
            <div *ngIf="recentEvents.length === 0" class="text-sm text-gray-500 py-6 text-center">
              No events yet.
            </div>
            <div class="space-y-3" *ngIf="recentEvents.length > 0">
              <div
                *ngFor="let event of recentEvents; trackBy: trackByEvent"
                class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50"
              >
                <p class="text-white text-sm font-medium">{{ event.path || event.type }}</p>
                <p class="text-xs text-gray-500">
                  {{ event.type }} · {{ event.occurredAt | date: 'shortTime' }} · {{ event.sessionId.slice(0, 8) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Top Pages</h3>
            <div *ngIf="overview?.topPages?.length === 0" class="text-sm text-gray-500">
              No data yet.
            </div>
            <div class="space-y-2" *ngIf="overview?.topPages?.length">
              <div
                *ngFor="let page of overview?.topPages"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-300 truncate pr-3">{{ page.path }}</span>
                <span class="text-gray-500">{{ page.count }}</span>
              </div>
            </div>
          </div>

          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Top Referrers</h3>
            <div *ngIf="overview?.topReferrers?.length === 0" class="text-sm text-gray-500">
              No data yet.
            </div>
            <div class="space-y-2" *ngIf="overview?.topReferrers?.length">
              <div
                *ngFor="let ref of overview?.topReferrers"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-300 truncate pr-3">{{ ref.referrer }}</span>
                <span class="text-gray-500">{{ ref.count }}</span>
              </div>
            </div>
          </div>

          <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Sessions by Day</h3>
            <div *ngIf="overview?.sessionsByDay?.length === 0" class="text-sm text-gray-500">
              No data yet.
            </div>
            <div class="space-y-2" *ngIf="overview?.sessionsByDay?.length">
              <div
                *ngFor="let item of overview?.sessionsByDay"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-300">{{ item.date }}</span>
                <span class="text-gray-500">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  overview: AdminAnalyticsOverview | null = null;
  liveSessions: AdminAnalyticsLiveSession[] = [];
  recentEvents: AdminAnalyticsEvent[] = [];
  activeNow: number | null = null;
  error: string | null = null;
  lastUpdated: Date | null = null;
  expandedSessionId: string | null = null;
  sessionEvents: Record<string, AdminAnalyticsEvent[] | null> = {};

  private subs = new Subscription();
  private readonly isBrowser: boolean;

  constructor(
    private analyticsService: AdminAnalyticsService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.loadAll();

    this.subs.add(
      interval(10000).subscribe(() => this.loadLive())
    );
    this.subs.add(
      interval(30000).subscribe(() => this.loadRecentEvents())
    );
    this.subs.add(
      interval(60000).subscribe(() => this.loadOverview())
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  trackBySession(_index: number, item: AdminAnalyticsLiveSession): string {
    return item.sessionId;
  }

  trackByEvent(_index: number, item: AdminAnalyticsEvent): string {
    return item.eventId;
  }

  formatDuration(totalSeconds: number): string {
    if (!totalSeconds) return '0s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  toggleSession(sessionId: string): void {
    const isOpening = this.expandedSessionId !== sessionId;
    this.expandedSessionId = isOpening ? sessionId : null;

    if (isOpening && this.sessionEvents[sessionId] === undefined) {
      this.sessionEvents[sessionId] = null;
      this.analyticsService.getRecentEvents(20, undefined, sessionId).subscribe({
        next: (events) => {
          this.sessionEvents[sessionId] = events;
        },
        error: () => {
          this.sessionEvents[sessionId] = [];
        },
      });
    }
  }

  isExpanded(sessionId: string): boolean {
    return this.expandedSessionId === sessionId;
  }

  getDeviceSummary(session: AdminAnalyticsLiveSession): string {
    const device = session.metadata?.device;
    const type = device?.type || (session.metadata?.uaData?.mobile ? 'mobile' : 'desktop');
    const orientation = device?.orientation;
    const touch = device?.isTouchDevice ? 'touch' : '';
    return [type, orientation, touch].filter(Boolean).join(' · ') || 'device';
  }

  getBrowserSummary(userAgent?: string): string {
    if (!userAgent) return '';
    if (userAgent.includes('Edg/')) return 'Edge';
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome';
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
    if (userAgent.includes('Firefox/')) return 'Firefox';
    return '';
  }

  getOsSummary(userAgent?: string): string {
    if (!userAgent) return '';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS X') && !userAgent.includes('iPhone')) return 'macOS';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('Linux')) return 'Linux';
    return '';
  }

  getConnectionSummary(session: AdminAnalyticsLiveSession): string {
    const connection = session.metadata?.connection;
    if (!connection?.effectiveType) return '';
    return `${connection.effectiveType}${connection.saveData ? ' (save-data)' : ''}`;
  }

  getIdleLabel(session: AdminAnalyticsLiveSession): string {
    const activity = session.metadata?.activity;
    if (!activity) return '';
    if (activity.isIdle) return `Idle ${activity.idleSec}s`;
    return '';
  }

  private loadAll(): void {
    this.loadOverview();
    this.loadLive();
    this.loadRecentEvents();
  }

  private loadOverview(): void {
    this.analyticsService.getOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.error = null;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.error = 'Failed to load analytics overview.';
      },
    });
  }

  private loadLive(): void {
    this.analyticsService.getLive().subscribe({
      next: (snapshot) => {
        this.activeNow = snapshot.activeCount;
        this.liveSessions = snapshot.sessions;
        this.error = null;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.error = 'Failed to load live sessions.';
      },
    });
  }

  private loadRecentEvents(): void {
    this.analyticsService.getRecentEvents(40).subscribe({
      next: (events) => {
        this.recentEvents = events;
        this.error = null;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.error = 'Failed to load recent events.';
      },
    });
  }
}
