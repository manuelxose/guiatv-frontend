import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChatbotQueryContext } from '../../../interfaces/chatbot.interface';

@Component({
  selector: 'app-chat-context-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
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
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
      case 'tv_tonight':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
      default:
        return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
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
