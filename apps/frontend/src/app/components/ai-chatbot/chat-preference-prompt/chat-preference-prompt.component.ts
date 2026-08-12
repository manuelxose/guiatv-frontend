import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-preference-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-3 rounded-2xl border border-[var(--portal-border)]/80 bg-[var(--portal-bg)] p-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--portal-text-muted)]">
            Para afinar mejor
          </p>
          <p class="mt-1 text-sm text-[var(--portal-text)]">{{ promptText }}</p>
        </div>
        <button
          type="button"
          (click)="dismissed.emit()"
          class="min-h-[32px] rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg-deep)]/80 px-3 text-[11px] font-semibold text-[var(--portal-text)] transition-colors hover:border-slate-500"
        >
          Más tarde
        </button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          *ngFor="let option of options; trackBy: trackByText"
          type="button"
          (click)="optionSelected.emit(option)"
          class="min-h-[34px] rounded-full border border-[var(--portal-border)] bg-[var(--portal-bg)] px-3 text-xs font-medium text-[var(--portal-text)] transition-colors hover:border-slate-500 hover:text-[var(--portal-text)]"
        >
          {{ option }}
        </button>
      </div>
    </div>
  `,
})
export class ChatPreferencePromptComponent {
  @Input() promptText = '';
  @Input() options: string[] = [];
  @Output() optionSelected = new EventEmitter<string>();
  @Output() dismissed = new EventEmitter<void>();

  trackByText(_index: number, value: string): string {
    return value;
  }
}
