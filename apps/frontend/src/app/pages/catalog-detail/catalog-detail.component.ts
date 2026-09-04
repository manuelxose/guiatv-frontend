import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Data, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { InteractionButtonsComponent } from '../../components/interaction-buttons/interaction-buttons.component';
import { WhereToWatchComponent } from '../../components/where-to-watch/where-to-watch.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { ShareButtonsComponent } from '../../components/share-buttons/share-buttons.component';
import {
  CatalogContentType,
  CatalogItem,
  CatalogQuery,
  CatalogService,
} from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';
import { buildProgramCatalogId, buildTmdbCatalogId } from '../../utils/catalog';
import { catalogRobotsPolicy } from '../../utils/catalog-indexability';
import { generateTVSeriesSchema, generateMovieSchema, generateBreadcrumbSchema } from '../../utils/utils';
import { UnifiedSkeletonBlockComponent } from '../../components/unified-skeleton-block/unified-skeleton-block.component';
import { UnifiedAsyncStateComponent } from '../../components/unified-async-state/unified-async-state.component';

type LegacyCatalogMode = 'program' | 'movie' | 'series';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CatalogRailComponent,
    InteractionButtonsComponent,
    WhereToWatchComponent,
    BreadcrumbComponent,
    ShareButtonsComponent,
    UnifiedSkeletonBlockComponent,
    UnifiedAsyncStateComponent,
  ],
  // Custom elements default to `display: inline`, and the shell routes pages
  // into a CSS grid track whose default `min-width: auto` sizes to the
  // widest unbreakable content run instead of the viewport — ballooning the
  // page to desktop width and clipping it under any `overflow-hidden`
  // ancestor on narrow screens. Block + min-width:0 lets it shrink to track.
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
    `,
  ],
  template: `
    <div class="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>
      <div *ngIf="loading" class="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Cargando ficha">
        <app-unified-skeleton-block [count]="6" [columns]="3" cardHeight="13rem"></app-unified-skeleton-block>
      </div>

      <ng-container *ngIf="!loading && item as content; else emptyState">
        <div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <app-breadcrumb [items]="breadcrumbItems"></app-breadcrumb>
        </div>
        <!-- Cinematic banner: image-backed, hero-* tokens only (constant-dark by design). -->
        <section class="relative overflow-hidden bg-[var(--hero-bg)]">
          <div class="absolute inset-0">
            <img
              *ngIf="content.backdrop || content.image"
              [src]="content.backdrop || content.image"
              [alt]="''"
              class="h-full w-full object-cover opacity-55"
            />
            <div class="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--hero-bg)_98%,transparent)_0%,color-mix(in_oklch,var(--hero-bg)_78%,transparent)_55%,color-mix(in_oklch,var(--hero-bg)_45%,transparent)_100%)]"></div>
            <div class="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--hero-bg)_10%,transparent),var(--hero-bg)_100%)]"></div>
          </div>

          <div class="relative mx-auto flex min-h-[22rem] max-w-7xl flex-col gap-6 px-4 pb-10 pt-10 sm:px-6 md:flex-row md:items-end lg:px-8 lg:pt-14">
            <!-- Poster / artwork -->
            <div
              *ngIf="content.image"
              class="mx-auto w-36 flex-shrink-0 overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] sm:w-44 md:mx-0 md:w-48 lg:w-56"
            >
              <img
                [src]="posterUrl(content.image)"
                [alt]="content.title"
                width="380"
                height="570"
                class="aspect-[2/3] w-full object-cover"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>

            <div class="min-w-0 flex-1 space-y-4">
              <div class="flex flex-wrap gap-2">
                <span class="rounded-[var(--radius-pill)] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--hero-text-muted)] backdrop-blur-sm">
                  {{ contentTypeLabel(content.contentType) }}
                </span>
                <span
                  *ngIf="content.liveNow"
                  class="rounded-[var(--radius-pill)] border border-transparent bg-[var(--accent-live-strong)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white"
                >
                  En directo
                </span>
              </div>

              <h1 class="max-w-4xl text-3xl font-black tracking-tight text-[var(--hero-text)] md:text-5xl">
                {{ content.title }}
              </h1>

              <div class="tnum flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--hero-text-muted)]">
                <span *ngIf="content.releaseYear">{{ content.releaseYear }}</span>
                <span *ngIf="content.durationMinutes">{{ content.durationMinutes }} min</span>
                <span *ngIf="content.channel?.name">{{ content.channel?.name }}</span>
                <span *ngIf="content.start">{{ formatTime(content.start) }}</span>
                <span *ngIf="content.rating" class="inline-flex items-center gap-1 text-[var(--status-warning)]">
                  <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.37 1.12l1.07 3.29c.3.92-.75 1.69-1.54 1.12l-2.8-2.04a1 1 0 0 0-1.17 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69l1.07-3.29Z"></path>
                  </svg>
                  {{ content.rating | number:'1.0-1' }}/10
                </span>
              </div>

              <p class="line-clamp-4 max-w-3xl text-base leading-7 text-[var(--hero-text-muted)]">
                {{ content.synopsis || 'Sinopsis no disponible.' }}
              </p>

              <div *ngIf="content.genres?.length" class="flex flex-wrap gap-2">
                <span
                  *ngFor="let genre of content.genres"
                  class="rounded-[var(--radius-pill)] border border-[var(--hero-border)] bg-[var(--hero-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--hero-text-muted)] backdrop-blur-sm"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Main composition: theme-aware surface, CTA + streaming availability integrated (not a boxed dashboard card). -->
        <section class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <div class="flex flex-wrap items-center gap-3">
            <app-interaction-buttons
              [itemId]="content.catalogId"
              [title]="content.title"
              [type]="content.contentType"
              [tmdbId]="content.tmdbId"
              [genres]="content.genres"
              [image]="content.image || content.backdrop"
              [platform]="content.primaryPlatforms?.[0]"
              [preloadInteraction]="true"
            ></app-interaction-buttons>
            <app-share-buttons variant="branded" [url]="shareUrl" [title]="content.title"></app-share-buttons>
          </div>

          <div
            *ngIf="content.whereToWatch || content.primaryPlatforms?.length || content.tmdbId"
            class="border-t border-[var(--portal-divider)] pt-6"
          >
            <h2 class="eyebrow mb-3 text-[var(--portal-text-muted)]">Dónde ver</h2>
            <app-where-to-watch
              [providersData]="content.whereToWatch"
              [primaryPlatforms]="content.primaryPlatforms"
              [tmdbId]="content.tmdbId"
              [contentType]="providerContentType(content)"
              placement="catalog-detail"
              [catalogId]="content.catalogId"
              [providerHint]="content.channel?.name"
              [page]="content.detailPath"
            ></app-where-to-watch>
          </div>

          <div
            *ngIf="content.director || content.socialSummary?.friendsWhoWatched || content.userInteraction?.status || content.userInteraction?.rating"
            class="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--portal-divider)] pt-6 text-sm text-[var(--portal-text-soft)]"
          >
            <span *ngIf="content.director"><span class="text-[var(--portal-text-muted)]">Dirección:</span> {{ content.director }}</span>
            <span *ngIf="content.socialSummary?.friendsWhoWatched">
              <span class="text-[var(--portal-text-muted)]">Tus amigos:</span>
              {{ content.socialSummary?.friendsWhoWatched }} lo han visto
            </span>
            <span *ngIf="content.userInteraction?.status">
              <span class="text-[var(--portal-text-muted)]">Tu estado:</span>
              {{ humanStatus(content.userInteraction?.status || '') }}
            </span>
            <span *ngIf="content.userInteraction?.rating" class="tnum">
              <span class="text-[var(--portal-text-muted)]">Tu nota:</span>
              {{ content.userInteraction?.rating }}/10
            </span>
          </div>

          <div *ngIf="content.airings?.length" class="border-t border-[var(--portal-divider)] pt-6">
            <p class="eyebrow mb-1 text-[var(--portal-text-muted)]">TV lineal</p>
            <h2 class="mb-4 text-xl font-bold text-[var(--portal-text)]">Próximas emisiones</h2>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <a
                *ngFor="let airing of content.airings"
                [routerLink]="airing.detailPath || ['/canales', airing.channelId]"
                class="tnum rounded-[var(--radius-md)] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-4 transition-colors hover:border-[var(--portal-border-strong)]"
              >
                <p class="text-sm font-semibold text-[var(--portal-text)]">{{ airing.title || airing.channelName }}</p>
                <p class="mt-1 text-xs text-[var(--portal-text-muted)]">
                  {{ airing.channelName }} · {{ formatTime(airing.start) }} - {{ formatTime(airing.end) }}
                </p>
                <span class="mt-3 inline-block text-xs font-semibold text-[var(--accent-live)]">
                  {{ airing.detailPath ? 'Ver qué se emite →' : 'Ver programación del canal →' }}
                </span>
              </a>
            </div>
          </div>

          <!-- Cast: compact rail, photo when available, text-only fallback otherwise. -->
          <div *ngIf="content.cast?.length" class="border-t border-[var(--portal-divider)] pt-6">
            <h2 class="eyebrow mb-4 text-[var(--portal-text-muted)]">Reparto</h2>
            <div class="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
              <div
                *ngFor="let member of content.cast"
                class="w-24 flex-shrink-0 text-center sm:w-28"
              >
                <img
                  *ngIf="member.profile; else castInitials"
                  [src]="castImageUrl(member.profile)"
                  [alt]="member.name"
                  width="112"
                  height="112"
                  loading="lazy"
                  decoding="async"
                  class="mx-auto h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                />
                <ng-template #castInitials>
                  <div
                    aria-hidden="true"
                    class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--portal-surface-strong)] text-lg font-bold text-[var(--portal-text-soft)] sm:h-24 sm:w-24"
                  >
                    {{ castInitialsFor(member.name) }}
                  </div>
                </ng-template>
                <p class="mt-2 line-clamp-1 text-xs font-semibold text-[var(--portal-text)]">{{ member.name }}</p>
                <p class="line-clamp-1 text-[11px] text-[var(--portal-text-muted)]">{{ member.character || 'Reparto' }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Related content: horizontal rail, same card pattern as catalog listings. -->
        <section *ngIf="relatedItems.length" class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <app-catalog-rail
            eyebrow="Relacionados"
            title="Sigue explorando"
            [items]="relatedItems"
          ></app-catalog-rail>
        </section>
      </ng-container>

      <ng-template #emptyState>
        <div *ngIf="!loading" class="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <app-unified-async-state
            kind="empty"
            title="No hemos podido cargar esta ficha"
            message="Puede que el contenido ya no esté disponible o que la URL antigua no tenga una correspondencia válida."
            actionLabel="Volver a explorar"
            (action)="goExplore()"
          ></app-unified-async-state>
        </div>
      </ng-template>
    </div>
  `,
})
export class CatalogDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly metaService = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroy$ = new Subject<void>();

  public item: CatalogItem | null = null;
  public relatedItems: CatalogItem[] = [];
  public loading = true;
  public safeLdHtml: SafeHtml | null = null;
  public breadcrumbItems: BreadcrumbItem[] = [];
  public shareUrl = '';

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.data])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, data]) => {
          this.loading = true;
          this.item = null;
          this.relatedItems = [];

          return this.resolveCatalogItem(params, data).pipe(
            switchMap((item) => {
              if (!item) {
                return of({ item: null, related: [] as CatalogItem[] });
              }

              const primaryRelated = this.normalizeRelatedItems(item.related || [], item.catalogId);
              if (primaryRelated.length) {
                return of({ item, related: primaryRelated });
              }

              return this.loadFallbackRelated(item).pipe(
                map((related) => ({ item, related })),
                // The detail is the primary result. Do not keep the whole page in
                // a loading state while a secondary related-content query runs.
                startWith({ item, related: [] as CatalogItem[] })
              );
            })
          );
        })
      )
      .subscribe(({ item, related }) => {
        this.item = item;
        this.relatedItems = related;
        this.loading = false;

        if (item) {
          this.applyMeta(item);
          this.buildBreadcrumbs(item);
          this.buildStructuredData(item);
          this.shareUrl = `https://guiaprogramaciontv.com${item.detailPath || this.router.url}`;
          // The critical response intentionally left providers/social/user
          // interaction (and possibly related) out to stay fast — fetch them
          // now, in the background, and patch them in when they arrive. This
          // never re-enters the loading state: the page is already rendered.
          if (item.enrichmentPending) {
            this.loadEnrichment(item);
          }
          return;
        }

        this.metaService.setMetaTags({
          title: 'Contenido no disponible - Guía TV',
          description: 'No hemos podido cargar la ficha solicitada.',
          canonicalUrl: this.router.url,
          robots: 'noindex, follow',
          httpStatus: 404,
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  humanStatus(status: string): string {
    if (status === 'seen') return 'Visto';
    if (status === 'watching') return 'Viendo';
    if (status === 'pending') return 'Pendiente';
    if (status === 'dropped') return 'Abandonado';
    return status;
  }

  contentTypeLabel(type: CatalogContentType): string {
    if (type === 'movie') return 'Película';
    if (type === 'series') return 'Serie';
    return 'Programa de TV';
  }

  /** Poster art at a size appropriate for the detail hero (narrower than the full backdrop). */
  posterUrl(value: string): string {
    return value.replace('https://image.tmdb.org/t/p/original/', 'https://image.tmdb.org/t/p/w500/');
  }

  /** Cast headshots are small in the rail — request TMDb's smallest useful profile size. */
  castImageUrl(value: string): string {
    return value.replace('https://image.tmdb.org/t/p/original/', 'https://image.tmdb.org/t/p/w185/');
  }

  /** Text fallback for cast members without a profile photo — avoids a big bordered placeholder box. */
  castInitialsFor(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (first + last).toUpperCase();
  }

  goExplore(): void {
    void this.router.navigate(['/programacion-tv/que-ver-hoy']);
  }

  providerContentType(item: CatalogItem): 'movie' | 'tv' | null {
    if (item.contentType === 'movie') {
      return 'movie';
    }
    if (item.contentType === 'series') {
      return 'tv';
    }
    return null;
  }

  private resolveCatalogItem(
    params: { get(name: string): string | null },
    data: Data
  ) {
    const catalogId = decodeURIComponent(String(params.get('catalogId') || '')).trim();
    if (catalogId) {
      return this.catalogService.getDetail(catalogId);
    }

    const slug = decodeURIComponent(String(params.get('slug') || '')).trim();
    const contentType = this.normalizeContentType(data['contentType']);
    if (slug && contentType) {
      return this.catalogService.getBySlug(contentType, slug);
    }

    const legacyId = decodeURIComponent(String(params.get('id') || '')).trim();
    const legacyMode = this.normalizeLegacyMode(data['legacyCatalogMode']);
    if (!legacyId || !legacyMode) {
      return of(null);
    }

    if (legacyMode === 'program') {
      return this.catalogService.getDetail(buildProgramCatalogId(legacyId));
    }

    const tmdbId = Number(legacyId);
    if (!Number.isFinite(tmdbId)) {
      return of(null);
    }

    return this.catalogService.getDetail(
      buildTmdbCatalogId(legacyMode === 'series' ? 'tv' : 'movie', tmdbId)
    );
  }

  /**
   * Fetches the secondary detail data (related, providers, social summary,
   * user interaction) that the critical response deliberately omitted, and
   * patches it into the already-rendered page. Runs entirely in the
   * background: never touches `this.loading`, and a failure here degrades to
   * "section stays absent" rather than affecting the primary content.
   */
  private loadEnrichment(item: CatalogItem): void {
    this.catalogService
      .getDetailEnrichment(item.catalogId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((enrichment) => {
        if (this.item?.catalogId !== item.catalogId) {
          return; // the user has already navigated away from this item
        }

        this.item = {
          ...this.item,
          whereToWatch: enrichment.whereToWatch ?? this.item.whereToWatch,
          socialSummary: enrichment.socialSummary ?? this.item.socialSummary,
          userInteraction: enrichment.userInteraction ?? this.item.userInteraction,
        };

        if (enrichment.related.length && !this.relatedItems.length) {
          this.relatedItems = this.normalizeRelatedItems(enrichment.related, item.catalogId);
        } else if (!enrichment.related.length && !this.relatedItems.length) {
          this.loadFallbackRelated(item)
            .pipe(takeUntil(this.destroy$))
            .subscribe((related) => {
              if (this.item?.catalogId === item.catalogId) {
                this.relatedItems = related;
              }
            });
        }
      });
  }

  private loadFallbackRelated(item: CatalogItem) {
    const primaryQuery = this.buildFallbackRelatedQuery(item, true);
    return this.catalogService.query(primaryQuery).pipe(
      map((response) => this.normalizeRelatedItems(response.items, item.catalogId)),
      switchMap((related) => {
        if (related.length || item.contentType === 'program') {
          return of(related);
        }

        return this.catalogService.query(this.buildFallbackRelatedQuery(item, false)).pipe(
          map((response) => this.normalizeRelatedItems(response.items, item.catalogId))
        );
      }),
      catchError(() => of([]))
    );
  }

  private buildFallbackRelatedQuery(
    item: CatalogItem,
    strict: boolean
  ): CatalogQuery {
    const query: CatalogQuery = {
      types: [item.contentType],
      sort: item.contentType === 'program' ? 'airtime' : 'popular',
      limit: 8,
    };

    if (strict && item.genres?.length) {
      query.genres = item.genres.slice(0, item.contentType === 'program' ? 1 : 2);
    }

    if (
      strict &&
      item.contentType !== 'program' &&
      item.primaryPlatforms?.length
    ) {
      query.platforms = item.primaryPlatforms.slice(0, 1);
    }

    return query;
  }

  private normalizeRelatedItems(items: CatalogItem[], currentCatalogId: string): CatalogItem[] {
    const seen = new Set<string>();
    return (items || [])
      .filter((candidate) => Boolean(candidate?.catalogId) && candidate.catalogId !== currentCatalogId)
      .filter((candidate) => {
        if (seen.has(candidate.catalogId)) {
          return false;
        }
        seen.add(candidate.catalogId);
        return true;
      })
      .slice(0, 8);
  }

  private normalizeContentType(value: unknown): CatalogContentType | null {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'movie' || raw === 'series' || raw === 'program') {
      return raw;
    }
    return null;
  }

  private normalizeLegacyMode(value: unknown): LegacyCatalogMode | null {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'program' || raw === 'movie' || raw === 'series') {
      return raw;
    }
    return null;
  }

  private applyMeta(item: CatalogItem): void {
    const canonicalUrl = item.detailPath || this.router.url;
    const description =
      item.synopsis ||
      this.buildMetaDescription(item) ||
      'Ficha de contenido, plataformas, emisiones y relacionados en Guía TV.';

    this.metaService.setMetaTags({
      title: `${item.title} - Guía TV`,
      description,
      image: item.backdrop || item.image,
      canonicalUrl,
      type: 'article',
      robots: catalogRobotsPolicy(item),
    });
  }

  private buildMetaDescription(item: CatalogItem): string {
    const segments = [
      item.channel?.name,
      item.releaseYear ? String(item.releaseYear) : '',
      item.primaryPlatforms?.slice(0, 2).join(', '),
      item.genres?.slice(0, 2).join(', '),
    ].filter(Boolean);

    return segments.length ? segments.join(' · ') : '';
  }

  private buildStructuredData(item: CatalogItem): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas: object[] = [generateBreadcrumbSchema(this.breadcrumbItems, baseUrl)];

    if (item.contentType === 'series') {
      schemas.unshift(generateTVSeriesSchema(item, baseUrl));
    } else if (item.contentType === 'movie') {
      schemas.unshift(generateMovieSchema(item, baseUrl));
    }

    try {
      this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
        `<script type="application/ld+json">${JSON.stringify(schemas)}</script>`
      );
    } catch {
      this.safeLdHtml = null;
    }
  }

  private buildBreadcrumbs(item: CatalogItem): void {
    const typeLabels: Record<string, { label: string; path: string }> = {
      movie: { label: 'Películas', path: '/programacion-tv/peliculas' },
      series: { label: 'Series', path: '/programacion-tv/series' },
      program: { label: 'Programas', path: '/programacion-tv/guia-canales' },
    };
    const entry = typeLabels[item.contentType] || typeLabels['program'];
    this.breadcrumbItems = [
      { name: 'Inicio', url: '/' },
      { name: entry.label, url: entry.path },
      { name: item.title, url: item.detailPath || this.router.url },
    ];
  }
}
