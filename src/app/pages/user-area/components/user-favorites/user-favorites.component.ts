import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFavorite } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-favorites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Favoritos</h2>
          <p class="text-sm text-slate-400">Gestiona lo que mas te gusta desde un solo lugar.</p>
        </div>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filtros de favoritos">
        <button
          *ngFor="let filter of filters"
          type="button"
          (click)="activeFilter = filter.id"
          class="min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          [attr.aria-pressed]="activeFilter === filter.id"
          [ngClass]="activeFilter === filter.id ? 'border-red-500/60 text-white bg-red-500/10' : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'"
        >
          {{ filter.label }}
        </button>
      </div>

      <div *ngIf="getFilteredItems().length === 0" class="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 text-center">
        <p class="text-white font-medium mb-2">No hay favoritos en este filtro.</p>
        <p class="text-sm text-slate-400">Explora contenido y marca tus favoritos para verlos aqui.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          *ngFor="let item of getFilteredItems()"
          class="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col"
        >
          <div class="aspect-[2/3] bg-slate-900/80">
            <img *ngIf="item.image" [src]="item.image" class="w-full h-full object-cover" [alt]="item.title" />
            <div *ngIf="!item.image" class="w-full h-full flex items-center justify-center text-xs text-slate-500">
              Sin imagen
            </div>
          </div>
          <div class="p-4 space-y-3 flex-1 flex flex-col">
            <div class="space-y-1">
              <span class="text-[10px] uppercase tracking-[0.2em] text-slate-500">{{ item.type }}</span>
              <h3 class="text-sm font-semibold text-white leading-tight line-clamp-2">{{ item.title }}</h3>
              <p *ngIf="item.subtitle" class="text-xs text-slate-400 line-clamp-1">{{ item.subtitle }}</p>
            </div>
            <div class="mt-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Abrir
              </button>
              <button
                type="button"
                (click)="onRemove(item.id)"
                class="min-h-[44px] px-3 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Quitar favorito"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserFavoritesComponent {
  @Input() favorites: UserFavorite[] = [];
  @Output() removeFavorite = new EventEmitter<string>();

  activeFilter: string = 'all';
  filters = [
    { id: 'all', label: 'Todos' },
    { id: 'channels', label: 'Canales' },
    { id: 'programs', label: 'Programas' },
    { id: 'lists', label: 'Listas' },
    { id: 'users', label: 'Usuarios' },
  ];

  getFilteredItems() {
    if (this.activeFilter === 'all') return this.favorites;
    return this.favorites.filter((item) => {
      if (this.activeFilter === 'channels') return item.type === 'channel';
      if (this.activeFilter === 'programs') return item.type === 'program';
      if (this.activeFilter === 'lists') return item.type === 'list';
      if (this.activeFilter === 'users') return item.type === 'user';
      return true;
    });
  }

  onRemove(id: string) {
    this.removeFavorite.emit(id);
  }
}
