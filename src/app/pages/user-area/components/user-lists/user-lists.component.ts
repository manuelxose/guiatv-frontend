import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserList } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-lists',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Mis listas</h2>
          <p class="text-sm text-slate-400">Organiza tu contenido favorito con control total.</p>
        </div>
        <button
          type="button"
          (click)="onCreate()"
          class="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Crear lista
        </button>
      </div>

      <div *ngIf="lists.length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 text-center">
        <p class="text-white font-medium mb-2">Aun no tienes listas.</p>
        <p class="text-sm text-slate-400 mb-6">Crea una lista para guardar series, programas y canales.</p>
        <button
          type="button"
          (click)="onCreate()"
          class="min-h-[44px] px-6 py-2.5 rounded-xl border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Crear primera lista
        </button>
      </div>

      <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <button
          type="button"
          (click)="onCreate()"
          class="group relative rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/60 text-left p-5 min-h-[220px] flex flex-col items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <div class="h-12 w-12 rounded-full border border-slate-700 flex items-center justify-center text-slate-300 text-xl">
            +
          </div>
          <span class="text-sm text-slate-300 font-medium">Crear nueva lista</span>
        </button>

        <div
          *ngFor="let list of lists"
          role="button"
          tabindex="0"
          (click)="onSelect(list)"
          (keydown.enter)="onSelect(list)"
          class="group rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <div class="relative aspect-video bg-slate-900/80">
            <img
              *ngIf="list.cover"
              [src]="list.cover"
              class="absolute inset-0 w-full h-full object-cover opacity-80"
              alt=""
            />
            <div *ngIf="!list.cover" class="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Sin portada
            </div>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-white truncate">{{ list.title }}</h3>
                <p class="text-xs text-slate-500 line-clamp-2" *ngIf="list.description">
                  {{ list.description }}
                </p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full border border-slate-700 text-slate-300 whitespace-nowrap">
                {{ list.itemsCount }} items
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                {{ list.visibility === 'public' ? 'Publico' : list.visibility === 'friends' ? 'Amigos' : 'Privado' }}
              </span>
              <button
                type="button"
                (click)="$event.stopPropagation(); onSelect(list)"
                class="min-h-[44px] px-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Abrir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
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
