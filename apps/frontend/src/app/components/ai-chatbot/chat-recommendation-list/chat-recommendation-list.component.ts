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

@Component({
  selector: 'app-chat-recommendation-list',
  standalone: true,
  imports: [CommonModule, ChatContextBadgeComponent, ChatRecommendationCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4 rounded-[1.4rem] border border-slate-800/90 bg-slate-950/70 p-3 md:p-4">
      <!-- Header: badge + summary + toggle + view mode -->
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <app-chat-context-badge [queryContext]="queryContext" />
          <span *ngIf="resultSummary" class="text-[11px] font-medium text-slate-400">
            {{ resultSummary }}
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
          <!-- Expand toggle -->
          <button
            *ngIf="hiddenCount > 0 && !carouselMode"
            type="button"
            (click)="toggleExpanded()"
            class="min-h-[28px] rounded-full border border-red-500/30 bg-red-500/10 px-3 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
          >
            {{ expanded ? 'Ver menos' : 'Ver ' + hiddenCount + ' más' }}
          </button>
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
          <div
            class="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50"
          >
            <div
              *ngFor="let rec of group.items; trackBy: trackByRec"
              class="w-[260px] flex-shrink-0 md:w-[280px]"
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
      <ng-template #listMode>
        <ng-container *ngFor="let group of groups; trackBy: trackByGroup">
          <p
            *ngIf="groups.length > 1"
            class="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 first:mt-0"
          >
            {{ group.label }}
          </p>
          <div class="space-y-2">
            <app-chat-recommendation-card
              *ngFor="let rec of (expanded ? group.items : group.items | slice:0:maxPerGroup); trackBy: trackByRec"
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

  expanded = false;
  carouselMode = false;

  get allRecommendations(): ChatbotRecommendation[] {
    return [...this.recommendations, ...this.moreRecommendations];
  }

  get hiddenCount(): number {
    return this.moreRecommendations.length;
  }

  get maxPerGroup(): number {
    return Math.max(3, this.recommendations.length);
  }

  get groups(): RecommendationGroup[] {
    const all = this.expanded
      ? this.allRecommendations
      : this.recommendations;

    if (all.length <= 3) return [{ label: '', items: all }];

    const liveItems = all.filter((r) => r.liveNow);
    const tvItems = all.filter((r) => !r.liveNow && r.type === 'program');
    const vodItems = all.filter(
      (r) => !r.liveNow && r.type !== 'program'
    );

    const groups: RecommendationGroup[] = [];
    if (liveItems.length) groups.push({ label: 'En directo ahora', items: liveItems });
    if (tvItems.length) groups.push({ label: 'Televisión', items: tvItems });
    if (vodItems.length) groups.push({ label: 'Streaming / VOD', items: vodItems });

    if (groups.length <= 1) return [{ label: '', items: all }];
    return groups;
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
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
