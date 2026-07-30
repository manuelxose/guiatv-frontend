import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantMemorySnapshot, MemoryEditorField } from '../../../interfaces/chatbot.interface';

@Component({
  selector: 'app-chat-memory-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mt-3 max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-950/80 p-3">
      <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Preferencias IA
      </p>

      <div *ngFor="let field of fields; trackBy: trackByKey" class="space-y-1">
        <label class="text-[11px] font-medium text-slate-300">{{ field.label }}</label>
        <div class="flex flex-wrap gap-1.5">
          <span
            *ngFor="let val of getValues(field.key); trackBy: trackByText"
            class="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200"
          >
            {{ val }}
            <button
              type="button"
              (click)="removeValue(field.key, val)"
              class="ml-0.5 text-slate-500 hover:text-red-400"
              aria-label="Eliminar"
            >×</button>
          </span>
          <input
            type="text"
            [placeholder]="field.placeholder"
            class="w-24 rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] text-white outline-none placeholder:text-slate-600 focus:border-red-500/50"
            (keydown.enter)="addValue(field.key, $event)"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button
          type="button"
          (click)="saveEdits()"
          [disabled]="saving"
          class="rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
        <button
          type="button"
          (click)="cancelled.emit()"
          class="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  `,
})
export class ChatMemoryEditorComponent {
  @Input() memory: AssistantMemorySnapshot | null = null;
  @Input() fields: MemoryEditorField[] = [];
  @Output() saved = new EventEmitter<Record<string, string[]>>();
  @Output() cancelled = new EventEmitter<void>();

  saving = false;
  draft: Record<string, string[]> = {};
  private initialized = false;

  ngOnChanges(): void {
    if (!this.initialized && this.memory) {
      this.resetDraft();
      this.initialized = true;
    }
  }

  ngOnInit(): void {
    this.resetDraft();
  }

  getValues(key: string): string[] {
    return this.draft[key] || [];
  }

  addValue(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    if (!this.draft[key]) this.draft[key] = [];
    if (this.draft[key].length >= 10) return;
    if (!this.draft[key].includes(value)) {
      this.draft[key] = [...this.draft[key], value];
    }
    input.value = '';
  }

  removeValue(key: string, value: string): void {
    if (!this.draft[key]) return;
    this.draft[key] = this.draft[key].filter((v) => v !== value);
  }

  saveEdits(): void {
    if (this.saving) return;
    this.saving = true;
    this.saved.emit({ ...this.draft });
  }

  /** Called by parent when save completes. */
  onSaveComplete(): void {
    this.saving = false;
  }

  trackByKey(_index: number, field: MemoryEditorField): string {
    return field.key;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }

  private resetDraft(): void {
    this.draft = {};
    for (const field of this.fields) {
      this.draft[field.key] = [
        ...((this.memory as any)?.[field.key] || []),
      ];
    }
  }
}
