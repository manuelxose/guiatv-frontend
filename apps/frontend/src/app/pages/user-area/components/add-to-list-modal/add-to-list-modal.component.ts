import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-to-list-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70" (click)="onClose()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-lg bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-list-title"
      >
        <div class="px-6 py-4 border-b border-[var(--portal-border)] flex items-center justify-between">
          <h2 id="add-to-list-title" class="text-lg font-semibold text-[var(--portal-text)]">Anadir a la lista</h2>
          <button
            type="button"
            (click)="onClose()"
            class="min-h-[44px] px-3 rounded-lg border border-[var(--portal-border)] text-xs text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div class="p-6">
          <form [formGroup]="addForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
              <label for="list-content-query" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Buscar contenido</label>
              <div class="relative">
                <input
                  type="text"
                  id="list-content-query"
                  formControlName="query"
                  placeholder="Buscar peliculas, series..."
                  class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 pl-10 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-[var(--portal-text-muted)] absolute left-3 top-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p class="text-xs text-[var(--portal-text-muted)]">Escribe un titulo para simular el agregado.</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="list-content-type" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Tipo</label>
                <select
                  id="list-content-type"
                  formControlName="type"
                  class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
                >
                  <option value="movie">Pelicula</option>
                  <option value="series">Serie</option>
                </select>
              </div>
              <div class="space-y-2">
                <label for="list-content-state" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Estado</label>
                <select
                  id="list-content-state"
                  formControlName="state"
                  class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
                >
                  <option value="pending">Pendiente</option>
                  <option value="watching">Viendo</option>
                  <option value="finished">Terminado</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div class="px-6 py-4 border-t border-[var(--portal-border)] flex justify-end gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="min-h-[44px] px-4 rounded-xl border border-[var(--portal-border)] text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="addForm.invalid"
            class="min-h-[44px] px-6 rounded-xl bg-[var(--accent-live)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
          >
            Anadir
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AddToListModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<{ title: string; type: 'movie' | 'series'; state: 'pending' | 'watching' | 'finished' }>();

  addForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addForm = this.fb.group({
      query: ['', Validators.required],
      type: ['movie', Validators.required],
      state: ['pending', Validators.required],
    });
  }

  onClose() {
    this.closeModal.emit();
    this.addForm.reset({ type: 'movie', state: 'pending' });
  }

  onSubmit() {
    if (this.addForm.valid) {
      this.addItem.emit({
        title: this.addForm.value.query,
        type: this.addForm.value.type,
        state: this.addForm.value.state,
      });
      this.onClose();
    }
  }
}
