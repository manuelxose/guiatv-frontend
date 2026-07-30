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
        <h2 class="text-lg font-semibold text-white">AI Chatbot Analytics</h2>
        <button
          type="button"
          (click)="refresh()"
          class="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors"
        >
          Refresh
        </button>
      </div>

      <!-- KPI cards -->
      <div *ngIf="overview" class="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <p class="text-xs text-slate-500 uppercase tracking-wider">Conversations</p>
          <p class="text-3xl font-semibold text-white mt-2">{{ overview.totalConversations }}</p>
          <p class="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <p class="text-xs text-slate-500 uppercase tracking-wider">Messages</p>
          <p class="text-3xl font-semibold text-white mt-2">{{ overview.totalMessages }}</p>
          <p class="text-xs text-slate-500 mt-1">Avg {{ overview.avgMessagesPerConversation }}/conv</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <p class="text-xs text-slate-500 uppercase tracking-wider">Active Today</p>
          <p class="text-3xl font-semibold text-white mt-2">{{ overview.activeUsersToday }}</p>
          <p class="text-xs text-slate-500 mt-1">Week: {{ overview.activeUsersWeek }}</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <p class="text-xs text-slate-500 uppercase tracking-wider">Feedback</p>
          <p class="text-2xl font-semibold mt-2">
            <span class="text-emerald-300">+{{ overview.feedbackSummary.positive }}</span>
            <span class="text-slate-600 mx-1">/</span>
            <span class="text-red-300">-{{ overview.feedbackSummary.negative }}</span>
          </p>
          <p class="text-xs text-slate-500 mt-1">Thumbs up / down</p>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <p class="text-xs text-slate-500 uppercase tracking-wider">Subscriptions</p>
          <p class="text-2xl font-semibold mt-2">
            <span class="text-white">{{ overview.subscriptionBreakdown.free }}</span>
            <span class="text-slate-600 mx-1">/</span>
            <span class="text-amber-300">{{ overview.subscriptionBreakdown.premium }}</span>
          </p>
          <p class="text-xs text-slate-500 mt-1">Free / Premium</p>
        </div>
      </div>

      <!-- Top genres & platforms -->
      <div *ngIf="overview" class="grid md:grid-cols-2 gap-6">
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <h3 class="text-sm font-medium text-slate-300 mb-3">Top Genres</h3>
          <div class="space-y-2">
            <div
              *ngFor="let g of overview.topGenres; let i = index"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-200">{{ i + 1 }}. {{ g.genre }}</span>
              <span class="text-slate-500">{{ g.count }}</span>
            </div>
            <p *ngIf="!overview.topGenres.length" class="text-xs text-slate-600">No genre data yet</p>
          </div>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
          <h3 class="text-sm font-medium text-slate-300 mb-3">Top Platforms</h3>
          <div class="space-y-2">
            <div
              *ngFor="let p of overview.topPlatforms; let i = index"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-200">{{ i + 1 }}. {{ p.platform }}</span>
              <span class="text-slate-500">{{ p.count }}</span>
            </div>
            <p *ngIf="!overview.topPlatforms.length" class="text-xs text-slate-600">No platform data yet</p>
          </div>
        </div>
      </div>

      <!-- Activity timeline (table) -->
      <div *ngIf="timeSeries.length" class="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
        <h3 class="text-sm font-medium text-slate-300 mb-3">Daily Activity (last 30 days)</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-slate-500 border-b border-slate-800">
                <th class="pb-2 pr-4">Date</th>
                <th class="pb-2 pr-4 text-right">Conversations</th>
                <th class="pb-2 text-right">Messages</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let row of timeSeries"
                class="border-b border-slate-800/40 last:border-0"
              >
                <td class="py-1.5 pr-4 text-slate-300">{{ row.date }}</td>
                <td class="py-1.5 pr-4 text-right text-slate-400">{{ row.conversations }}</td>
                <td class="py-1.5 text-right text-slate-400">{{ row.messages }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading / empty -->
      <div *ngIf="!overview" class="flex items-center justify-center py-16">
        <p class="text-sm text-slate-500">Loading AI analytics…</p>
      </div>
    </div>
  `,
})
export class AdminAISectionComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  overview: AIAnalyticsOverview | null = null;
  timeSeries: AIAnalyticsTimeSeries[] = [];

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
  }
}
