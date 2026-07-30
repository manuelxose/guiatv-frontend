import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
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
  ],
  template: `
    <div
      class="flex"
      [class.justify-end]="message.role === 'user'"
      [class.justify-start]="message.role !== 'user'"
    >
      <div class="group max-w-[94%] md:max-w-[88%]">
        <div
          class="rounded-[1.4rem] px-4 py-3"
          [ngClass]="message.role === 'user'
            ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
            : 'border border-slate-800/90 bg-slate-900/96 text-slate-100'"
        >
          <!-- Loading / Thinking state -->
          <ng-container *ngIf="(message.isLoading && !message.isStreaming) || message.isThinking; else contentBlock">
            <div class="flex items-center gap-2 py-1">
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-[pulse_1.2s_ease-in-out_infinite]"></span>
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-[pulse_1.2s_ease-in-out_infinite_0.15s]"></span>
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-[pulse_1.2s_ease-in-out_infinite_0.3s]"></span>
              <span *ngIf="message.isThinking" class="ml-1 text-xs text-slate-400">Analizando la parrilla…</span>
            </div>
          </ng-container>

          <!-- Message content -->
          <ng-template #contentBlock>
            <!-- User message: plain text -->
            <p
              *ngIf="message.role === 'user'"
              class="whitespace-pre-line text-sm leading-relaxed"
            >{{ message.content }}</p>

            <!-- Assistant message: markdown rendered with optional typewriter -->
            <div
              *ngIf="message.role === 'assistant'"
              #contentEl
              class="chat-prose text-sm leading-relaxed"
              [innerHTML]="displayContent | markdown"
            ></div>

            <!-- Blinking cursor during typewriter or streaming -->
            <span
              *ngIf="isTyping || message.isStreaming"
              class="inline-block h-4 w-[2px] translate-y-[2px] animate-[blink_0.8s_step-end_infinite] bg-slate-300"
            ></span>

            <!-- Recommendations -->
            <app-chat-recommendation-list
              *ngIf="!isTyping && !message.isStreaming && message.recommendations?.length"
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

            <!-- Autonomic community chooser -->
            <app-chat-community-chooser
              *ngIf="!isTyping && !message.isStreaming && showAutonomicPrompt"
              [savedCommunity]="savedCommunity"
              [promptText]="autonomicPromptText"
              [communities]="autonomousCommunities"
              (useSaved)="useSavedCommunity.emit()"
              (communitySelected)="communitySelected.emit($event)"
              (declined)="autonomicsDeclined.emit()"
            />

            <!-- Follow-up suggestions -->
            <app-chat-suggestion-chips
              *ngIf="!isTyping && !message.isStreaming && message.id !== 'welcome'"
              [suggestions]="filteredSuggestions"
              (selected)="suggestionSelected.emit($event)"
            />

            <!-- Feedback thumbs (assistant only, after typing complete) -->
            <div
              *ngIf="!isTyping && !message.isStreaming && message.role === 'assistant' && message.id !== 'welcome' && !message.isLoading"
              class="flex items-center gap-1 mt-2 pt-1.5 border-t border-slate-800/40"
            >
              <span class="text-[10px] text-slate-500 mr-1">¿Útil?</span>
              <button
                type="button"
                (click)="feedbackPositive.emit(message)"
                class="p-1 rounded-md transition-colors"
                [ngClass]="message.feedback?.rating === 'positive'
                  ? 'text-green-400 bg-green-500/15'
                  : 'text-slate-500 hover:text-green-400 hover:bg-green-500/10'"
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
                class="p-1 rounded-md transition-colors"
                [ngClass]="message.feedback?.rating === 'negative'
                  ? 'text-red-400 bg-red-500/15'
                  : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'"
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
          class="mt-1 text-[10px] text-slate-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
    }

    /* Typewriter cursor blink */
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* Markdown prose styles for assistant messages */
    :host ::ng-deep .chat-prose {
      p { margin-bottom: 0.5rem; }
      p:last-child { margin-bottom: 0; }

      strong, b { font-weight: 600; color: #f1f5f9; }
      em, i { font-style: italic; }

      h1, h2, h3, h4 {
        font-weight: 700;
        color: #f8fafc;
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
        color: #f87171;
        text-decoration: underline;
        text-underline-offset: 2px;
        &:hover { color: #fca5a5; }
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.8125rem;
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(51, 65, 85, 0.5);
        border-radius: 0.375rem;
        padding: 0.125rem 0.375rem;
      }

      pre {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(51, 65, 85, 0.5);
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
        border-left: 3px solid #ef4444;
        padding-left: 0.75rem;
        margin: 0.5rem 0;
        color: #94a3b8;
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
  isTyping = false;
  relativeTime = '';

  private typewriterRafId = 0;
  private typewriterIdx = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private revealed = new Set<string>();

  constructor(
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.updateContent();
      this.updateRelativeTime();
      this.startTimestampTimer();
    }
  }

  ngOnDestroy(): void {
    this.cancelTypewriter();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private updateContent(): void {
    const msg = this.message;
    if (!msg || (msg.isLoading && !msg.isStreaming)) {
      this.displayContent = '';
      this.isTyping = false;
      return;
    }

    // Streaming messages: show content live, no typewriter
    if (msg.isStreaming) {
      this.displayContent = msg.content;
      this.isTyping = false;
      return;
    }

    // User messages or already-revealed messages: show immediately
    if (msg.role === 'user' || !msg.isNewMessage || this.revealed.has(msg.id)) {
      this.displayContent = msg.content;
      this.isTyping = false;
      return;
    }

    // New assistant message: start typewriter
    this.revealed.add(msg.id);
    this.startTypewriter(msg.content);
  }

  private startTypewriter(fullText: string): void {
    this.cancelTypewriter();
    this.displayContent = '';
    this.isTyping = true;
    this.typewriterIdx = 0;

    const charsPerFrame = Math.max(1, Math.ceil(fullText.length / 60));

    this.zone.runOutsideAngular(() => {
      const step = () => {
        this.typewriterIdx += charsPerFrame;
        if (this.typewriterIdx >= fullText.length) {
          this.typewriterIdx = fullText.length;
          this.displayContent = fullText;
          this.isTyping = false;
          this.typewriterRafId = 0;
          this.zone.run(() => {
            this.cdr.markForCheck();
            this.revealComplete.emit();
          });
          return;
        }

        this.displayContent = fullText.slice(0, this.typewriterIdx);
        this.zone.run(() => this.cdr.markForCheck());
        this.typewriterRafId = requestAnimationFrame(step);
      };

      this.typewriterRafId = requestAnimationFrame(step);
    });
  }

  private cancelTypewriter(): void {
    if (this.typewriterRafId) {
      cancelAnimationFrame(this.typewriterRafId);
      this.typewriterRafId = 0;
    }
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
