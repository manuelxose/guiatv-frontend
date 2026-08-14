import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Data, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { combineLatest, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CatalogCardComponent } from '../../components/catalog-card/catalog-card.component';
import { InteractionButtonsComponent } from '../../components/interaction-buttons/interaction-buttons.component';
import { WhereToWatchComponent } from '../../components/where-to-watch/where-to-watch.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { ShareButtonsComponent } from '../../blog/components/share-buttons/share-buttons.component';
import {
  CatalogContentType,
  CatalogItem,
  CatalogQuery,
  CatalogService,
} from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';
import { buildProgramCatalogId, buildTmdbCatalogId } from '../../utils/catalog';
import { generateTVSeriesSchema, generateMovieSchema, generateBreadcrumbSchema } from '../../utils/utils';

type LegacyCatalogMode = 'program' | 'movie' | 'series';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CatalogCardComponent,
    InteractionButtonsComponent,
    WhereToWatchComponent,
    BreadcrumbComponent,
    ShareButtonsComponent,
  ],
  template: `
    <div class="min-h-screen bg-[var(--portal-bg)] text-[var(--portal-text)]">
      <div *ngIf="safeLdHtml" [innerHTML]="safeLdHtml"></div>
      <div *ngIf="loading" class="flex min-h-[60vh] items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
      </div>

      <ng-container *ngIf="!loading && item as content; else emptyState">
        <div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <app-breadcrumb [items]="breadcrumbItems"></app-breadcrumb>
        </div>
        <section class="relative overflow-hidden border-b border-[var(--portal-border)] bg-slate-950">
          <div class="absolute inset-0">
            <img
              *ngIf="content.backdrop || content.image"
              [src]="content.backdrop || content.image"
              [alt]="content.title"
              class="h-full w-full object-cover opacity-55"
            />
            <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,18,0.98)_0%,rgba(5,10,18,0.88)_48%,rgba(5,10,18,0.58)_100%)]"></div>
            <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,18,0.18),rgba(5,10,18,0.92))]"></div>
          </div>

          <div class="relative mx-auto flex min-h-[30rem] max-w-7xl items-end px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pt-16">
            <div class="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div class="space-y-6">
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngIf="content.liveNow"
                    class="rounded-full border border-red-500/40 bg-red-600/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white"
                  >
                    En directo
                  </span>
                  <span
                    *ngFor="let platform of content.primaryPlatforms.slice(0, 3)"
                    class="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-sm"
                  >
                    {{ platform }}
                  </span>
                </div>

                <div>
                  <h1 class="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
                    {{ content.title }}
                  </h1>
                  <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
                    <span *ngIf="content.releaseYear">{{ content.releaseYear }}</span>
                    <span *ngIf="content.durationMinutes">{{ content.durationMinutes }} min</span>
                    <span *ngIf="content.channel?.name">{{ content.channel?.name }}</span>
                    <span *ngIf="content.start">{{ formatTime(content.start) }}</span>
                    <span *ngIf="content.rating" class="text-amber-300">
                      {{ content.rating | number:'1.0-1' }}/10
                    </span>
                  </div>
                </div>

                <p class="max-w-3xl text-base leading-8 text-white/80">
                  {{ content.synopsis || 'Sinopsis no disponible.' }}
                </p>

                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let genre of content.genres"
                    class="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm"
                  >
                    {{ genre }}
                  </span>
                </div>

                <div class="space-y-4 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-4 shadow-xl">
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
                  <div class="border-t border-[var(--portal-border)] pt-3">
                    <app-share-buttons [url]="shareUrl" [title]="content.title"></app-share-buttons>
                  </div>
                </div>
              </div>

              <aside class="space-y-6">
                <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-xl">
                  <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--portal-text-muted)]">Dónde ver</p>
                  <app-where-to-watch
                    [providersData]="content.whereToWatch"
                    [primaryPlatforms]="content.primaryPlatforms"
                    [tmdbId]="content.tmdbId"
                    [contentType]="providerContentType(content)"
                  ></app-where-to-watch>
                </div>

                <div class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-xl">
                  <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--portal-text-muted)]">Detalles</p>
                  <div class="space-y-3 text-sm text-[var(--portal-text-soft)]">
                    <p *ngIf="content.director"><span class="text-[var(--portal-text-muted)]">Dirección:</span> {{ content.director }}</p>
                    <p *ngIf="content.socialSummary?.friendsWhoWatched">
                      <span class="text-[var(--portal-text-muted)]">Tus amigos:</span>
                      {{ content.socialSummary?.friendsWhoWatched }} lo han visto
                    </p>
                    <p *ngIf="content.userInteraction?.status">
                      <span class="text-[var(--portal-text-muted)]">Tu estado:</span>
                      {{ humanStatus(content.userInteraction?.status || '') }}
                    </p>
                    <p *ngIf="content.userInteraction?.rating">
                      <span class="text-[var(--portal-text-muted)]">Tu nota:</span>
                      {{ content.userInteraction?.rating }}/10
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section
          *ngIf="content.airings?.length"
          class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        >
          <div class="rounded-[1.75rem] border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6">
            <p class="mb-4 text-[11px] uppercase tracking-[0.32em] text-[var(--portal-text-muted)]">Próximas emisiones</p>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div
                *ngFor="let airing of content.airings"
                class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-4"
              >
                <p class="text-sm font-semibold text-[var(--portal-text)]">{{ airing.channelName }}</p>
                <p class="mt-1 text-xs text-[var(--portal-text-muted)]">
                  {{ formatTime(airing.start) }} - {{ formatTime(airing.end) }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          *ngIf="content.cast?.length"
          class="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"
        >
          <div class="rounded-[1.75rem] border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] p-6">
            <p class="mb-4 text-[11px] uppercase tracking-[0.32em] text-[var(--portal-text-muted)]">Reparto</p>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <div
                *ngFor="let cast of content.cast"
                class="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-4"
              >
                <p class="font-semibold text-[var(--portal-text)]">{{ cast.name }}</p>
                <p class="mt-1 text-xs text-[var(--portal-text-muted)]">{{ cast.character || 'Reparto' }}</p>
              </div>
            </div>
          </div>
        </section>

        <section
          *ngIf="relatedItems.length"
          class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div class="mb-5">
            <p class="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-text-muted)]">Relacionados</p>
            <h2 class="mt-1 text-2xl font-semibold text-[var(--portal-text)]">Sigue explorando</h2>
          </div>
          <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <app-catalog-card
              *ngFor="let related of relatedItems"
              [item]="related"
            ></app-catalog-card>
          </div>
        </section>
      </ng-container>

      <ng-template #emptyState>
        <div *ngIf="!loading" class="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
          <p class="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-text-muted)]">Contenido no disponible</p>
          <h1 class="mt-3 text-3xl font-black tracking-tight text-[var(--portal-text)]">No hemos podido cargar esta ficha</h1>
          <p class="mt-3 text-sm leading-7 text-[var(--portal-text-muted)]">
            Puede que el contenido ya no esté disponible o que la URL antigua no tenga una correspondencia válida.
          </p>
          <a
            routerLink="/programacion-tv/que-ver-hoy"
            class="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] px-5 text-sm font-semibold text-[var(--portal-text)]"
          >
            Volver a explorar
          </a>
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
          this.buildStructuredData(item);
          this.buildBreadcrumbs(item);
          this.shareUrl = `https://guiaprogramaciontv.com${item.detailPath || this.router.url}`;
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
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
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
    let schema: object;

    if (item.contentType === 'series') {
      schema = generateTVSeriesSchema(item, baseUrl);
    } else if (item.contentType === 'movie') {
      schema = generateMovieSchema(item, baseUrl);
    } else {
      this.safeLdHtml = null;
      return;
    }

    try {
      this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
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
