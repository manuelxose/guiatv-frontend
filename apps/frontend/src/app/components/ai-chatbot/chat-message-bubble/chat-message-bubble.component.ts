import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotRecommendation, ChatMessage } from '../../../interfaces/chatbot.interface';
import { ChatRecommendationListComponent } from '../chat-recommendation-list/chat-recommendation-list.component';
import { ChatSuggestionChipsComponent } from '../chat-suggestion-chips/chat-suggestion-chips.component';
import { ChatCommunityChooserComponent } from '../chat-community-chooser/chat-community-chooser.component';
import { MarkdownPipe } from '../../../pipes/markdown.pipe';
import { AffiliateCTAComponent } from '../../affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '../../affiliate-disclosure/affiliate-disclosure.component';

@Component({
  selector: 'app-chat-message-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ChatRecommendationListComponent,
    ChatSuggestionChipsComponent,
    ChatCommunityChooserComponent,
    MarkdownPipe,
    AffiliateCTAComponent,
    AffiliateDisclosureComponent,
  ],
  template: `
    <div
      class="flex"
      [class.justify-end]="message.role === 'user'"
      [class.justify-start]="message.role !== 'user'"
    >
      <div [class]="outerWidthClass">
        <div
          class="rounded-[1.4rem]"
          [ngClass]="bubbleClasses"
        >
          <!-- Loading / Thinking state -->
          <ng-container *ngIf="(message.isLoading && !message.isStreaming) || message.isThinking; else contentBlock">
            <div class="flex items-center gap-2 py-1">
              <span class="h-2 w-2 rounded-full bg-[var(--portal-text-muted)] animate-[pulse_1.2s_ease-in-out_infinite]"></span>
              <span class="h-2 w-2 rounded-full bg-[var(--portal-text-muted)] animate-[pulse_1.2s_ease-in-out_infinite_0.15s]"></span>
              <span class="h-2 w-2 rounded-full bg-[var(--portal-text-muted)] animate-[pulse_1.2s_ease-in-out_infinite_0.3s]"></span>
              <span *ngIf="message.isThinking" class="ml-1 text-xs text-[var(--portal-text-muted)]">Analizando la parrilla…</span>
            </div>
          </ng-container>

          <!-- Message content -->
          <ng-template #contentBlock>
            <!-- User message: plain text -->
            <p
              *ngIf="message.role === 'user'"
              class="whitespace-pre-line text-sm leading-relaxed break-words"
            >{{ message.content }}</p>

            <!-- Assistant message: rendered immediately; only genuine SSE tokens stream. -->
            <div
              *ngIf="message.role === 'assistant'"
              #contentEl
              class="chat-prose text-sm leading-relaxed break-words"
              [innerHTML]="displayContent | markdown"
            ></div>

            <!-- Blinking cursor only while genuine server streaming is active. -->
            <span
              *ngIf="message.isStreaming"
              class="inline-block h-4 w-[2px] translate-y-[2px] animate-[blink_0.8s_step-end_infinite] bg-slate-300"
            ></span>

            <!-- Recommendations -->
            <app-chat-recommendation-list
              *ngIf="!message.isStreaming && message.recommendations?.length"
              [recommendations]="message.recommendations!"
              [moreRecommendations]="message.moreRecommendations || []"
              [queryContext]="message.queryContext"
              [resultSummary]="resultSummary"
              (openDetail)="openDetail.emit($event)"
              (save)="save.emit($event)"
              (followUp)="followUp.emit($event)"
              (ignore)="ignore.emit($event)"
              (ratePositive)="ratePositive.emit($event)"
              (rateNegative)="rateNegative.emit($event)"
              (remind)="remind.emit($event)"
            />

            <div *ngIf="!message.isStreaming && message.matches?.length" class="mt-3 grid gap-2" aria-label="Partidos de fútbol">
              <div
                *ngFor="let match of message.matches"
                class="overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] transition-colors hover:border-[var(--accent-live)]"
              >
                <a
                  [href]="match.detailPath"
                  class="block p-3 text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-live)]"
                >
                  <div class="flex items-center justify-between gap-3 text-[11px] text-[var(--portal-text-muted)]">
                    <span>{{ match.competition }}</span>
                    <time [attr.datetime]="match.kickoffAt">{{ match.kickoffAt | date:'HH:mm' }}</time>
                  </div>
                  <div class="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm font-semibold">
                    <span>{{ match.homeTeam }}</span><span>{{ match.homeScore ?? '–' }}</span>
                    <span>{{ match.awayTeam }}</span><span>{{ match.awayScore ?? '–' }}</span>
                  </div>
                  <p class="mt-2 text-xs text-[var(--portal-text-muted)]">
                    {{ match.broadcasters.length ? 'Dónde ver: ' + match.broadcasters[0].name : 'Emisión por confirmar' }}
                  </p>
                </a>
                <!-- Affiliate CTA — resolved server-side, outside the detail link (no nested anchors) -->
                <div
                  *ngIf="match.broadcasters[0]?.affiliateActions?.[0] as offer"
                  class="flex items-center justify-end border-t border-[var(--portal-border)]/50 px-3 py-2"
                >
                  <app-affiliate-cta
                    [cta]="{ label: offer.label, sponsored: offer.sponsored }"
                    [href]="offer.outboundPath"
                    variant="secondary"
                  ></app-affiliate-cta>
                </div>
              </div>
              <app-affiliate-disclosure
                *ngIf="hasFootballAffiliateOffer"
                [compact]="true"
              ></app-affiliate-disclosure>
            </div>

            <!-- Autonomic community chooser -->
            <app-chat-community-chooser
              *ngIf="!message.isStreaming && showAutonomicPrompt"
              [savedCommunity]="savedCommunity"
              [promptText]="autonomicPromptText"
              [communities]="autonomousCommunities"
              (useSaved)="useSavedCommunity.emit()"
              (communitySelected)="communitySelected.emit($event)"
              (declined)="autonomicsDeclined.emit()"
            />

            <!-- Follow-up suggestions -->
            <app-chat-suggestion-chips
              *ngIf="!message.isStreaming && message.id !== 'welcome'"
              [suggestions]="filteredSuggestions"
              (selected)="suggestionSelected.emit($event)"
            />

            <!-- Feedback thumbs (assistant only, after typing complete) -->
            <div
              *ngIf="!message.isStreaming && message.role === 'assistant' && message.id !== 'welcome' && !message.isLoading"
              class="flex items-center gap-1 mt-2 pt-1.5 border-t border-[var(--portal-border)]/40"
            >
              <span class="text-[10px] text-[var(--portal-text-muted)] mr-1">¿Útil?</span>
              <button
                type="button"
                (click)="feedbackPositive.emit(message)"
                class="flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--guide-accent)]"
                [ngClass]="message.feedback?.rating === 'positive'
                  ? 'text-green-400 bg-green-500/15'
                  : 'text-[var(--portal-text-muted)] hover:text-green-400 hover:bg-green-500/10'"
                [disabled]="!!message.feedback"
                aria-label="Útil"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                </svg>
              </button>
              <button
                type="button"
                (click)="feedbackNegative.emit(message)"
                class="flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--guide-accent)]"
                [ngClass]="message.feedback?.rating === 'negative'
                  ? 'text-red-400 bg-red-500/15'
                  : 'text-[var(--portal-text-muted)] hover:text-red-400 hover:bg-[var(--accent-live-soft)]'"
                [disabled]="!!message.feedback"
                aria-label="No útil"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                </svg>
              </button>
            </div>
          </ng-template>
        </div>

        <!-- Relative timestamp -->
        <p
          *ngIf="!message.isLoading && message.timestamp"
          class="mt-1 text-[10px] text-[var(--portal-text-faint)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          [class.text-right]="message.role === 'user'"
        >
          {{ relativeTime }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .assistant-bubble {
      border-color: var(--assistant-card-border);
      background: var(--assistant-bubble-bg);
      color: var(--portal-text);
    }

    /* Typewriter cursor blink */
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* Markdown prose styles for assistant messages */
    :host ::ng-deep .chat-prose {
      overflow-wrap: break-word;
      word-break: break-word;

      p { margin-bottom: 0.5rem; }
      p:last-child { margin-bottom: 0; }

      strong, b { font-weight: 700; color: var(--portal-text); }
      em, i { font-style: italic; }

      h1, h2, h3, h4 {
        font-weight: 700;
        color: var(--portal-text);
        margin-top: 0.75rem;
        margin-bottom: 0.25rem;
      }
      h1 { font-size: 1.125rem; }
      h2 { font-size: 1rem; }
      h3 { font-size: 0.9375rem; }

      ul, ol {
        padding-left: 1.25rem;
        margin-top: 0.25rem;
        margin-bottom: 0.5rem;
      }
      ul { list-style-type: disc; }
      ol { list-style-type: decimal; }
      li { margin-bottom: 0.125rem; }

      a {
        color: var(--accent-live);
        text-decoration: underline;
        text-underline-offset: 2px;
        overflow-wrap: anywhere;
        &:hover { opacity: 0.85; }
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
        background: var(--portal-surface-strong);
        border: 1px solid var(--portal-border);
        border-radius: 0.375rem;
        padding: 0.125rem 0.375rem;
        color: var(--portal-text);
        overflow-wrap: anywhere;
      }

      pre {
        background: var(--portal-bg-deep);
        border: 1px solid var(--portal-border);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        overflow-x: auto;
        margin: 0.5rem 0;
        code {
          background: transparent;
          border: none;
          padding: 0;
        }
      }

      blockquote {
        border-radius: 0.75rem;
        background: var(--portal-surface-strong);
        padding: 0.65rem 0.75rem;
        margin: 0.5rem 0;
        color: var(--portal-text-muted);
        font-style: italic;
      }
    }
  `],
})
export class ChatMessageBubbleComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) message!: ChatMessage;
  @Input() resultSummary = '';
  @Input() filteredSuggestions: string[] = [];
  @Input() showAutonomicPrompt = false;
  @Input() savedCommunity: string | null = null;
  @Input() autonomicPromptText = '';
  @Input() autonomousCommunities: string[] = [];

  @Output() openDetail = new EventEmitter<ChatbotRecommendation>();
  @Output() save = new EventEmitter<ChatbotRecommendation>();
  @Output() followUp = new EventEmitter<ChatbotRecommendation>();
  @Output() ignore = new EventEmitter<ChatbotRecommendation>();
  @Output() ratePositive = new EventEmitter<ChatbotRecommendation>();
  @Output() rateNegative = new EventEmitter<ChatbotRecommendation>();
  @Output() suggestionSelected = new EventEmitter<string>();
  @Output() useSavedCommunity = new EventEmitter<void>();
  @Output() communitySelected = new EventEmitter<string>();
  @Output() autonomicsDeclined = new EventEmitter<void>();
  @Output() revealComplete = new EventEmitter<void>();
  @Output() feedbackPositive = new EventEmitter<ChatMessage>();
  @Output() feedbackNegative = new EventEmitter<ChatMessage>();
  @Output() remind = new EventEmitter<ChatbotRecommendation>();

  displayContent = '';
  relativeTime = '';

  get hasFootballAffiliateOffer(): boolean {
    return (this.message.matches || []).some((match) => match.broadcasters[0]?.affiliateActions?.[0]?.sponsored);
  }

  // Recommendation-bearing messages get the full available panel width (cards
  // need the room, see chat-recommendation-list); plain-text messages keep
  // the narrower cap so reading line length doesn't regress on a wide panel.
  get outerWidthClass(): string {
    return this.message.recommendations?.length
      ? 'group w-full md:max-w-[96%] min-w-0'
      : 'group max-w-[94%] md:max-w-[88%] min-w-0';
  }

  get bubbleClasses(): string {
    const role = this.message.role === 'user'
      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md'
      : 'assistant-bubble border shadow-sm';
    // Recommendation cards/list already re-pad their own content internally,
    // so the bubble's own padding can shrink to avoid stacking two paddings.
    const padding = this.message.recommendations?.length ? 'px-3 py-3' : 'px-4 py-3';
    return `${role} ${padding}`;
  }

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.updateContent();
      this.updateRelativeTime();
      this.startTimestampTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private updateContent(): void {
    const msg = this.message;
    if (!msg || (msg.isLoading && !msg.isStreaming)) {
      this.displayContent = '';
      return;
    }
    this.displayContent = msg.content;
  }

  private startTimestampTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => this.updateRelativeTime(), 30_000);
  }

  private updateRelativeTime(): void {
    if (!this.message?.timestamp) {
      this.relativeTime = '';
      return;
    }

    const now = Date.now();
    const then = new Date(this.message.timestamp).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 10) {
      this.relativeTime = 'ahora';
    } else if (diffSec < 60) {
      this.relativeTime = `hace ${diffSec}s`;
    } else if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      this.relativeTime = `hace ${minutes} min`;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      this.relativeTime = `hace ${hours}h`;
    } else {
      const date = new Date(this.message.timestamp);
      this.relativeTime = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  }
}
