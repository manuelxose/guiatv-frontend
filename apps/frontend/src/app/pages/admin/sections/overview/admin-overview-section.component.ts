import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdminOperationsService } from '../../../../services/admin-operations.service';
import { AdminSchedulesService, EpgOverview, HealthResponse } from '../../../../services/admin-schedules.service';
import { AdminAIAnalyticsService } from '../../../../services/admin-ai-analytics.service';
import { AdminGroupId } from '../../admin.types';
import { AdminStatusBadgeComponent } from '../../components/admin-status-badge/admin-status-badge.component';

export type HealthStatus = 'healthy' | 'warning' | 'unavailable' | 'unknown';

export interface HealthTile {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  group?: AdminGroupId;
  item?: string;
}

export interface AttentionItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  subsystem: string;
  message: string;
  group: AdminGroupId;
  item: string;
}

const SUBSYSTEM_TARGET: Record<string, { group: AdminGroupId; item: string }> = {
  football: { group: 'operations', item: 'football' },
  jobs: { group: 'operations', item: 'jobs' },
  cache: { group: 'operations', item: 'cache' },
};

@Component({
  selector: 'app-admin-overview-section',
  standalone: true,
  imports: [CommonModule, AdminStatusBadgeComponent],
  templateUrl: './admin-overview-section.component.html',
  styleUrls: ['./admin-overview-section.component.scss'],
})
export class AdminOverviewSectionComponent implements OnInit, OnDestroy {
  @Output() lastUpdatedChange = new EventEmitter<Date>();
  @Output() navigate = new EventEmitter<{ group: AdminGroupId; item: string }>();

  loading = true;
  error = '';

  healthTiles: HealthTile[] = [];
  attentionItems: AttentionItem[] = [];

  epg: EpgOverview | null = null;
  football: {
    provider: { state: string };
    activeCompetitions: number;
    upcomingFixtures: number;
    fixturesMissingBroadcast: number;
    staleCompetitions: number;
    staleTeams: number;
  } | null = null;
  jobsRunning = 0;
  jobsFailed = 0;

  private readonly sub = new Subscription();

  constructor(
    private readonly operations: AdminOperationsService,
    private readonly schedules: AdminSchedulesService,
    private readonly aiAnalytics: AdminAIAnalyticsService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  goTo(group: AdminGroupId, item: string): void {
    this.navigate.emit({ group, item });
  }

  private load(): void {
    this.loading = true;
    this.error = '';

    this.sub.add(
      forkJoin({
        health: this.schedules.getHealth().pipe(
          map((value) => ({ ok: true as const, value })),
          catchError(() => of({ ok: false as const, value: null as HealthResponse | null }))
        ),
        epg: this.schedules.getEpgOverview().pipe(
          map((value) => ({ ok: true as const, value })),
          catchError(() => of({ ok: false as const, value: null as EpgOverview | null }))
        ),
        football: this.operations.getFootballOverview().pipe(
          map((value) => ({ ok: true as const, value })),
          catchError(() => of({ ok: false as const, value: null }))
        ),
        alerts: this.operations.getAlerts().pipe(
          map((value) => ({ ok: true as const, value })),
          catchError(() => of({ ok: false as const, value: null }))
        ),
        jobsRunning: this.operations.getJobs({ status: 'running', limit: 1 }).pipe(
          map((value) => ({ ok: true as const, value })),
          catchError(() => of({ ok: false as const, value: null }))
        ),
        jobsFailed: this.operations.getJobs({ status: 'failed', limit: 1 }).pipe(
          map((value) => ({ ok: true as const, value })),
          catchError(() => of({ ok: false as const, value: null }))
        ),
        // getOverview() already swallows HTTP errors into a null value, so
        // "ok" here only ever reflects that the observable completed — the
        // health tile below reads presence of `value`, not `ok`.
        ai: this.aiAnalytics.getOverview().pipe(map((value) => ({ ok: true as const, value }))),
      }).subscribe((result) => {
        this.epg = result.epg.value;
        this.football = result.football.value as typeof this.football;
        this.jobsRunning = (result.jobsRunning.value as { total?: number } | null)?.total || 0;
        this.jobsFailed = (result.jobsFailed.value as { total?: number } | null)?.total || 0;

        this.healthTiles = this.buildHealthTiles(result);
        this.attentionItems = this.buildAttentionItems(
          (result.alerts.value as { items?: AttentionItem[] } | null)?.items || []
        );

        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      })
    );
  }

  private buildHealthTiles(result: {
    health: { ok: boolean; value: HealthResponse | null };
    epg: { ok: boolean; value: EpgOverview | null };
    football: { ok: boolean; value: typeof this.football };
    ai: { ok: boolean; value: unknown };
  }): HealthTile[] {
    const cacheStatus = result.health.value?.services?.cache?.status;
    const providerState = result.football.value?.provider?.state;
    const epgHasIssues =
      !!result.epg.value && (result.epg.value.channelsMissingEpg > 0 || result.epg.value.staleChannels > 0);

    return [
      {
        id: 'api',
        label: 'API',
        status: result.health.ok ? 'healthy' : 'unavailable',
        detail: result.health.ok ? 'Responding' : 'Health check failed',
      },
      {
        id: 'mongo',
        label: 'Mongo',
        // No dedicated Mongo health check exists on /admin/health today —
        // reported as Unknown rather than fabricating a status.
        status: 'unknown',
        detail: 'No dedicated check — see System',
        group: 'system',
        item: 'health',
      },
      {
        id: 'cache',
        label: 'Cache',
        status: cacheStatus === 'healthy' ? 'healthy' : cacheStatus ? 'unavailable' : 'unknown',
        detail: cacheStatus ? `Runtime: ${cacheStatus}` : 'No data',
        group: 'operations',
        item: 'cache',
      },
      {
        id: 'epg',
        label: 'EPG',
        status: !result.epg.ok ? 'unavailable' : epgHasIssues ? 'warning' : 'healthy',
        detail:
          result.epg.value && typeof result.epg.value.currentCoveragePercent === 'number'
            ? `${result.epg.value.currentCoveragePercent}% coverage`
            : 'Overview unavailable',
        group: 'schedules',
        item: 'epg',
      },
      {
        id: 'football',
        label: 'Football',
        status:
          !result.football.ok
            ? 'unavailable'
            : providerState === 'healthy'
              ? 'healthy'
              : providerState === 'degraded'
                ? 'warning'
                : 'unknown',
        detail: providerState ? `Provider: ${providerState}` : 'No provider data',
        group: 'operations',
        item: 'football',
      },
      {
        id: 'ai',
        label: 'AI',
        // AdminAIAnalyticsService.getOverview() swallows HTTP errors into a
        // null value, so failure and "no data yet" are indistinguishable
        // here — reported as Unknown rather than guessing which one it was.
        status: result.ai.value ? 'healthy' : 'unknown',
        detail: result.ai.value ? 'Reachable' : 'No data',
        group: 'ai',
        item: 'dashboard',
      },
    ];
  }

  private buildAttentionItems(
    items: Array<{ id: string; severity: 'info' | 'warning' | 'critical'; subsystem: string; message: string }>
  ): AttentionItem[] {
    return items.map((raw) => {
      const target = SUBSYSTEM_TARGET[raw.subsystem] || { group: 'operations' as AdminGroupId, item: 'overview' };
      return { ...raw, group: target.group, item: target.item };
    });
  }
}
