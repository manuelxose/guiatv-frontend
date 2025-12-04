import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-create-list-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" *ngIf="isOpen" @fadeIn>
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="close()"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden" @scaleIn>
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Nueva Lista</h2>
            <button (click)="close()" class="text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form [formGroup]="listForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Nombre de la lista</label>
              <input
                type="text"
                formControlName="title"
                class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                placeholder="Ej. Pelis para llorar"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Descripción (opcional)</label>
              <textarea
                formControlName="description"
                rows="3"
                class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                placeholder="¿De qué va esta lista?"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Visibilidad</label>
              <div class="grid grid-cols-3 gap-2">
                <label class="cursor-pointer">
                  <input type="radio" formControlName="visibility" value="public" class="sr-only peer">
                  <div class="text-center p-2 rounded-lg border border-gray-700 bg-gray-800 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white text-gray-400 hover:bg-gray-700 transition-all">
                    <span class="block text-xs font-bold uppercase">Pública</span>
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" formControlName="visibility" value="friends" class="sr-only peer">
                  <div class="text-center p-2 rounded-lg border border-gray-700 bg-gray-800 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white text-gray-400 hover:bg-gray-700 transition-all">
                    <span class="block text-xs font-bold uppercase">Amigos</span>
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" formControlName="visibility" value="private" class="sr-only peer">
                  <div class="text-center p-2 rounded-lg border border-gray-700 bg-gray-800 peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:text-white text-gray-400 hover:bg-gray-700 transition-all">
                    <span class="block text-xs font-bold uppercase">Privada</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button type="button" (click)="close()" class="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="listForm.invalid" class="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors shadow-lg shadow-red-900/20">
                Crear Lista
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CreateListModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() createList = new EventEmitter<{ title: string; description: string; visibility: 'public' | 'friends' | 'private' }>();

  listForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    visibility: ['public']
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
