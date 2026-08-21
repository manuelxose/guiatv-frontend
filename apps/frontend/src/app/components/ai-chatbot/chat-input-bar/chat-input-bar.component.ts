import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatbotRequestState, ChatbotSessionState } from '../../../interfaces/chatbot.interface';

@Component({
  selector: 'app-chat-input-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="space-y-1.5">
      <div class="flex items-end gap-2 rounded-[1.35rem] border bg-[var(--portal-bg)] p-2 shadow-[var(--shadow-lg)]" [ngClass]="isSearchMode ? 'border-blue-500/60' : 'border-[var(--portal-border)]'">
        <textarea
          #chatInput
          [(ngModel)]="draft"
          rows="1"
          (keydown)="onKeydown($event)"
          (input)="autoResize()"
          [disabled]="disabled"
          class="max-h-[160px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-[var(--portal-text)] outline-none placeholder:text-[var(--portal-text-muted)]"
          [placeholder]="isSearchMode ? 'Buscando contenido...' : 'Pregúntame qué hay ahora, qué merece la pena esta noche…'"
        ></textarea>
        <button
          type="button"
          (click)="send()"
          [disabled]="disabled || !draft.trim()"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          aria-label="Enviar mensaje"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      <!-- Quick actions row -->
      <div class="flex items-center justify-between px-2">
        <div class="flex gap-1">
          <button
            *ngFor="let action of quickActions"
            type="button"
            (click)="onQuickAction(action)"
            [disabled]="disabled"
            class="rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg)] px-2.5 py-1 text-[11px] text-[var(--portal-text-muted)] transition-colors hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)] disabled:opacity-40"
          >
            {{ action.label }}
          </button>
        </div>
        <span class="text-[10px] text-[var(--portal-text-faint)]">Shift+Enter para salto de línea</span>
      </div>
    </div>
  `,
})
export class ChatInputBarComponent implements AfterViewInit {
  @Input() sessionState: ChatbotSessionState = 'unknown';
  @Input() chatState: ChatbotRequestState = 'idle';
  @Output() messageSent = new EventEmitter<string>();

  @ViewChild('chatInput') chatInput?: ElementRef<HTMLTextAreaElement>;

  draft = '';

  readonly quickActions = [
    { label: '📺 ¿Qué hay ahora?', prompt: '¿Qué puedo ver ahora mismo en televisión?' },
    { label: '⭐ Lo mejor hoy', prompt: '¿Qué es lo mejor que puedo ver hoy?' },
    { label: '🎬 Películas', prompt: '¿Qué películas echan hoy en televisión?' },
    { label: '🔍 Buscar', prompt: '/buscar ' },
  ];

  get disabled(): boolean {
    return this.sessionState !== 'authenticated' || this.chatState === 'sending';
  }

  get isSearchMode(): boolean {
    return this.draft.trimStart().toLowerCase().startsWith('/buscar ');
  }

  ngAfterViewInit(): void {
    this.autoResize();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.disabled) return;
    this.draft = '';
    this.resetTextareaHeight();

    // /buscar command: strip prefix and emit as search
    if (text.toLowerCase().startsWith('/buscar ')) {
      const query = text.slice(8).trim();
      if (query) {
        this.messageSent.emit(`Busca contenido: ${query}`);
      }
      return;
    }

    this.messageSent.emit(text);
  }

  onQuickAction(action: { label: string; prompt: string }): void {
    // If action starts with /, set draft instead of sending
    if (action.prompt.startsWith('/')) {
      this.setDraft(action.prompt);
      return;
    }
    this.messageSent.emit(action.prompt);
  }

  /** Set draft text from outside (e.g. suggestion chips). */
  setDraft(text: string): void {
    this.draft = text;
    queueMicrotask(() => {
      this.chatInput?.nativeElement.focus();
      this.autoResize();
    });
  }

  focus(): void {
    queueMicrotask(() => this.chatInput?.nativeElement.focus());
  }

  autoResize(): void {
    const el = this.chatInput?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  private resetTextareaHeight(): void {
    const el = this.chatInput?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
  }
}
