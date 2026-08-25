import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChatbotQueryContext } from '../../../interfaces/chatbot.interface';

@Component({
  selector: 'app-chat-context-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex min-h-7 max-w-full items-center truncate rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
      [ngClass]="badgeClasses"
    >
      {{ label }}
    </span>
  `,
})
export class ChatContextBadgeComponent {
  @Input() queryContext?: ChatbotQueryContext;

  get mode(): string {
    return this.queryContext?.mode || 'general';
  }

  get badgeClasses(): string {
    switch (this.mode) {
      case 'tv_now':
        return 'border-[var(--assistant-badge-border)] bg-[var(--assistant-badge-bg)] text-[var(--assistant-badge-text)]';
      case 'tv_tonight':
        return 'border-[var(--assistant-badge-border)] bg-[var(--assistant-badge-bg)] text-[var(--assistant-badge-text)]';
      default:
        return 'border-[var(--assistant-badge-border)] bg-[var(--assistant-badge-bg)] text-[var(--assistant-badge-text)]';
    }
  }

  get label(): string {
    switch (this.queryContext?.mode) {
      case 'tv_now':
        return 'Ahora';
      case 'tv_tonight':
        return 'Esta noche';
      case 'streaming':
        return 'Streaming';
      default:
        return 'Asistente';
    }
  }
}
