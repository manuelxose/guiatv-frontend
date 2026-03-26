import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChatbotQueryContext,
  ChatbotRecommendation,
} from '../../../interfaces/chatbot.interface';
import { ChatContextBadgeComponent } from '../chat-context-badge/chat-context-badge.component';
import { ChatRecommendationCardComponent } from '../chat-recommendation-card/chat-recommendation-card.component';

interface RecommendationGroup {
  label: string;
  items: ChatbotRecommendation[];
}

type ExpandState = 'compact' | 'partial' | 'full';

@Component({
  selector: 'app-chat-recommendation-list',
  standalone: true,
  imports: [CommonModule, ChatContextBadgeComponent, ChatRecommendationCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4 rounded-[1.4rem] border border-slate-800/90 bg-slate-950/70 p-3 md:p-5">
      <!-- Header: badge + summary + controls -->
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <app-chat-context-badge [queryContext]="queryContext" />
          <span *ngIf="dynamicSummary" class="text-[11px] font-medium text-slate-400">
            {{ dynamicSummary }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- List / Carousel toggle -->
          <button
            *ngIf="allRecommendations.length > 2"
            type="button"
            (click)="carouselMode = !carouselMode"
            class="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
            [attr.aria-label]="carouselMode ? 'Vista lista' : 'Vista carrusel'"
          >
            <svg *ngIf="!carouselMode" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <svg *ngIf="carouselMode" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Expand controls -->
          <ng-container>
            <!-- Compact → Partial: always "Ver N más" -->
            <button
              *ngIf="expandState === 'compact' && moreRecommendations.length > 0"
              type="button"
              (click)="expandState = 'partial'"
              class="min-h-[28px] rounded-full border border-red-500/30 bg-red-500/10 px-3 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
            >
              Ver {{ firstBatchSize }} más
            </button>

            <!-- Partial → Full: when loaded items < context total -->
            <button
              *ngIf="expandState === 'partial' && hasMoreBeyondLoaded"
              type="button"
              (click)="expandState = 'full'"
              class="min-h-[28px] rounded-full border border-violet-500/30 bg-violet-500/10 px-3 text-[10px] font-semibold text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200"
            >
              Ver todos ({{ allRecommendations.length - visibleItems.length }} más)
            </button>

            <!-- Collapse button only in full state -->
            <button
              *ngIf="expandState === 'full'"
              type="button"
              (click)="expandState = 'compact'"
              class="min-h-[28px] rounded-full border border-slate-700 bg-slate-800/60 px-3 text-[10px] font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
            >
              Ver menos
            </button>
          </ng-container>
        </div>
      </div>

      <!-- Carousel mode -->
      <div *ngIf="carouselMode; else listMode">
        <ng-container *ngFor="let group of groups; trackBy: trackByGroup">
          <p
            *ngIf="groups.length > 1"
            class="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 first:mt-0"
          >
            {{ group.label }}
          </p>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50">
            <div
              *ngFor="let rec of group.items; trackBy: trackByRec"
              class="w-[280px] flex-shrink-0 md:w-[300px]"
            >
              <app-chat-recommendation-card
                [recommendation]="rec"
                (openDetail)="openDetail.emit($event)"
                (save)="save.emit($event)"
                (followUp)="followUp.emit($event)"
                (ignore)="ignore.emit($event)"
                (ratePositive)="ratePositive.emit($event)"
                (rateNegative)="rateNegative.emit($event)"
                (remind)="remind.emit($event)"
              />
            </div>
          </div>
        </ng-container>
      </div>

      <!-- List mode -->
      <ng-template #listMode>
        <ng-container *ngFor="let group of groups; trackBy: trackByGroup">
          <p
            *ngIf="groups.length > 1"
            class="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 first:mt-0"
          >
            {{ group.label }}
          </p>
          <div class="space-y-2.5">
            <app-chat-recommendation-card
              *ngFor="let rec of group.items; trackBy: trackByRec"
              [recommendation]="rec"
              (openDetail)="openDetail.emit($event)"
              (save)="save.emit($event)"
              (followUp)="followUp.emit($event)"
              (ignore)="ignore.emit($event)"
              (ratePositive)="ratePositive.emit($event)"
              (rateNegative)="rateNegative.emit($event)"
              (remind)="remind.emit($event)"
            />
          </div>
        </ng-container>
      </ng-template>
    </div>
  `,
})
export class ChatRecommendationListComponent {
  @Input() recommendations: ChatbotRecommendation[] = [];
  @Input() moreRecommendations: ChatbotRecommendation[] = [];
  @Input() queryContext?: ChatbotQueryContext;
  @Input() resultSummary = '';

  @Output() openDetail = new EventEmitter<ChatbotRecommendation>();
  @Output() save = new EventEmitter<ChatbotRecommendation>();
  @Output() followUp = new EventEmitter<ChatbotRecommendation>();
  @Output() ignore = new EventEmitter<ChatbotRecommendation>();
  @Output() ratePositive = new EventEmitter<ChatbotRecommendation>();
  @Output() rateNegative = new EventEmitter<ChatbotRecommendation>();
  @Output() remind = new EventEmitter<ChatbotRecommendation>();

  private readonly platformId = inject(PLATFORM_ID);

  expandState: ExpandState = 'compact';
  carouselMode = isPlatformBrowser(this.platformId) && window.innerWidth < 768;

  /** Dynamic summary reflecting how many items are currently visible vs total from queryContext. */
  get dynamicSummary(): string {
    const total = this.queryContext?.primaryMatches || this.queryContext?.totalMatches || 0;
    const shown = this.visibleItems.length;
    const windowLabel = this.queryContext?.answerWindowLabel || '';
    if (!total && !this.resultSummary) return '';
    if (!total) return this.resultSummary;
    return `${shown} de ${total} resultados${windowLabel ? ' · ' + windowLabel : ''}`;
  }

  get allRecommendations(): ChatbotRecommendation[] {
    return [...this.recommendations, ...this.moreRecommendations];
  }

  /** Size of the first expansion batch (capped at 9). */
  get firstBatchSize(): number {
    return Math.min(9, this.moreRecommendations.length);
  }

  /** Total results reported by the backend context (may exceed loaded items). */
  get totalFromContext(): number {
    return this.queryContext?.primaryMatches || this.queryContext?.totalMatches || this.allRecommendations.length;
  }

  /** True when there are loaded items beyond what's currently visible (partial state). */
  get hasMoreBeyondLoaded(): boolean {
    return this.allRecommendations.length > this.visibleItems.length;
  }

  /** Items currently visible based on expand state. */
  get visibleItems(): ChatbotRecommendation[] {
    if (this.expandState === 'compact') return this.recommendations;
    if (this.expandState === 'partial') {
      return [...this.recommendations, ...this.moreRecommendations.slice(0, 9)];
    }
    return this.allRecommendations;
  }

  get groups(): RecommendationGroup[] {
    const all = this.visibleItems;

    if (all.length <= 3) return [{ label: '', items: all }];

    const liveItems = all.filter((r) => r.liveNow);
    const tvItems = all.filter((r) => !r.liveNow && r.type === 'program');
    const vodItems = all.filter((r) => !r.liveNow && r.type !== 'program');

    const groups: RecommendationGroup[] = [];
    if (liveItems.length) groups.push({ label: 'En directo ahora', items: liveItems });
    if (tvItems.length) groups.push({ label: 'Televisión', items: tvItems });
    if (vodItems.length) groups.push({ label: 'Streaming / VOD', items: vodItems });

    if (groups.length <= 1) return [{ label: '', items: all }];
    return groups;
  }

  trackByRec(_index: number, rec: ChatbotRecommendation): string {
    return [
      rec.catalogId || rec.detailPath || '',
      rec.title,
      rec.channelOrPlatform || rec.channel || rec.platform || '',
      rec.startTime || rec.time || '',
    ]
      .filter(Boolean)
      .join('::');
  }

  trackByGroup(_index: number, group: RecommendationGroup): string {
    return group.label;
  }
}
