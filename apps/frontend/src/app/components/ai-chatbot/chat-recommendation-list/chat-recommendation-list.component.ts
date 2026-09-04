import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    <section class="mt-3" aria-label="Recomendaciones">
      <!-- Header: badge + summary + controls -->
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <app-chat-context-badge [queryContext]="queryContext" />
          <span *ngIf="dynamicSummary" class="text-[11px] font-medium text-[var(--portal-text-muted)]">
            {{ dynamicSummary }}
          </span>
        </div>
      </div>

      <div class="space-y-3">
        <ng-container *ngFor="let group of groups; trackBy: trackByGroup">
          <p
            *ngIf="groups.length > 1"
            class="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--portal-text-muted)] first:mt-0"
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
      </div>

      <div *ngIf="hasMoreBeyondLoaded || expandState !== 'compact'" class="mt-3 flex justify-center">
        <button
          *ngIf="hasMoreBeyondLoaded"
          type="button"
          (click)="showMore()"
          class="min-h-11 w-full rounded-xl border border-[var(--assistant-chip-border)] bg-[var(--assistant-chip-bg)] px-4 text-sm font-bold text-[var(--assistant-chip-text)] transition-colors hover:bg-[var(--assistant-chip-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--guide-accent)]"
        >
          Ver {{ remainingCount }} resultados más
        </button>
        <button
          *ngIf="!hasMoreBeyondLoaded && expandState !== 'compact'"
          type="button"
          (click)="expandState = 'compact'"
          class="min-h-11 rounded-xl px-5 text-sm font-semibold text-[var(--portal-text-muted)] hover:bg-[var(--portal-surface-strong)] hover:text-[var(--portal-text)]"
        >
          Mostrar menos
        </button>
      </div>
    </section>
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

  expandState: ExpandState = 'compact';

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
    if (this.expandState === 'compact') return this.allRecommendations.slice(0, 5);
    if (this.expandState === 'partial') {
      return this.allRecommendations.slice(0, 12);
    }
    return this.allRecommendations;
  }

  get remainingCount(): number {
    return Math.max(0, this.allRecommendations.length - this.visibleItems.length);
  }

  showMore(): void {
    this.expandState = this.expandState === 'compact' && this.allRecommendations.length > 12
      ? 'partial'
      : 'full';
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
