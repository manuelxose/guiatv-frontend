import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserList } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-lists',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white">Mis Listas</h2>
          <p class="text-gray-400 text-sm">Organiza tu contenido favorito</p>
        </div>
        <button
          (click)="onCreate()"
          class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          Nueva lista
        </button>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Create New List Card (Visual placeholder for empty state or quick action) -->
        <div
          (click)="onCreate()"
          class="group relative aspect-video rounded-2xl border-2 border-dashed border-gray-700 hover:border-red-500/50 bg-gray-800/30 hover:bg-gray-800/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div
            class="h-12 w-12 rounded-full bg-gray-700/50 group-hover:bg-red-500/20 flex items-center justify-center transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-400 group-hover:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span class="text-gray-400 group-hover:text-white font-medium transition-colors">Crear nueva lista</span>
        </div>

        <!-- List Items -->
        <div
          *ngFor="let list of lists"
          (click)="onSelect(list)"
          class="group relative aspect-video rounded-2xl overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all cursor-pointer"
        >
          <!-- Cover Image or Gradient -->
          <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
            <img
              *ngIf="list.cover"
              [src]="list.cover"
              class="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
              alt="Cover"
            />
            <div *ngIf="!list.cover" class="w-full h-full flex items-center justify-center bg-gray-800">
                <span class="text-4xl">📺</span>
            </div>
          </div>
          
          <!-- Content Overlay -->
          <div class="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div class="flex items-center justify-between mb-2">
                <span class="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                    {{ list.itemsCount }} items
                </span>
                <span 
                    class="text-xs font-medium px-2 py-1 rounded-full"
                    [ngClass]="{
                        'bg-green-500/20 text-green-300': list.visibility === 'public',
                        'bg-blue-500/20 text-blue-300': list.visibility === 'friends',
                        'bg-gray-500/20 text-gray-300': list.visibility === 'private'
                    }"
                >
                    {{ list.visibility === 'public' ? 'Pública' : list.visibility === 'friends' ? 'Amigos' : 'Privada' }}
                </span>
            </div>
            <h3 class="text-lg font-bold text-white leading-tight group-hover:text-red-400 transition-colors">
              {{ list.title }}
            </h3>
            <p class="text-sm text-gray-300 line-clamp-1 mt-1" *ngIf="list.description">
              {{ list.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UserListsComponent {
  @Input() lists: UserList[] = [];
  @Output() create = new EventEmitter<void>();
  @Output() select = new EventEmitter<UserList>();

  onCreate() {
    this.create.emit();
  }

  onSelect(list: UserList) {
    this.select.emit(list);
  }
}
