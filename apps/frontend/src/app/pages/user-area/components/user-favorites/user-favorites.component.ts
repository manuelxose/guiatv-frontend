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
          <h2 class="text-xl font-semibold text-[var(--portal-text)]">Favoritos</h2>
          <p class="text-sm text-[var(--portal-text-muted)]">Gestiona lo que mas te gusta desde un solo lugar.</p>
        </div>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filtros de favoritos">
        <button
          *ngFor="let filter of filters"
          type="button"
          (click)="activeFilter = filter.id"
          class="min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
          [attr.aria-pressed]="activeFilter === filter.id"
          [ngClass]="activeFilter === filter.id ? 'border-[var(--accent-live)]/60 text-[var(--accent-live)] bg-[var(--accent-live-soft)]' : 'border-[var(--portal-border)] text-[var(--portal-text-muted)] hover:text-[var(--accent-live)] hover:border-[var(--portal-border-strong)]'"
        >
          {{ filter.label }}
        </button>
      </div>

      <div *ngIf="getFilteredItems().length === 0" class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-8 text-center">
        <p class="text-[var(--portal-text)] font-medium mb-2">No hay favoritos en este filtro.</p>
        <p class="text-sm text-[var(--portal-text-muted)]">Explora contenido y marca tus favoritos para verlos aqui.</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          *ngFor="let item of getFilteredItems()"
          data-vertical="discover"
          class="favorite-card overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] flex flex-col"
        >
          <div class="aspect-[2/3] bg-[var(--portal-surface-soft)]">
            <img *ngIf="item.image" [src]="item.image" class="w-full h-full object-cover" [alt]="item.title" />
            <div *ngIf="!item.image" class="w-full h-full flex items-center justify-center text-xs text-[var(--portal-text-muted)]">
              Sin imagen
            </div>
          </div>
          <div class="p-4 space-y-3 flex-1 flex flex-col">
            <div class="space-y-1">
              <span class="text-[10px] uppercase tracking-[0.2em] text-[var(--portal-text-muted)]">{{ item.type }}</span>
              <h3 class="text-sm font-semibold text-[var(--portal-text)] leading-tight line-clamp-2">{{ item.title }}</h3>
              <p *ngIf="item.subtitle" class="text-xs text-[var(--portal-text-muted)] line-clamp-1">{{ item.subtitle }}</p>
            </div>
            <div class="mt-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="min-h-[44px] px-3 rounded-lg border border-[var(--portal-border)] text-xs text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
              >
                Abrir
              </button>
              <button
                type="button"
                (click)="onRemove(item.id)"
                class="min-h-[44px] px-3 rounded-lg border border-[var(--portal-border)] text-xs text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
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
  styles: [
    `
      @use '../../../../../styles/card-accent' as cards;

      .favorite-card {
        @include cards.card-vertical-accent();
      }
    `,
  ],
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
