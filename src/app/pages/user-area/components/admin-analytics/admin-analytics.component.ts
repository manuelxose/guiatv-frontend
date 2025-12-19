import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
                class="p-3 rounded-xl bg-gray-900/40 border border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p class="text-white text-sm font-medium">{{ session.lastPath || '/' }}</p>
                  <p class="text-xs text-gray-500">
                    {{ session.sessionId.slice(0, 8) }} · {{ formatDuration(session.durationSec || 0) }}
                  </p>
                </div>
                <div class="text-xs text-gray-500">
                  Last seen: {{ session.lastSeenAt | date: 'shortTime' }}
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

  private subs = new Subscription();

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
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
