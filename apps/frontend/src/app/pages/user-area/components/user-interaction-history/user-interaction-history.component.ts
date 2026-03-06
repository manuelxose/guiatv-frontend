import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserContentInteraction } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-interaction-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Historial</h2>
          <p class="text-sm text-slate-400">Todo lo que has visto, dejado pendiente o valorado.</p>
        </div>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          *ngFor="let option of filters"
          type="button"
          (click)="setFilter(option.id)"
          class="min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors"
          [ngClass]="activeFilter === option.id ? 'bg-red-600 text-white' : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
        >
          {{ option.label }}
        </button>
      </div>

      <div *ngIf="filteredItems.length === 0" class="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p class="text-base font-semibold text-white">Aún no hay actividad en este filtro.</p>
        <p class="mt-2 text-sm text-slate-400">Empieza a valorar o marcar contenido como visto para construir tu perfil.</p>
      </div>

      <div class="space-y-3">
        <div
          *ngFor="let item of filteredItems"
          class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-200">
              {{ item.contentType === 'program' ? 'TV' : item.contentType === 'movie' ? 'MOV' : 'SER' }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">{{ item.contentTitle }}</p>
                  <div class="mt-1 flex flex-wrap gap-2">
                    <span
                      *ngIf="item.platform"
                      class="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-100"
                    >
                      {{ item.platform }}
                    </span>
                    <span class="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                      {{ humanStatus(item.status) }}
                    </span>
                  </div>
                </div>
                <a
                  *ngIf="item.contentId"
                  [routerLink]="['/contenido', item.contentId]"
                  class="min-h-[34px] rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-200"
                >
                  Ver ficha
                </a>
              </div>

              <div class="mt-4 grid gap-3 md:grid-cols-[180px_140px_auto] md:items-center">
                <label class="text-xs text-slate-400">
                  Estado
                  <select
                    class="mt-1 min-h-[38px] w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                    [ngModel]="item.status"
                    (ngModelChange)="updateItem(item, { status: $event })"
                  >
                    <option value="seen">Visto</option>
                    <option value="watching">Viendo</option>
                    <option value="pending">Pendiente</option>
                    <option value="dropped">Abandonado</option>
                  </select>
                </label>

                <label class="text-xs text-slate-400">
                  Nota
                  <select
                    class="mt-1 min-h-[38px] w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                    [ngModel]="item.rating || 0"
                    (ngModelChange)="updateItem(item, { rating: normalizeRating($event) })"
                  >
                    <option value="0">Sin nota</option>
                    <option *ngFor="let rating of ratings" [value]="rating">{{ rating }}/10</option>
                  </select>
                </label>

                <p class="text-xs text-slate-500">
                  {{ item.updatedAt | date: 'short' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserInteractionHistoryComponent {
  @Input() items: UserContentInteraction[] = [];
  @Output() filterChange = new EventEmitter<string>();
  @Output() updateInteraction = new EventEmitter<{
    contentId: string;
    contentTitle: string;
    contentType: 'movie' | 'series' | 'program';
    rating?: number;
    status: 'seen' | 'watching' | 'pending' | 'dropped';
    platform?: string;
    tmdbId?: number;
    genres?: string[];
  }>();

  activeFilter: 'all' | 'seen' | 'watching' | 'pending' | 'dropped' = 'all';
  filters = [
    { id: 'all', label: 'Todo' },
    { id: 'seen', label: 'Visto' },
    { id: 'watching', label: 'Viendo' },
    { id: 'pending', label: 'Pendiente' },
    { id: 'dropped', label: 'Abandonado' },
  ] as const;
  readonly ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  get filteredItems(): UserContentInteraction[] {
    if (this.activeFilter === 'all') {
      return this.items;
    }
    return this.items.filter((item) => item.status === this.activeFilter);
  }

  setFilter(filter: 'all' | 'seen' | 'watching' | 'pending' | 'dropped'): void {
    this.activeFilter = filter;
    this.filterChange.emit(filter);
  }

  updateItem(
    item: UserContentInteraction,
    patch: Partial<Pick<UserContentInteraction, 'status' | 'rating'>>
  ): void {
    this.updateInteraction.emit({
      contentId: item.contentId,
      contentTitle: item.contentTitle,
      contentType: item.contentType,
      status: (patch.status || item.status) as UserContentInteraction['status'],
      rating: patch.rating ?? item.rating,
      platform: item.platform,
      tmdbId: item.tmdbId,
      genres: item.genres,
    });
  }

  normalizeRating(value: number | string): number | undefined {
    const numeric = Number(value || 0);
    return numeric > 0 ? numeric : undefined;
  }

  humanStatus(status: string): string {
    if (status === 'seen') return 'Visto';
    if (status === 'watching') return 'Viendo';
    if (status === 'pending') return 'Pendiente';
    if (status === 'dropped') return 'Abandonado';
    return status || 'Sin estado';
  }
}
