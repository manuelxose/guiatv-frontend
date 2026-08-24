import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { CatalogService } from '../../services/catalog.service';
import { UserService } from '../../services/user.service';

interface WhereToWatchProvider {
  id: number;
  name: string;
  logoUrl: string;
  type: 'flatrate' | 'rent' | 'buy' | 'free';
}

interface ForYouItem {
  item: {
    catalogId: string;
    source: 'program' | 'tmdb';
    contentType: 'movie' | 'series' | 'program';
    title: string;
    slug: string;
    detailPath: string;
    subtitle?: string;
    synopsis?: string;
    image?: string;
    backdrop?: string;
    genres: string[];
    tmdbId?: number;
    rating?: number;
    releaseYear?: number;
    durationMinutes?: number;
    primaryPlatforms: string[];
    channel?: { name: string; logo?: string };
  };
  score: number;
  reason: string;
  matchedGenres: string[];
  whereToWatch?: WhereToWatchProvider[];
}

@Component({
  selector: 'app-for-you',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-[var(--portal-text)] sm:text-3xl">Para ti</h1>
          <p class="mt-2 text-sm text-[var(--portal-text-muted)]">
            Recomendaciones personalizadas basadas en tus gustos y plataformas
          </p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            *ngFor="let i of [1,2,3,4,5,6]"
            class="animate-pulse rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-4"
          >
            <div class="mb-3 h-44 rounded-xl bg-[var(--portal-surface-strong)]"></div>
            <div class="mb-2 h-5 w-3/4 rounded bg-[var(--portal-surface-strong)]"></div>
            <div class="h-4 w-full rounded bg-[var(--portal-surface-strong)]"></div>
          </div>
        </div>

        <!-- Auth gate -->
        <div
          *ngIf="!loading && requiresAuth"
          class="mx-auto max-w-lg rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-8 text-center"
        >
          <p class="text-lg font-semibold text-[var(--portal-text)]">Inicia sesión para ver tus recomendaciones</p>
          <p class="mt-2 text-sm text-[var(--portal-text-muted)]">
            La sección Para ti usa tus gustos, plataformas favoritas y actividad para construir recomendaciones reales.
          </p>
          <button
            type="button"
            (click)="goToLogin()"
            class="mt-5 rounded-xl bg-[var(--accent-live-strong)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Acceder
          </button>
        </div>

        <!-- No preferences CTA -->
        <div
          *ngIf="!loading && !requiresAuth && noPreferences"
          class="mx-auto max-w-lg rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-8 text-center"
        >
          <p class="text-lg font-semibold text-[var(--portal-text)]">Aún no tenemos tus gustos</p>
          <p class="mt-2 text-sm text-[var(--portal-text-muted)]">
            Completa tu perfil con tus géneros y plataformas favoritas para que podamos recomendarte contenido personalizado.
          </p>
          <button
            type="button"
            (click)="goToSettings()"
            class="mt-5 rounded-xl bg-[var(--accent-live-strong)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Completar perfil
          </button>
        </div>

        <!-- Error -->
        <div
          *ngIf="!loading && !requiresAuth && error"
          class="mx-auto max-w-lg rounded-2xl border border-transparent bg-[var(--status-warning-soft)] p-6 text-center"
          role="alert"
        >
          <p class="text-sm text-[var(--portal-text)]">{{ error }}</p>
          <button
            type="button"
            (click)="loadRecommendations()"
            class="mt-4 rounded-xl border border-[var(--status-warning)] px-4 py-2 text-xs font-semibold text-[var(--status-warning)]"
          >
            Reintentar
          </button>
        </div>

        <!-- Empty (has preferences but no results) -->
        <div
          *ngIf="!loading && !requiresAuth && !error && !noPreferences && !items.length"
          class="mx-auto max-w-lg rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-8 text-center"
        >
          <p class="text-lg font-semibold text-[var(--portal-text)]">Sin recomendaciones ahora</p>
          <p class="mt-2 text-sm text-[var(--portal-text-muted)]">
            No hay recomendaciones que coincidan con tus gustos en este momento. Prueba más tarde o ajusta tus preferencias.
          </p>
        </div>

        <!-- Results grid -->
        <div
          *ngIf="!loading && !requiresAuth && items.length"
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            *ngFor="let rec of items; trackBy: trackById"
            class="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] transition-colors hover:border-[var(--portal-border)]"
            (click)="openDetail(rec)"
            (keydown.enter)="openDetail(rec)"
            (keydown.space)="$event.preventDefault(); openDetail(rec)"
            role="button"
            tabindex="0"
          >
            <!-- Image -->
            <div class="relative h-48 overflow-hidden bg-[var(--portal-surface-strong)]">
              <img
                *ngIf="rec.item.image"
                [src]="rec.item.image"
                [alt]="rec.item.title"
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div
                *ngIf="!rec.item.image"
                class="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--portal-text-faint)]"
              >
                {{ rec.item.contentType === 'program' ? 'TV' : 'VOD' }}
              </div>
              <!-- Score badge -->
              <span
                class="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold"
                [ngClass]="rec.score >= 0.7
                  ? 'bg-[var(--accent-streaming)] text-[var(--portal-bg-elevated)]'
                  : rec.score >= 0.4
                    ? 'bg-[var(--accent-sports)] text-[var(--portal-bg-elevated)]'
                    : 'bg-[var(--portal-surface-strong)]/90 text-[var(--portal-text-soft)]'"
              >
                {{ (rec.score * 100) | number:'1.0-0' }}% match
              </span>
              <!-- Content type badge -->
              <span
                class="absolute right-3 top-3 rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--portal-text-soft)]"
              >
                {{ rec.item.contentType === 'movie' ? 'Película'
                   : rec.item.contentType === 'series' ? 'Serie' : 'TV' }}
              </span>
            </div>

            <!-- Content -->
            <div class="p-4">
              <h3 class="text-sm font-semibold leading-snug text-[var(--portal-text)] line-clamp-2">
                {{ rec.item.title }}
              </h3>

              <div *ngIf="rec.item.releaseYear || rec.item.rating" class="mt-1.5 flex items-center gap-2 text-xs text-[var(--portal-text-muted)]">
                <span *ngIf="rec.item.releaseYear">{{ rec.item.releaseYear }}</span>
                <span *ngIf="rec.item.rating" class="flex items-center gap-0.5">
                  <span class="text-[var(--status-warning)]">★</span> {{ rec.item.rating | number:'1.1-1' }}
                </span>
                <span *ngIf="rec.item.durationMinutes">{{ rec.item.durationMinutes }} min</span>
              </div>

              <p class="mt-2 text-xs leading-relaxed text-[var(--portal-text-soft)] line-clamp-2">
                {{ rec.reason }}
              </p>

              <!-- Matched genres -->
              <div *ngIf="rec.matchedGenres.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  *ngFor="let genre of rec.matchedGenres.slice(0, 3)"
                  class="rounded-full border border-transparent bg-[var(--accent-live-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-live)]"
                >
                  {{ genre }}
                </span>
              </div>

              <!-- Where to watch -->
              <div *ngIf="rec.whereToWatch?.length" class="mt-3 flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--portal-text-muted)]">Ver en</span>
                <ng-container *ngFor="let provider of rec.whereToWatch.slice(0, 3)">
                  <img
                    *ngIf="provider.logoUrl"
                    [src]="provider.logoUrl"
                    [alt]="provider.name"
                    [title]="provider.name"
                    class="h-6 w-6 rounded-md"
                    loading="lazy"
                  />
                  <span
                    *ngIf="!provider.logoUrl"
                    class="rounded-md border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-2 py-0.5 text-[10px] text-[var(--portal-text-soft)]"
                  >
                    {{ provider.name }}
                  </span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more -->
        <div *ngIf="!loading && !requiresAuth && items.length && hasMore" class="mt-8 text-center">
          <button
            type="button"
            (click)="loadMore()"
            [disabled]="loadingMore"
            class="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-6 py-2.5 text-sm font-semibold text-[var(--portal-text-soft)] disabled:opacity-50"
          >
            {{ loadingMore ? 'Cargando…' : 'Cargar más' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ForYouComponent implements OnInit {
  items: ForYouItem[] = [];
  loading = true;
  loadingMore = false;
  error: string | null = null;
  noPreferences = false;
  hasMore = false;
  requiresAuth = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 12;

  constructor(
    private readonly catalogService: CatalogService,
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    combineLatest([this.userService.isAuthenticated$, this.userService.getProfile()])
      .pipe(
        map(([isAuthenticated, profile]) => ({
          isAuthenticated,
          profile,
          signature: JSON.stringify({
            isAuthenticated,
            favoriteGenres: profile?.favoriteGenres || [],
            preferredPlatforms: profile?.preferredPlatforms || [],
          }),
        })),
        distinctUntilChanged((left, right) => left.signature === right.signature),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ isAuthenticated, profile }) => {
        if (!isAuthenticated) {
          this.requiresAuth = true;
          this.noPreferences = false;
          this.items = [];
          this.error = null;
          this.loading = false;
          this.loadingMore = false;
          this.hasMore = false;
          return;
        }

        this.requiresAuth = false;
        if (!profile.favoriteGenres?.length && !profile.preferredPlatforms?.length) {
          this.noPreferences = true;
          this.loading = false;
          this.items = [];
          this.error = null;
          this.hasMore = false;
          return;
        }

        this.noPreferences = false;
        this.loadRecommendations();
      });
  }

  loadRecommendations(): void {
    if (this.requiresAuth) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;
    this.items = [];

    this.catalogService.getForYou(this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.items = (data || []) as ForYouItem[];
          this.hasMore = this.items.length >= this.pageSize;
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar las recomendaciones. Inténtalo de nuevo.';
          this.loading = false;
        },
      });
  }

  loadMore(): void {
    if (this.loadingMore || this.requiresAuth) return;
    this.loadingMore = true;
    
    this.catalogService.getForYouState(this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          const newItems = ((result.data || []) as ForYouItem[])
            .filter((r) => !this.items.some((e) => e.item.catalogId === r.item.catalogId));
          this.items = [...this.items, ...newItems];
          this.hasMore = newItems.length >= this.pageSize;
          this.loadingMore = false;
        },
        error: () => {
          this.loadingMore = false;
        },
      });
  }

  openDetail(rec: ForYouItem): void {
    if (rec.item.detailPath) {
      void this.router.navigateByUrl(rec.item.detailPath);
    } else {
      void this.router.navigate(['/contenido', rec.item.catalogId]);
    }
  }

  goToSettings(): void {
    void this.router.navigate(['/mi-cuenta'], { queryParams: { tab: 'settings' } });
  }

  goToLogin(): void {
    void this.router.navigate(['/iniciar-sesion'], {
      queryParams: { redirect: '/para-ti' },
    });
  }

  trackById(_index: number, rec: ForYouItem): string {
    return rec.item.catalogId;
  }
}
