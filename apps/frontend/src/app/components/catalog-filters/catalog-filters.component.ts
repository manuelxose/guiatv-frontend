import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CatalogAvailability,
  CatalogPlatform,
  CatalogQuery,
  CatalogSort,
  FALLBACK_CATALOG_GENRES,
} from '../../services/catalog.service';
import { FALLBACK_CATALOG_PLATFORMS } from '../../data/catalog-platforms.data';

type FilterVariant = 'explore' | 'platforms' | 'content-type' | 'guide';

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

const DATE_OPTIONS = [
  { id: 'today', label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
  { id: 'after_tomorrow', label: 'Pasado mañana' },
] as const;

@Component({
  selector: 'app-catalog-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="overflow-hidden rounded-[1.75rem] border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] shadow-[0_20px_40px_rgba(0,0,0,0.22)]">
      <div class="border-b border-[var(--portal-border)] p-4 md:p-5">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_auto] xl:items-end">
          <div class="space-y-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.35em] text-[var(--portal-text-muted)]">{{ eyebrow }}</p>
              <h2 class="mt-1 text-lg font-semibold text-[var(--portal-text)]">{{ title }}</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-[var(--portal-text-muted)]">{{ subtitle }}</p>
            </div>

            <div
              *ngIf="degraded"
              class="rounded-2xl border border-transparent bg-[var(--status-warning-soft)] px-4 py-3 text-xs text-[var(--portal-text)]"
            >
              {{ degradedMessage || 'Algunas fuentes del catálogo no están disponibles. Se muestran filtros locales para que puedas seguir navegando.' }}
            </div>

            <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div class="relative flex-1">
                <svg
                  class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-text-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="6.5"></circle>
                  <path stroke-linecap="round" d="M16 16l4.5 4.5"></path>
                </svg>
                <input
                  [(ngModel)]="queryText"
                  (keyup.enter)="applyQuery()"
                  type="text"
                  class="min-h-[48px] w-full rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] pl-11 pr-4 text-sm text-[var(--portal-text)] outline-none transition-colors focus:border-[var(--accent-live)]"
                  placeholder="Buscar dentro de esta vista..."
                />
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  (click)="applyQuery()"
                  class="min-h-[44px] rounded-full border border-[var(--portal-border)] px-4 text-sm font-semibold text-[var(--portal-text-soft)] transition-colors hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  (click)="isMobilePanelOpen = true"
                  class="min-h-[44px] rounded-full border border-[var(--portal-border)] px-4 text-sm font-semibold text-[var(--portal-text-soft)] md:hidden"
                >
                  Filtros
                </button>
                <button
                  *ngIf="showSaveDefaults"
                  type="button"
                  (click)="saveDefaults.emit()"
                  class="min-h-[44px] rounded-full border border-transparent bg-[var(--accent-live-soft)] px-4 text-sm font-semibold text-[var(--accent-live)]"
                >
                  Guardar predeterminado
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 xl:max-w-[28rem] xl:justify-end">
            <button
              *ngFor="let option of quickTabs"
              type="button"
              (click)="selectQuickTab(option.id)"
              class="min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors"
              [ngClass]="isQuickTabActive(option.id)
                ? 'bg-[var(--accent-live-strong)] text-white'
                : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)] hover:border-[var(--portal-border-strong)] hover:text-[var(--portal-text)]'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            *ngFor="let date of dateOptions"
            type="button"
            (click)="selectDate(date.id)"
            class="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
            [ngClass]="isDateActive(date.id)
              ? 'border-transparent bg-[var(--accent-discover-soft)] text-[var(--portal-text)]'
              : 'border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
          >
            {{ date.label }}
          </button>
          <button
            *ngIf="filters.date"
            type="button"
            (click)="selectDate('')"
            class="min-h-[36px] rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-3 text-xs font-semibold text-[var(--portal-text-soft)]"
          >
            Sin fecha fija
          </button>
        </div>
      </div>

      <div class="hidden gap-4 p-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <div *ngIf="showTypeControls" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Tipo</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let option of typeOptions"
              type="button"
              (click)="toggleArrayValue('types', option.id)"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="includes(filters.types, option.id)
                ? 'bg-[var(--portal-text)] text-[var(--portal-bg)]'
                : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Disponibilidad</p>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let option of availabilityOptions"
              type="button"
              (click)="toggleArrayValue('availability', option.id)"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="includes(filters.availability, option.id)
                ? 'border border-transparent bg-[var(--accent-streaming-soft)] text-[var(--portal-text)]'
                : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Géneros</p>
          <div class="flex max-h-32 flex-wrap gap-2 overflow-auto pr-1">
            <button
              *ngFor="let genre of safeGenres.slice(0, 18)"
              type="button"
              (click)="toggleArrayValue('genres', genre)"
              class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
              [ngClass]="includes(filters.genres, genre)
                ? 'bg-[var(--portal-text)] text-[var(--portal-bg)]'
                : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
            >
              {{ genre }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Plataformas</p>
          <div class="flex max-h-32 flex-wrap gap-2 overflow-auto pr-1">
            <button
              *ngFor="let platform of safePlatforms.slice(0, 16)"
              type="button"
              (click)="toggleArrayValue('platforms', platform.name)"
              class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
              [ngStyle]="includes(filters.platforms, platform.name)
                ? { borderColor: platform.color, color: '#fff', background: platform.color + '22' }
                : null"
              [ngClass]="includes(filters.platforms, platform.name)
                ? ''
                : 'border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
            >
              {{ platform.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="border-t border-[var(--portal-border)] p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Orden</span>
          <button
            *ngFor="let option of sortOptions"
            type="button"
            (click)="updateFilters({ sort: option.id })"
            class="min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors"
            [ngClass]="filters.sort === option.id
              ? 'bg-[var(--accent-live-strong)] text-white'
              : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
          >
            {{ option.label }}
          </button>

          <button
            type="button"
            (click)="clearFilters()"
            class="ml-auto min-h-[38px] rounded-full border border-[var(--portal-border)] px-3 text-xs font-semibold text-[var(--portal-text-soft)]"
          >
            Limpiar filtros
          </button>
        </div>

        <div *ngIf="activeSummary.length" class="mt-4 flex flex-wrap gap-2">
          <span
            *ngFor="let item of activeSummary"
            class="rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-3 py-1.5 text-[11px] font-semibold text-[var(--portal-text-soft)]"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div
        *ngIf="isMobilePanelOpen"
        class="fixed inset-0 z-[120] md:hidden"
        (click)="closeMobilePanel()"
        (keydown.escape)="closeMobilePanel()"
        tabindex="-1"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div
          class="absolute inset-x-0 bottom-0 max-h-[84dvh] overflow-y-auto rounded-t-[2rem] border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          tabindex="-1"
        >
          <div class="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--portal-surface-strong)]"></div>
          <div class="space-y-5">
            <div>
              <p class="text-[11px] uppercase tracking-[0.35em] text-[var(--portal-text-muted)]">{{ eyebrow }}</p>
              <h3 class="mt-1 text-xl font-semibold text-[var(--portal-text)]">{{ title }}</h3>
              <p class="mt-2 text-sm text-[var(--portal-text-muted)]">{{ subtitle }}</p>
            </div>

            <div>
              <label for="catalog-filter-query" class="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Buscar</label>
              <input
                id="catalog-filter-query"
                [(ngModel)]="queryText"
                type="text"
                class="min-h-[48px] w-full rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-4 text-sm text-[var(--portal-text)] outline-none focus:border-[var(--accent-live)]"
                placeholder="Título, género o palabra clave"
              />
            </div>

            <div *ngIf="showTypeControls">
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Tipo</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let option of typeOptions"
                  type="button"
                  (click)="toggleArrayValue('types', option.id)"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="includes(filters.types, option.id)
                    ? 'bg-[var(--portal-text)] text-[var(--portal-bg)]'
                    : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Disponibilidad</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let option of availabilityOptions"
                  type="button"
                  (click)="toggleArrayValue('availability', option.id)"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="includes(filters.availability, option.id)
                    ? 'border border-transparent bg-[var(--accent-streaming-soft)] text-[var(--portal-text)]'
                    : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Fecha</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let date of dateOptions"
                  type="button"
                  (click)="selectDate(date.id)"
                  class="min-h-[40px] rounded-full border px-4 text-sm font-semibold"
                  [ngClass]="isDateActive(date.id)
                    ? 'border-transparent bg-[var(--accent-discover-soft)] text-[var(--portal-text)]'
                    : 'border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
                >
                  {{ date.label }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Plataformas</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let platform of safePlatforms"
                  type="button"
                  (click)="toggleArrayValue('platforms', platform.name)"
                  class="min-h-[40px] rounded-full border px-4 text-sm font-semibold"
                  [ngStyle]="includes(filters.platforms, platform.name)
                    ? { borderColor: platform.color, color: '#fff', background: platform.color + '22' }
                    : null"
                  [ngClass]="includes(filters.platforms, platform.name)
                    ? ''
                    : 'border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
                >
                  {{ platform.name }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Géneros</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let genre of safeGenres"
                  type="button"
                  (click)="toggleArrayValue('genres', genre)"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="includes(filters.genres, genre)
                    ? 'bg-[var(--portal-text)] text-[var(--portal-bg)]'
                    : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
                >
                  {{ genre }}
                </button>
              </div>
            </div>

            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--portal-text-muted)]">Orden</p>
              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let option of sortOptions"
                  type="button"
                  (click)="updateFilters({ sort: option.id })"
                  class="min-h-[40px] rounded-full px-4 text-sm font-semibold"
                  [ngClass]="filters.sort === option.id
                    ? 'bg-[var(--accent-live-strong)] text-white'
                    : 'border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] text-[var(--portal-text-soft)]'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 mt-6 flex gap-3 border-t border-[var(--portal-border)] bg-[var(--portal-bg-deep)]/96 pt-4">
            <button
              type="button"
              (click)="clearFilters()"
              class="flex-1 min-h-[48px] rounded-2xl border border-[var(--portal-border)] text-sm font-semibold text-[var(--portal-text-soft)]"
            >
              Limpiar
            </button>
            <button
              type="button"
              (click)="applyAndCloseMobile()"
              class="flex-1 min-h-[48px] rounded-2xl bg-[var(--accent-live-strong)] text-sm font-semibold text-white"
            >
              Ver resultados
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CatalogFiltersComponent {
  private internalFilters: CatalogQuery = {};

  @Input() title = 'Explorar';
  @Input() variant: FilterVariant = 'explore';
  @Input() genres: string[] = [];
  @Input() platforms: CatalogPlatform[] = [];
  @Input() showSaveDefaults = false;
  @Input() degraded = false;
  @Input() degradedMessage = '';
  @Input() set filters(value: CatalogQuery) {
    this.internalFilters = value || {};
    this.queryText = String(this.internalFilters.q || '');
  }
  get filters(): CatalogQuery {
    return this.internalFilters;
  }

  @Output() filtersChange = new EventEmitter<CatalogQuery>();
  @Output() reset = new EventEmitter<void>();
  @Output() saveDefaults = new EventEmitter<void>();

  public queryText = '';
  public isMobilePanelOpen = false;
  public readonly typeOptions = TYPE_OPTIONS;
  public readonly availabilityOptions = AVAILABILITY_OPTIONS;
  public readonly sortOptions = SORT_OPTIONS;
  public readonly dateOptions = DATE_OPTIONS;
  public readonly quickTabs = [
    { id: 'all', label: 'Todo' },
    { id: 'live', label: 'TV' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'free', label: 'Gratis' },
  ] as const;

  get showTypeControls(): boolean {
    return this.variant !== 'content-type';
  }

  get eyebrow(): string {
    if (this.variant === 'platforms') return 'Plataformas';
    if (this.variant === 'content-type') return 'Colección';
    if (this.variant === 'guide') return 'Guía TV';
    return 'Exploración';
  }

  get subtitle(): string {
    if (this.variant === 'platforms') {
      return 'Refina por proveedor, disponibilidad, géneros y orden sin mover la navegación global.';
    }
    if (this.variant === 'content-type') {
      return 'Ajusta disponibilidad, géneros y plataformas dentro de esta vista especializada.';
    }
    if (this.variant === 'guide') {
      return 'Recorta la parrilla y mezcla contenido lineal con catálogo sin invadir el header.';
    }
    return 'Combina TV, streaming, gratis, géneros y plataformas desde una sola vista.';
  }

  get activeSummary(): string[] {
    const summary: string[] = [];
    if (this.filters.q) summary.push(`Búsqueda: ${this.filters.q}`);
    if (this.filters.date) {
      const activeDate = this.dateOptions.find((item) => item.id === this.filters.date);
      summary.push(activeDate ? activeDate.label : this.filters.date);
    }
    if (this.filters.types?.length) summary.push(`Tipos: ${this.filters.types.length}`);
    if (this.filters.availability?.length) {
      summary.push(`Disponibilidad: ${this.filters.availability.length}`);
    }
    if (this.filters.genres?.length) summary.push(`Géneros: ${this.filters.genres.length}`);
    if (this.filters.platforms?.length) {
      summary.push(`Plataformas: ${this.filters.platforms.length}`);
    }
    return summary;
  }

  includes(source: string[] | undefined, value: string): boolean {
    return (source || []).includes(value);
  }

  get safeGenres(): string[] {
    return this.genres?.length ? this.genres : FALLBACK_CATALOG_GENRES;
  }

  get safePlatforms(): CatalogPlatform[] {
    return this.platforms?.length ? this.platforms : FALLBACK_CATALOG_PLATFORMS;
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
        types: this.showTypeControls ? ['program', 'movie', 'series'] : this.filters.types,
        availability: [],
      });
      return;
    }

    if (tab === 'live') {
      this.updateFilters({
        types: this.showTypeControls ? ['program'] : this.filters.types,
        availability: ['live'],
      });
      return;
    }

    if (tab === 'streaming') {
      this.updateFilters({
        types: this.showTypeControls ? ['movie', 'series'] : this.filters.types,
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
      if (this.showTypeControls) {
        return !availability.length && types.length >= 3;
      }
      return !availability.length;
    }

    if (tab === 'live') {
      return this.showTypeControls
        ? types.length === 1 && types[0] === 'program' && availability.includes('live')
        : availability.includes('live');
    }

    if (tab === 'streaming') {
      return this.showTypeControls
        ? types.length === 2 &&
            types.includes('movie') &&
            types.includes('series') &&
            availability.includes('streaming')
        : availability.includes('streaming');
    }

    return availability.length === 1 && availability[0] === 'free';
  }

  isDateActive(dateId: string): boolean {
    const current = this.filters.date || 'today';
    return current === dateId;
  }

  selectDate(date: string): void {
    this.updateFilters({ date: date || undefined });
  }

  applyQuery(): void {
    const trimmed = this.queryText.trim();
    this.updateFilters({ q: trimmed || undefined });
  }

  clearFilters(): void {
    this.queryText = '';
    this.isMobilePanelOpen = false;
    this.reset.emit();
  }

  closeMobilePanel(): void {
    this.isMobilePanelOpen = false;
  }

  applyAndCloseMobile(): void {
    this.applyQuery();
    this.isMobilePanelOpen = false;
  }

  updateFilters(patch: Partial<CatalogQuery>): void {
    this.filtersChange.emit({
      ...this.filters,
      ...patch,
      page: 1,
    });
  }
}
