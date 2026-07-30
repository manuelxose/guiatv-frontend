import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-preference-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Para afinar mejor
          </p>
          <p class="mt-1 text-sm text-slate-100">{{ promptText }}</p>
        </div>
        <button
          type="button"
          (click)="dismissed.emit()"
          class="min-h-[32px] rounded-full border border-slate-700 bg-slate-950/80 px-3 text-[11px] font-semibold text-slate-300 transition-colors hover:border-slate-500"
        >
          Más tarde
        </button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          *ngFor="let option of options; trackBy: trackByText"
          type="button"
          (click)="optionSelected.emit(option)"
          class="min-h-[34px] rounded-full border border-slate-700 bg-slate-900/80 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
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
