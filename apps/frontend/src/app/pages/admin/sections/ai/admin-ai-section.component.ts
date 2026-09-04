import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AdminAIAnalyticsService,
  AIAnalyticsOverview,
  AIAnalyticsTimeSeries,
  AIFailureDiagnostic,
} from '../../../../services/admin-ai-analytics.service';

@Component({
  selector: 'app-admin-ai-section',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[var(--portal-text)]">AI Chatbot Analytics</h2>
        <button
          type="button"
          (click)="refresh()"
          class="rounded-lg border border-[var(--portal-border-strong)] bg-[var(--portal-surface-strong)] px-3 py-1.5 text-xs text-[var(--portal-text-soft)] hover:bg-[var(--portal-border-strong)] transition-colors"
        >
          Refresh
        </button>
      </div>

      <!-- KPI cards -->
      <div *ngIf="overview" class="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <p class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Conversations</p>
          <p class="text-3xl font-semibold text-[var(--portal-text)] mt-2">{{ overview.totalConversations }}</p>
          <p class="text-xs text-[var(--portal-text-muted)] mt-1">Total</p>
        </div>
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <p class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Messages</p>
          <p class="text-3xl font-semibold text-[var(--portal-text)] mt-2">{{ overview.totalMessages }}</p>
          <p class="text-xs text-[var(--portal-text-muted)] mt-1">Avg {{ overview.avgMessagesPerConversation }}/conv</p>
        </div>
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <p class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Active Today</p>
          <p class="text-3xl font-semibold text-[var(--portal-text)] mt-2">{{ overview.activeUsersToday }}</p>
          <p class="text-xs text-[var(--portal-text-muted)] mt-1">Week: {{ overview.activeUsersWeek }}</p>
        </div>
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <p class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Feedback</p>
          <p class="text-2xl font-semibold mt-2">
            <span class="text-[var(--accent-discover)]">+{{ overview.feedbackSummary.positive }}</span>
            <span class="text-[var(--portal-text-faint)] mx-1">/</span>
            <span class="text-[var(--spotify-negative)]">-{{ overview.feedbackSummary.negative }}</span>
          </p>
          <p class="text-xs text-[var(--portal-text-muted)] mt-1">Thumbs up / down</p>
        </div>
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <p class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Subscriptions</p>
          <p class="text-2xl font-semibold mt-2">
            <span class="text-[var(--portal-text)]">{{ overview.subscriptionBreakdown.free }}</span>
            <span class="text-[var(--portal-text-faint)] mx-1">/</span>
            <span class="text-[var(--spotify-warning)]">{{ overview.subscriptionBreakdown.premium }}</span>
          </p>
          <p class="text-xs text-[var(--portal-text-muted)] mt-1">Free / Premium</p>
        </div>
      </div>

      <!-- Top genres & platforms -->
      <div *ngIf="overview" class="grid md:grid-cols-2 gap-6">
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <h3 class="text-sm font-medium text-[var(--portal-text-soft)] mb-3">Top Genres</h3>
          <div class="space-y-2">
            <div
              *ngFor="let g of overview.topGenres; let i = index"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-[var(--portal-text)]">{{ i + 1 }}. {{ g.genre }}</span>
              <span class="text-[var(--portal-text-muted)]">{{ g.count }}</span>
            </div>
            <p *ngIf="!overview.topGenres.length" class="text-xs text-[var(--portal-text-faint)]">No genre data yet</p>
          </div>
        </div>
        <div class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
          <h3 class="text-sm font-medium text-[var(--portal-text-soft)] mb-3">Top Platforms</h3>
          <div class="space-y-2">
            <div
              *ngFor="let p of overview.topPlatforms; let i = index"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-[var(--portal-text)]">{{ i + 1 }}. {{ p.platform }}</span>
              <span class="text-[var(--portal-text-muted)]">{{ p.count }}</span>
            </div>
            <p *ngIf="!overview.topPlatforms.length" class="text-xs text-[var(--portal-text-faint)]">No platform data yet</p>
          </div>
        </div>
      </div>

      <!-- Activity timeline (table) -->
      <div *ngIf="failures.length" class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
        <h3 class="text-sm font-medium text-[var(--portal-text-soft)] mb-3">Recent assistant exceptions</h3>
        <div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="text-left text-[var(--portal-text-muted)]"><th class="pb-2">Outcome</th><th>Reason</th><th>Grounding</th><th>Latency</th><th>Time</th></tr></thead><tbody><tr *ngFor="let event of failures" class="border-t border-[var(--portal-border)]"><td class="py-2 text-[var(--spotify-warning)]">{{ event.outcome }}</td><td>{{ event.failureReason || '—' }}</td><td>{{ event.grounding.join(', ') || '—' }}</td><td>{{ event.latencyMs }} ms</td><td>{{ event.createdAt | date:'short' }}</td></tr></tbody></table></div>
      </div>

      <div *ngIf="timeSeries.length" class="bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl p-5">
        <h3 class="text-sm font-medium text-[var(--portal-text-soft)] mb-3">Daily Activity (last 30 days)</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-[var(--portal-text-muted)] border-b border-[var(--portal-border)]">
                <th class="pb-2 pr-4">Date</th>
                <th class="pb-2 pr-4 text-right">Conversations</th>
                <th class="pb-2 text-right">Messages</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let row of timeSeries"
                class="border-b border-[var(--portal-border)]/40 last:border-0"
              >
                <td class="py-1.5 pr-4 text-[var(--portal-text-soft)]">{{ row.date }}</td>
                <td class="py-1.5 pr-4 text-right text-[var(--portal-text-soft)]">{{ row.conversations }}</td>
                <td class="py-1.5 text-right text-[var(--portal-text-soft)]">{{ row.messages }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading / empty -->
      <div *ngIf="!overview" class="flex items-center justify-center py-16">
        <p class="text-sm text-[var(--portal-text-muted)]">Loading AI analytics…</p>
      </div>
    </div>
  `,
})
export class AdminAISectionComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  overview: AIAnalyticsOverview | null = null;
  timeSeries: AIAnalyticsTimeSeries[] = [];
  failures: AIFailureDiagnostic[] = [];

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly service = inject(AdminAIAnalyticsService);

  ngOnInit(): void {
    this.loadData();
  }

  refresh(): void {
    this.loadData();
  }

  private loadData(): void {
    this.service
      .getOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.overview = data;
        this.lastUpdatedChange.emit(new Date());
        this.cdr.markForCheck();
      });

    this.service
      .getTimeSeries(30)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.timeSeries = data;
        this.cdr.markForCheck();
      });

    this.service.getFailures().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.failures = data;
      this.cdr.markForCheck();
    });
  }
}
