import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { AIChatbotComponent } from '../ai-chatbot/ai-chatbot.component';
import { SocialChatPanelComponent } from './social-chat-panel/social-chat-panel.component';

export type ChatTab = 'ia' | 'social';

@Component({
  selector: 'app-unified-chat-shell',
  standalone: true,
  imports: [CommonModule, AIChatbotComponent, SocialChatPanelComponent],
  template: `
    <div class="flex h-full flex-col overflow-hidden bg-[var(--portal-bg)]">
      <!-- Tab bar -->
      <div class="flex border-b border-[var(--portal-border)] bg-[var(--portal-surface-strong)]">
        <button
          type="button"
          (click)="activeTab = 'ia'"
          class="relative flex-1 py-2.5 text-center text-xs font-semibold transition-colors"
          [ngClass]="activeTab === 'ia'
            ? 'text-[var(--guide-accent)]'
            : 'text-[var(--portal-text-muted)] hover:text-[var(--portal-text)]'"
        >
          <span class="inline-flex items-center gap-1.5">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>
            </svg>
            Asistente IA
          </span>
          <span
            *ngIf="activeTab === 'ia'"
            class="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[var(--guide-accent)]"
          ></span>
        </button>
        <button
          type="button"
          (click)="activeTab = 'social'"
          class="relative flex-1 py-2.5 text-center text-xs font-semibold transition-colors"
          [ngClass]="activeTab === 'social'
            ? 'text-[var(--guide-accent)]'
            : 'text-[var(--portal-text-muted)] hover:text-[var(--portal-text)]'"
        >
          <span class="inline-flex items-center gap-1.5">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
            </svg>
            Personas
            <span
              *ngIf="unreadSocialCount > 0"
              class="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white"
            >{{ unreadSocialCount > 9 ? '9+' : unreadSocialCount }}</span>
          </span>
          <span
            *ngIf="activeTab === 'social'"
            class="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[var(--guide-accent)]"
          ></span>
        </button>
      </div>

      <!-- Tab content -->
      <div class="relative flex-1 overflow-hidden">
        <div
          class="absolute inset-0 transition-transform duration-200 ease-out"
          [style.transform]="activeTab === 'ia' ? 'translateX(0)' : 'translateX(-100%)'"
        >
          <app-ai-chatbot (close)="close.emit()"></app-ai-chatbot>
        </div>
        <div
          class="absolute inset-0 transition-transform duration-200 ease-out"
          [style.transform]="activeTab === 'social' ? 'translateX(0)' : 'translateX(100%)'"
        >
          <app-social-chat-panel></app-social-chat-panel>
        </div>
      </div>
    </div>
  `,
})
export class UnifiedChatShellComponent {
  @Output() close = new EventEmitter<void>();
  @Input() unreadSocialCount = 0;

  activeTab: ChatTab = 'ia';
}
