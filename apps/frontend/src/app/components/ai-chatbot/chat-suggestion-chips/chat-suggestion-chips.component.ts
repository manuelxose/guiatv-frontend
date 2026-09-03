import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-suggestion-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="suggestions.length" class="mt-3 flex flex-wrap gap-2">
      <button
        *ngFor="let suggestion of suggestions; trackBy: trackByText"
        type="button"
        (click)="selected.emit(suggestion)"
        class="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3.5 text-xs text-[var(--portal-text)] transition-colors hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]"
      >
        {{ suggestion }}
      </button>
    </div>
  `,
})
export class ChatSuggestionChipsComponent {
  @Input() suggestions: string[] = [];
  @Output() selected = new EventEmitter<string>();

  trackByText(_index: number, value: string): string {
    return value;
  }
}
