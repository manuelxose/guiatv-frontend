import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-to-list-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" (click)="onClose()"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 class="text-xl font-bold text-white">Añadir a la lista</h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <form [formGroup]="addForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Buscar contenido</label>
              <div class="relative">
                <input 
                  type="text" 
                  formControlName="query" 
                  placeholder="Buscar películas, series..." 
                  class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p class="text-xs text-gray-500 mt-2">Simulación: Escribe cualquier título para añadirlo.</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                <select formControlName="type" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors appearance-none">
                  <option value="movie">Película</option>
                  <option value="series">Serie</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                <select formControlName="state" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors appearance-none">
                  <option value="pending">Pendiente</option>
                  <option value="watching">Viendo</option>
                  <option value="finished">Terminado</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
          <button (click)="onClose()" class="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-medium">
            Cancelar
          </button>
          <button (click)="onSubmit()" [disabled]="addForm.invalid" class="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Añadir
          </button>
        </div>
      </div>
    </div>
  `
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
      state: ['pending', Validators.required]
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
        state: this.addForm.value.state
      });
      this.onClose();
    }
  }
}
