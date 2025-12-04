import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserList, UserListItem } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-list-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" *ngIf="list">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="close()"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl h-[80vh] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="relative h-48 flex-shrink-0">
          <div class="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 z-10"></div>
          <img 
            [src]="list.cover || '/assets/default-cover.jpg'" 
            class="w-full h-full object-cover opacity-50"
            alt="Cover"
          >
          <div class="absolute bottom-0 left-0 p-6 z-20 w-full flex items-end justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h2 class="text-3xl font-bold text-white">{{ list.title }}</h2>
                <span *ngIf="list.isDefault" class="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase border border-yellow-500/30">Por defecto</span>
              </div>
              <p class="text-gray-300 max-w-xl">{{ list.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="onAddItem()" class="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg shadow-red-900/20" title="Añadir contenido">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button (click)="close()" class="p-2 rounded-full bg-black/50 hover:bg-white/10 text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div *ngIf="items.length === 0" class="text-center py-12 text-gray-500">
            <p class="text-lg">Esta lista está vacía.</p>
            <p class="text-sm">Explora la guía para añadir contenido.</p>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let item of items" class="group relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
              <img [src]="item.poster" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" [alt]="item.title">
              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <h3 class="font-bold text-white leading-tight">{{ item.title }}</h3>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-gray-300 capitalize">{{ item.type }}</span>
                  <div class="flex items-center gap-2">
                    <span 
                      class="text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                      [ngClass]="{
                        'bg-green-500 text-black': item.state === 'finished',
                        'bg-blue-500 text-white': item.state === 'watching',
                        'bg-yellow-500 text-black': item.state === 'pending'
                      }"
                    >
                      {{ item.state }}
                    </span>
                    <button 
                      (click)="onRemoveItem(item.id, $event)"
                      class="p-1 rounded-full bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                      title="Eliminar de la lista"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ListDetailsComponent {
  @Input() list: UserList | null = null;
  @Input() items: UserListItem[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() removeItem = new EventEmitter<string>();
  @Output() addItem = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }

  onAddItem() {
    this.addItem.emit();
  }

  onRemoveItem(itemId: string, event: Event) {
    event.stopPropagation();
    this.removeItem.emit(itemId);
  }
}
