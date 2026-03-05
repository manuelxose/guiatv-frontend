import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-list-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70" (click)="close()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-list-title"
      >
        <div class="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 id="create-list-title" class="text-lg font-semibold text-white">Nueva lista</h2>
          <button
            type="button"
            (click)="close()"
            class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div class="p-6">
          <form [formGroup]="listForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="space-y-2">
              <label class="text-xs text-slate-400 uppercase tracking-wider">Nombre de la lista</label>
              <input
                type="text"
                formControlName="title"
                class="w-full min-h-[44px] bg-slate-950/60 border border-slate-800 rounded-xl px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                placeholder="Ej. Pelis para llorar"
              />
            </div>

            <div class="space-y-2">
              <label class="text-xs text-slate-400 uppercase tracking-wider">Descripcion (opcional)</label>
              <textarea
                formControlName="description"
                rows="3"
                class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                placeholder="Describe la intencion de esta lista"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-xs text-slate-400 uppercase tracking-wider">Visibilidad</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="cursor-pointer">
                  <input type="radio" formControlName="visibility" value="public" class="sr-only peer" />
                  <div class="text-center p-2 rounded-lg border border-slate-800 bg-slate-950/60 peer-checked:border-red-500 peer-checked:text-white text-slate-400">
                    <span class="block text-xs font-semibold uppercase">Publico</span>
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" formControlName="visibility" value="friends" class="sr-only peer" />
                  <div class="text-center p-2 rounded-lg border border-slate-800 bg-slate-950/60 peer-checked:border-red-500 peer-checked:text-white text-slate-400">
                    <span class="block text-xs font-semibold uppercase">Amigos</span>
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" formControlName="visibility" value="private" class="sr-only peer" />
                  <div class="text-center p-2 rounded-lg border border-slate-800 bg-slate-950/60 peer-checked:border-red-500 peer-checked:text-white text-slate-400">
                    <span class="block text-xs font-semibold uppercase">Privado</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button
                type="button"
                (click)="close()"
                class="min-h-[44px] flex-1 px-4 rounded-xl border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="listForm.invalid"
                class="min-h-[44px] flex-1 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Crear lista
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CreateListModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() createList = new EventEmitter<{ title: string; description: string; visibility: 'public' | 'friends' | 'private' }>();

  listForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    visibility: ['public'],
  });

  constructor(private fb: FormBuilder) {}

  close() {
    this.closeModal.emit();
    this.listForm.reset({ visibility: 'public' });
  }

  onSubmit() {
    if (this.listForm.valid) {
      this.createList.emit(this.listForm.value as any);
      this.close();
    }
  }
}
