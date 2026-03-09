import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import {
  CatalogPlatform,
  CatalogService,
  CatalogSuggestion,
} from '../../services/catalog.service';

type SearchMode = 'all' | 'tv' | 'streaming' | 'free' | 'tonight';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[110]">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md" (click)="close.emit()"></div>

      <div class="absolute inset-x-4 top-4 bottom-4 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-800 bg-[#081018]/98 shadow-[0_30px_80px_rgba(0,0,0,0.55)] md:top-10 md:bottom-10">
        <div class="border-b border-slate-800/80 p-4 md:p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/15 text-red-200">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5"></circle>
                <path stroke-linecap="round" d="M16 16l4.5 4.5"></path>
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-white">Buscar en Guía TV</p>
              <p class="text-xs text-slate-400">TV, streaming, plataformas y contenidos relacionados.</p>
            </div>
            <button
              type="button"
              (click)="close.emit()"
              class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-white"
              aria-label="Cerrar búsqueda"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mt-4 flex flex-col gap-3">
            <input
              [formControl]="queryControl"
              type="text"
              class="min-h-[54px] rounded-2xl border border-slate-700 bg-slate-950/80 px-4 text-base text-white outline-none transition-colors focus:border-red-500"
              placeholder="Buscar programa, película, serie o plataforma..."
              autofocus
            />

            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let chip of quickChips"
                type="button"
                (click)="selectMode(chip.id)"
                class="min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors"
                [ngClass]="activeMode === chip.id
                  ? 'border-red-500 bg-red-600 text-white'
                  : 'border-slate-700 bg-slate-900/80 text-slate-300'"
              >
                {{ chip.label }}
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let platform of platforms.slice(0, 8)"
                type="button"
                (click)="selectPlatform(platform.name)"
                class="min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors"
                [ngStyle]="selectedPlatform === platform.name ? { borderColor: platform.color, background: platform.color + '22', color: '#fff' } : null"
                [ngClass]="selectedPlatform === platform.name ? '' : 'border-slate-700 bg-slate-900/80 text-slate-300'"
              >
                {{ platform.name }}
              </button>
            </div>

            <div
              *ngIf="platformRegistryUnavailable"
              class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100"
            >
              El registro remoto no respondió. Se usan plataformas locales para mantener la búsqueda operativa.
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 md:p-5">
          <ng-container *ngIf="results$ | async as results">
            <div *ngIf="!queryControl.value" class="grid gap-4 md:grid-cols-2">
              <button
                *ngFor="let shortcut of shortcuts"
                type="button"
                (click)="runShortcut(shortcut)"
                class="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-4 text-left transition-colors hover:border-slate-600"
              >
                <p class="text-[11px] uppercase tracking-[0.28em] text-slate-500">{{ shortcut.eyebrow }}</p>
                <p class="mt-2 text-lg font-semibold text-white">{{ shortcut.title }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ shortcut.description }}</p>
              </button>
            </div>

            <div *ngIf="queryControl.value" class="space-y-2">
              <button
                *ngFor="let result of results"
                type="button"
                (click)="openSuggestion(result)"
                class="flex w-full items-center gap-3 rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-3 text-left transition-colors hover:border-slate-600"
              >
                <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-800 text-xs font-bold text-white">
                  <img
                    *ngIf="result.image"
                    [src]="result.image"
                    [alt]="result.title"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span *ngIf="!result.image">{{ result.source === 'program' ? 'TV' : 'VOD' }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate text-sm font-semibold text-white">{{ result.title }}</p>
                    <span class="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      {{ result.source === 'program' ? 'TV' : result.contentType === 'movie' ? 'Película' : 'Serie' }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-slate-400">
                    {{ result.subtitle || result.primaryPlatforms?.join(' · ') || 'Abrir ficha' }}
                  </p>
                </div>
              </button>

              <button
                *ngIf="queryControl.value"
                type="button"
                (click)="submitSearch()"
                class="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-5 text-sm font-semibold text-red-100"
              >
                Ver resultados completos
              </button>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class SearchOverlayComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  public readonly queryControl = new FormControl('', { nonNullable: true });
  public readonly quickChips = [
    { id: 'tv' as SearchMode, label: 'TV' },
    { id: 'streaming' as SearchMode, label: 'Streaming' },
    { id: 'free' as SearchMode, label: 'Gratis' },
    { id: 'tonight' as SearchMode, label: 'Esta noche' },
  ];
  public readonly shortcuts = [
    {
      eyebrow: 'Guía TV',
      title: 'Qué se emite ahora',
      description: 'Salta a la guía en directo y a la programación actual.',
      queryParams: { types: 'program', availability: 'live' },
    },
    {
      eyebrow: 'Streaming',
      title: 'Series en plataformas',
      description: 'Explora catálogos de streaming filtrados por series.',
      queryParams: { types: 'series', availability: 'streaming' },
    },
    {
      eyebrow: 'Gratis',
      title: 'Contenido free',
      description: 'Encuentra qué puedes ver sin coste extra.',
      queryParams: { availability: 'free' },
    },
    {
      eyebrow: 'Noche',
      title: 'Para esta noche',
      description: 'Abre la exploración con horario de prime time.',
      queryParams: { timeSlot: '6' },
    },
  ];

  public activeMode: SearchMode = 'all';
  public selectedPlatform: string | null = null;
  public platforms: CatalogPlatform[] = [];
  public platformRegistryUnavailable = false;
  public results$: Observable<CatalogSuggestion[]> = of([]);
  private readonly modeSubject = new BehaviorSubject<SearchMode>('all');
  private readonly selectedPlatformSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private readonly catalogService: CatalogService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.catalogService.getPlatformsState().subscribe((result) => {
      this.platformRegistryUnavailable = result.unavailable;
      this.platforms = result.data || [];
    });

    const query$ = this.queryControl.valueChanges.pipe(
      startWith(''),
      debounceTime(180),
      distinctUntilChanged()
    );

    this.results$ = combineLatest([
      query$,
      this.modeSubject.asObservable(),
      this.selectedPlatformSubject.asObservable(),
    ]).pipe(
      switchMap(([query, mode, selectedPlatform]) => {
        const normalized = String(query || '').trim();
        if (!normalized) {
          return of([]);
        }

        return this.catalogService.suggest(normalized, 10).pipe(
          map((items) =>
            items.filter((item) => this.matchesCurrentMode(item, mode, selectedPlatform))
          )
        );
      })
    );
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  selectMode(mode: SearchMode): void {
    this.activeMode = this.activeMode === mode ? 'all' : mode;
    this.modeSubject.next(this.activeMode);
  }

  selectPlatform(platformName: string): void {
    this.selectedPlatform = this.selectedPlatform === platformName ? null : platformName;
    this.selectedPlatformSubject.next(this.selectedPlatform);
  }

  openSuggestion(result: CatalogSuggestion): void {
    this.router.navigate([result.detailPath || '/contenido/' + result.catalogId]);
    this.close.emit();
  }

  submitSearch(): void {
    const q = this.queryControl.value.trim();
    this.router.navigate(['/programacion-tv/que-ver-hoy'], {
      queryParams: {
        ...(q ? { q } : {}),
        ...this.resolveModeQueryParams(),
        ...(this.selectedPlatform ? { platforms: this.selectedPlatform } : {}),
      },
    });
    this.close.emit();
  }

  runShortcut(shortcut: { queryParams: Record<string, string> }): void {
    this.router.navigate(['/programacion-tv/que-ver-hoy'], {
      queryParams: shortcut.queryParams,
    });
    this.close.emit();
  }

  private resolveModeQueryParams(): Record<string, string> {
    if (this.activeMode === 'tv') {
      return { types: 'program' };
    }

    if (this.activeMode === 'streaming') {
      return { types: 'movie,series', availability: 'streaming' };
    }

    if (this.activeMode === 'free') {
      return { availability: 'free' };
    }

    if (this.activeMode === 'tonight') {
      return { timeSlot: '6' };
    }

    return {};
  }

  private matchesCurrentMode(
    item: CatalogSuggestion,
    mode: SearchMode,
    selectedPlatform: string | null
  ): boolean {
    if (mode === 'tv') {
      return item.source === 'program';
    }

    if (mode === 'streaming') {
      return item.source === 'tmdb';
    }

    if (mode === 'free') {
      return item.primaryPlatforms?.some((platform) =>
        ['RTVE Play', 'Pluto TV'].includes(platform)
      );
    }

    if (selectedPlatform) {
      return item.primaryPlatforms?.includes(selectedPlatform) || false;
    }

    return true;
  }
}
