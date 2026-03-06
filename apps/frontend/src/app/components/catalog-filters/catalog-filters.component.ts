import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CatalogAvailability,
  CatalogPlatform,
  CatalogQuery,
  CatalogSort,
} from '../../services/catalog.service';

const TYPE_OPTIONS = [
  { id: 'program', label: 'TV' },
  { id: 'movie', label: 'Películas' },
  { id: 'series', label: 'Series' },
] as const;

const AVAILABILITY_OPTIONS: Array<{ id: CatalogAvailability; label: string }> = [
  { id: 'live', label: 'En directo' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'free', label: 'Gratis' },
  { id: 'flatrate', label: 'Suscripción' },
  { id: 'rent', label: 'Alquiler' },
  { id: 'buy', label: 'Compra' },
];

const SORT_OPTIONS: Array<{ id: CatalogSort; label: string }> = [
  { id: 'personalized', label: 'Para ti' },
  { id: 'popular', label: 'Popular' },
  { id: 'rating', label: 'Mejor valorado' },
  { id: 'airtime', label: 'Por horario' },
  { id: 'recent', label: 'Más reciente' },
];

@Component({
  selector: 'app-catalog-filters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.22)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.35em] text-slate-500">Exploración</p>
          <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="isMobilePanelOpen = !isMobilePanelOpen"
            class="md:hidden min-h-[44px] rounded-full border border-slate-700 px-4 text-sm font-semibold text-slate-200"
          >
            Filtros
          </button>
          <button
            *ngIf="showSaveDefaults"
            type="button"
            (click)="saveDefaults.emit()"
            class="min-h-[44px] rounded-full border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-200"
          >
            Guardar predeterminado
          </button>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          *ngFor="let option of quickTabs"
          type="button"
          (click)="selectQuickTab(option.id)"
          class="min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors"
          [ngClass]="isQuickTabActive(option.id)
            ? 'bg-red-600 text-white'
            : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white'"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="mt-4 hidden md:grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Tipo</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let option of typeOptions"
              type="button"
              (click)="toggleArrayValue('types', option.id)"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="includes(filters.types, option.id)
                ? 'bg-slate-100 text-slate-900'
                : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Disponibilidad</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let option of availabilityOptions"
              type="button"
              (click)="toggleArrayValue('availability', option.id)"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="includes(filters.availability, option.id)
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Géneros</p>
          <div class="flex max-h-28 flex-wrap gap-2 overflow-auto pr-1">
            <button
              *ngFor="let genre of genres.slice(0, 18)"
              type="button"
              (click)="toggleArrayValue('genres', genre)"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="includes(filters.genres, genre)
                ? 'bg-slate-100 text-slate-900'
                : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
            >
              {{ genre }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Plataformas</p>
          <div class="flex max-h-28 flex-wrap gap-2 overflow-auto pr-1">
            <button
              *ngFor="let platform of platforms.slice(0, 14)"
              type="button"
              (click)="toggleArrayValue('platforms', platform.name)"
              class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
              [ngStyle]="includes(filters.platforms, platform.name) ? { borderColor: platform.color, color: '#fff', background: platform.color + '22' } : null"
              [ngClass]="includes(filters.platforms, platform.name)
                ? ''
                : 'border-slate-700 bg-slate-900/70 text-slate-300'"
            >
              {{ platform.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs uppercase tracking-[0.25em] text-slate-500">Orden</span>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let option of sortOptions"
              type="button"
              (click)="updateFilters({ sort: option.id })"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="filters.sort === option.id
                ? 'bg-red-600 text-white'
                : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <button
          type="button"
          (click)="reset.emit()"
          class="min-h-[38px] rounded-full border border-slate-700 px-3 text-xs font-semibold text-slate-300"
        >
          Limpiar
        </button>
      </div>

      <div
        *ngIf="isMobilePanelOpen"
        class="fixed inset-0 z-[140] md:hidden"
        (click)="isMobilePanelOpen = false"
      >
        <div class="absolute inset-0 bg-black/70"></div>
        <div
          class="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[2rem] border border-slate-800 bg-slate-950 p-4"
          (click)="$event.stopPropagation()"
        >
          <div class="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-700"></div>
          <div class="space-y-5">
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Tipo</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let option of typeOptions"
                  type="button"
                  (click)="toggleArrayValue('types', option.id)"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="includes(filters.types, option.id) ? 'bg-slate-100 text-slate-900' : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Disponibilidad</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let option of availabilityOptions"
                  type="button"
                  (click)="toggleArrayValue('availability', option.id)"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="includes(filters.availability, option.id) ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Plataformas</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let platform of platforms"
                  type="button"
                  (click)="toggleArrayValue('platforms', platform.name)"
                  class="min-h-[40px] rounded-full border px-4 text-sm font-semibold"
                  [ngStyle]="includes(filters.platforms, platform.name) ? { borderColor: platform.color, color: '#fff', background: platform.color + '22' } : null"
                  [ngClass]="includes(filters.platforms, platform.name) ? '' : 'border-slate-700 bg-slate-900/70 text-slate-300'"
                >
                  {{ platform.name }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Géneros</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let genre of genres"
                  type="button"
                  (click)="toggleArrayValue('genres', genre)"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="includes(filters.genres, genre) ? 'bg-slate-100 text-slate-900' : 'border border-slate-700 bg-slate-900/70 text-slate-300'"
                >
                  {{ genre }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CatalogFiltersComponent {
  @Input() title = 'Explorar';
  @Input() filters: CatalogQuery = {};
  @Input() genres: string[] = [];
  @Input() platforms: CatalogPlatform[] = [];
  @Input() showSaveDefaults = false;
  @Output() filtersChange = new EventEmitter<CatalogQuery>();
  @Output() reset = new EventEmitter<void>();
  @Output() saveDefaults = new EventEmitter<void>();

  public isMobilePanelOpen = false;
  public readonly typeOptions = TYPE_OPTIONS;
  public readonly availabilityOptions = AVAILABILITY_OPTIONS;
  public readonly sortOptions = SORT_OPTIONS;
  public readonly quickTabs = [
    { id: 'all', label: 'Todo' },
    { id: 'live', label: 'TV' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'free', label: 'Gratis' },
  ];

  includes(source: string[] | undefined, value: string): boolean {
    return (source || []).includes(value);
  }

  toggleArrayValue(
    field: 'types' | 'genres' | 'platforms' | 'availability',
    value: string
  ): void {
    const current = [...((this.filters[field] as string[] | undefined) || [])];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    this.updateFilters({ [field]: next });
  }

  selectQuickTab(tab: string): void {
    if (tab === 'all') {
      this.updateFilters({
        types: ['program', 'movie', 'series'],
        availability: [],
      });
      return;
    }
    if (tab === 'live') {
      this.updateFilters({
        types: ['program'],
        availability: ['live'],
      });
      return;
    }
    if (tab === 'streaming') {
      this.updateFilters({
        types: ['movie', 'series'],
        availability: ['streaming'],
      });
      return;
    }
    if (tab === 'free') {
      this.updateFilters({
        availability: ['free'],
      });
    }
  }

  isQuickTabActive(tab: string): boolean {
    const types = this.filters.types || [];
    const availability = this.filters.availability || [];
    if (tab === 'all') {
      return !availability.length && types.length >= 3;
    }
    if (tab === 'live') {
      return types.length === 1 && types[0] === 'program' && availability.includes('live');
    }
    if (tab === 'streaming') {
      return (
        types.length === 2 &&
        types.includes('movie') &&
        types.includes('series') &&
        availability.includes('streaming')
      );
    }
    return availability.length === 1 && availability[0] === 'free';
  }

  updateFilters(patch: Partial<CatalogQuery>): void {
    this.filtersChange.emit({
      ...this.filters,
      ...patch,
      page: 1,
    });
  }
}

