import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserContentInteraction } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-interaction-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
          class="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-200">
            {{ item.contentType === 'program' ? 'TV' : item.contentType === 'movie' ? 'MOV' : 'SER' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-white">{{ item.contentTitle }}</p>
            <p class="text-xs text-slate-400">
              {{ item.platform || humanStatus(item.status) }}
              <span *ngIf="item.rating"> · {{ item.rating }}/10</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-300">
              {{ humanStatus(item.status) }}
            </span>
            <a
              *ngIf="item.contentId"
              [routerLink]="['/contenido', item.contentId]"
              class="min-h-[34px] rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-200"
            >
              Ver ficha
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserInteractionHistoryComponent {
  @Input() items: UserContentInteraction[] = [];
  @Output() filterChange = new EventEmitter<string>();

  activeFilter: 'all' | 'seen' | 'watching' | 'pending' | 'dropped' = 'all';
  filters = [
    { id: 'all', label: 'Todo' },
    { id: 'seen', label: 'Visto' },
    { id: 'watching', label: 'Viendo' },
    { id: 'pending', label: 'Pendiente' },
    { id: 'dropped', label: 'Abandonado' },
  ] as const;

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

  humanStatus(status: string): string {
    if (status === 'seen') return 'Visto';
    if (status === 'watching') return 'Viendo';
    if (status === 'pending') return 'Pendiente';
    if (status === 'dropped') return 'Abandonado';
    return status || 'Sin estado';
  }
}
