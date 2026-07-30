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
        class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
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
