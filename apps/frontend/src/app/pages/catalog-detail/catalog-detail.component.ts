import { CommonModule, isPlatformServer } from '@angular/common';
import { Component, ElementRef, Injector, OnDestroy, OnInit, PLATFORM_ID, ViewChild, afterNextRender, inject } from '@angular/core';
import { ActivatedRoute, Data, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { InteractionButtonsComponent } from '../../components/interaction-buttons/interaction-buttons.component';
import { WhereToWatchComponent } from '../../components/where-to-watch/where-to-watch.component';
import { EntityBroadcastListComponent } from '../../components/entity-broadcast-list/entity-broadcast-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { ShareButtonsComponent } from '../../components/share-buttons/share-buttons.component';
import {
  CatalogContentType,
  CatalogItem,
  CatalogQuery,
  CatalogRequestState,
  CatalogService,
} from '../../services/catalog.service';
import { MetaService } from '../../services/meta.service';
import { buildProgramCatalogId, buildTmdbCatalogId, splitAiringsByTime } from '../../utils/catalog';
import { catalogRobotsPolicy } from '../../utils/catalog-indexability';
import { fillLegacyGaps, scheduleView, ScheduleView } from '../../utils/legacy-enrichment';
import { broadcastPublication, GUIDE_TIME_ZONE } from '../entity-detail/entity-detail.model';
import { generateTVSeriesSchema, generateMovieSchema, generateBreadcrumbSchema, serializeJsonLd } from '../../utils/utils';
import { UnifiedSkeletonBlockComponent } from '../../components/unified-skeleton-block/unified-skeleton-block.component';
import { UnifiedAsyncStateComponent } from '../../components/unified-async-state/unified-async-state.component';
import { channelPath } from '../../config/route-map';

type LegacyCatalogMode = 'program' | 'movie' | 'series';
type CatalogAiring = NonNullable<CatalogItem['airings']>[number];

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CatalogRailComponent,
    InteractionButtonsComponent,
    WhereToWatchComponent,
    EntityBroadcastListComponent,
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
        <!-- Cinematic banner: image-backed, hero-* tokens only (constant-dark by design). Breadcrumb lives inside it (canal-completo pattern) instead of a separate strip above. -->
        <section class="relative overflow-hidden bg-[var(--hero-bg)]">
          <div class="absolute inset-0">
            <img
              *ngIf="content.backdrop || content.image"
              [src]="content.backdrop || content.image"
              [alt]="''"
              class="h-full w-full object-cover opacity-55"
            />
            <!-- No backdrop/poster at all (common for plain EPG programs without TMDB enrichment) — a flat hero-bg reads as broken, so fall back to the same accent-tinted radial wash canal-completo uses for channels with no artwork. -->
            <div
              *ngIf="!(content.backdrop || content.image)"
              class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--accent-live)_14%,transparent),transparent_38%),radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--accent-discover)_10%,transparent),transparent_32%)]"
            ></div>
            <div class="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--hero-bg)_98%,transparent)_0%,color-mix(in_oklch,var(--hero-bg)_78%,transparent)_55%,color-mix(in_oklch,var(--hero-bg)_45%,transparent)_100%)]"></div>
            <div class="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--hero-bg)_10%,transparent),var(--hero-bg)_100%)]"></div>
          </div>

          <div class="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
            <app-breadcrumb [items]="breadcrumbItems" [embedded]="true" [emitSchema]="false"></app-breadcrumb>
          </div>

          <div class="relative mx-auto flex min-h-[20rem] max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 md:flex-row md:items-end lg:px-8 lg:pt-8">
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

              <p *ngIf="content.enrichment?.metadata?.originalTitle as original" class="text-base text-[var(--hero-text-muted)]">
                <span class="sr-only">Título original: </span><i>{{ original }}</i>
              </p>

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

        <!--
          Body rhythm follows canal-completo.component.html: generous
          eyebrow+h2 sections separated by whitespace (mb-10/lg:mb-14),
          no hairline dividers between them — reads as one editorial page
          instead of a stacked settings form.
        -->
        <section class="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
          <div class="mb-10 flex flex-wrap items-center gap-3 lg:mb-14">
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
            class="mb-10 lg:mb-14"
          >
            <p class="eyebrow text-[var(--portal-text-muted)]">Disponibilidad</p>
            <h2 class="mt-1 text-xl font-bold tracking-tight text-[var(--portal-text)]">Dónde ver</h2>
            <div class="mt-4">
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
          </div>

          <div
            *ngIf="content.director || content.socialSummary?.friendsWhoWatched || content.userInteraction?.status || content.userInteraction?.rating"
            class="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--portal-text-soft)] lg:mb-14"
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

          <!--
            A programa page is schedule-centric like a canal (see
            canal-completo.component.html's "Ahora en emisión"/"A
            continuación" split) — for content.contentType === 'program'
            specifically, lead with that framing instead of the generic
            "Próximas emisiones" list movies/series get. Scoped strictly to
            'program' so the canal-style day-tabs/full-timeline themselves
            are intentionally NOT ported here — this is copy/grouping only.
          -->
          <!-- Phase 3E: with a verified schedule (movies/series) the section is the shared broadcast list; the legacy airings it does not contain follow it, so nothing listed before is dropped. -->
          <div *ngIf="schedule.verified as verified" class="mb-10 lg:mb-14">
            <app-entity-broadcast-list [broadcasts]="verified" [now]="now" [entityTitle]="content.title"></app-entity-broadcast-list>
            <div *ngIf="schedule.legacyOnly.length" class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ng-container *ngFor="let airing of schedule.legacyOnly">
                <ng-container *ngTemplateOutlet="airingCard; context: { $implicit: airing }"></ng-container>
              </ng-container>
            </div>
          </div>
          <div *ngIf="!schedule.verified && (nowAiring(content) || nextAirings(content).length)" class="mb-10 lg:mb-14">
            <ng-container *ngIf="content.contentType === 'program'; else genericAirings">
              <ng-container *ngIf="nowAiring(content) as live">
                <p class="eyebrow text-[var(--accent-live)]">En directo</p>
                <h2 class="mt-1 text-xl font-bold tracking-tight text-[var(--portal-text)]">Ahora en emisión</h2>
                <a
                  [routerLink]="live.detailPath || channelPath(live.channelId)"
                  class="tnum mt-4 flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--accent-live)] bg-[var(--accent-live-soft)] p-4 transition-colors"
                >
                  <span class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--portal-surface-strong)] sm:h-20 sm:w-20">
                    <ng-container *ngTemplateOutlet="airingThumb; context: { $implicit: live }"></ng-container>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-semibold text-[var(--portal-text)]">{{ live.title || live.channelName }}</span>
                    <span class="mt-1 block text-xs text-[var(--portal-text-muted)]">
                      {{ live.channelName }} · {{ formatTime(live.start) }} - {{ formatTime(live.end) }}
                    </span>
                  </span>
                  <span class="flex-shrink-0 text-xs font-semibold text-[var(--portal-text)] underline underline-offset-4">Ver canal →</span>
                </a>
              </ng-container>

              <ng-container *ngIf="nextAirings(content) as next">
                <ng-container *ngIf="next.length">
                  <p class="eyebrow text-[var(--portal-text-muted)]" [class.mt-6]="nowAiring(content)">TV lineal</p>
                  <h2 class="mt-1 text-xl font-bold tracking-tight text-[var(--portal-text)]">A continuación</h2>
                  <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <ng-container *ngFor="let airing of next">
                      <ng-container *ngTemplateOutlet="airingCard; context: { $implicit: airing }"></ng-container>
                    </ng-container>
                  </div>
                </ng-container>
              </ng-container>
            </ng-container>

            <ng-template #genericAirings>
              <p class="eyebrow text-[var(--portal-text-muted)]">TV lineal</p>
              <h2 class="mt-1 text-xl font-bold tracking-tight text-[var(--portal-text)]">Próximas emisiones</h2>
              <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <ng-container *ngFor="let airing of currentAndNextAirings(content)">
                  <ng-container *ngTemplateOutlet="airingCard; context: { $implicit: airing }"></ng-container>
                </ng-container>
              </div>
            </ng-template>
          </div>

          <!-- Shared airing-card row (thumbnail + title/time/CTA), used by both the
               program "A continuación" grid and the generic "Próximas emisiones" grid
               above — kept as one template so the "no aparecen imágenes" fix only
               needed to land once. -->
          <ng-template #airingCard let-airing>
            <a
              [routerLink]="airing.detailPath || channelPath(airing.channelId)"
              class="tnum flex gap-3 rounded-[var(--radius-md)] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-3 transition-colors hover:border-[var(--portal-border-strong)]"
            >
              <span class="h-16 w-12 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--portal-surface-strong)]">
                <ng-container *ngTemplateOutlet="airingThumb; context: { $implicit: airing }"></ng-container>
              </span>
              <span class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-[var(--portal-text)]">{{ airing.title || airing.channelName }}</p>
                <p class="mt-1 text-xs text-[var(--portal-text-muted)]">
                  {{ airing.channelName }} · {{ formatTime(airing.start) }} - {{ formatTime(airing.end) }}
                </p>
                <span class="mt-2 inline-block text-xs font-semibold text-[var(--portal-text)] underline underline-offset-4">
                  {{ airing.detailPath ? 'Ver qué se emite →' : 'Ver programación del canal →' }}
                </span>
              </span>
            </a>
          </ng-template>

          <!-- Program poster/still when the EPG source has one; the channel logo
               (already always available) as a legible fallback instead of a blank box. -->
          <ng-template #airingThumb let-airing>
            <img
              *ngIf="airing.image; else airingChannelIcon"
              [src]="airingThumbUrl(airing.image)"
              [alt]="''"
              loading="lazy"
              decoding="async"
              class="h-full w-full object-cover"
            />
            <ng-template #airingChannelIcon>
              <img
                *ngIf="airing.channelIcon"
                [src]="airing.channelIcon"
                [alt]="''"
                loading="lazy"
                class="h-full w-full object-contain p-2"
              />
            </ng-template>
          </ng-template>

          <!-- Cast: compact rail, photo when available, text-only fallback otherwise. -->
          <div *ngIf="content.cast?.length" class="group/rail relative mb-2">
            <p class="eyebrow text-[var(--portal-text-muted)]">Equipo</p>
            <h2 class="mt-1 text-xl font-bold tracking-tight text-[var(--portal-text)]">Reparto</h2>

            <!-- Click arrows for desktop — dragging a rail with a mouse is fiddly; touch swipe already covers mobile, so these stay md+ only. -->
            <button
              *ngIf="content.cast!.length > 4"
              type="button"
              aria-label="Desplazar reparto hacia la izquierda"
              class="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 translate-y-2 items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-2 text-[var(--portal-text)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex"
              (click)="scrollCastBy(-1)"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m12.5 4.5-5 5.5 5 5.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
              </svg>
            </button>
            <button
              *ngIf="content.cast!.length > 4"
              type="button"
              aria-label="Desplazar reparto hacia la derecha"
              class="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 translate-y-2 items-center justify-center rounded-full border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] p-2 text-[var(--portal-text)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex"
              (click)="scrollCastBy(1)"
            >
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m7.5 4.5 5 5.5-5 5.5" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path>
              </svg>
            </button>

            <div #castScrollEl class="scrollbar-hide mt-4 flex gap-4 overflow-x-auto scroll-smooth pb-2">
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
          <footer *ngIf="content.enrichment?.attribution as attribution" class="mt-10 border-t border-[var(--portal-border)] pt-6 text-xs leading-5 text-[var(--portal-text-muted)]">
            <p>{{ attribution.notice }} <a href="https://www.themoviedb.org" rel="noopener noreferrer" class="underline underline-offset-4">themoviedb.org</a></p>
            <p>Datos actualizados el <time [attr.datetime]="attribution.updatedAt">{{ updatedOn(attribution.updatedAt) }}</time>.</p>
          </footer>
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
  protected readonly channelPath = channelPath;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly metaService = inject(MetaService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroy$ = new Subject<void>();

  public item: CatalogItem | null = null;
  public relatedItems: CatalogItem[] = [];
  public loading = true;
  private loadFailed = false;
  public safeLdHtml: SafeHtml | null = null;
  public breadcrumbItems: BreadcrumbItem[] = [];
  public shareUrl = '';
  /** Phase 3E: verified schedule for movies/series (`verified` null = the legacy schedule renders as before). */
  public schedule: ScheduleView = { verified: null, legacyOnly: [] };
  /** The clock relative times are measured against: the API's `generatedAt` while rendering on the server, the browser's after. */
  public now = new Date();
  private readonly server = isPlatformServer(inject(PLATFORM_ID));
  private readonly injector = inject(Injector);

  @ViewChild('castScrollEl') private readonly castScrollEl?: ElementRef<HTMLElement>;

  scrollCastBy(direction: 1 | -1): void {
    const el = this.castScrollEl?.nativeElement;
    if (!el) {
      return;
    }
    // Explicit `behavior: 'instant'` (not the legacy 2-arg scrollBy(x, y),
    // which resolves to 'auto' and so still defers to CSS `scroll-behavior`)
    // — some automated/headless browsers silently no-op a smooth scrollBy,
    // and 'instant' is the one value guaranteed to actually move the
    // container regardless of any `scroll-smooth` class on it.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'instant' as ScrollBehavior });
  }

  ngOnInit(): void {
    if (!this.server) {
      // Browser only: a repeating timer on the server would keep the render from ever settling.
      afterNextRender(() => {
        const id = setInterval(() => { this.now = new Date(); if (this.item) this.schedule = scheduleView(this.item); }, 30_000);
        this.destroy$.subscribe(() => clearInterval(id));
      }, { injector: this.injector });
    }
    combineLatest([this.route.paramMap, this.route.data])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, data]) => {
          this.loading = true;
          this.item = null;
          this.relatedItems = [];

          this.loadFailed = false;
          return this.resolveCatalogItem(params, data).pipe(
            switchMap((state) => {
              const item = state.data;
              // 404/410 = the item does not exist. Anything else (429, 5xx, timeout) is a
              // backend failure and must not be served as a cacheable "not found".
              this.loadFailed = !item && state.unavailable && state.status !== 404 && state.status !== 410;
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
        // Meta and robots come from the legacy payload as received; only the page body and structured data see the verified fill-ins.
        const shown = item ? fillLegacyGaps(item) : item;
        this.item = shown;
        this.relatedItems = related;
        this.loading = false;
        this.presentSchedule(shown);

        if (item && shown) {
          this.applyMeta(item);
          this.buildBreadcrumbs(item);
          this.buildStructuredData(shown);
          this.shareUrl = `https://guiaprogramaciontv.com${this.canonicalPath()}`;
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
          canonicalUrl: null,
          robots: this.loadFailed ? 'noindex, nofollow' : 'noindex, follow',
          httpStatus: this.loadFailed ? 503 : 404,
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

  // For contentType 'program' only — splits content.airings (current airing +
  // relatedChannelItems, per CatalogService.getProgramDetail) into the
  // "ahora en emisión" / "a continuación" framing borrowed from
  // canal-completo.component.html, instead of one flat "Próximas emisiones"
  // list.
  nowAiring(item: CatalogItem): CatalogAiring | null {
    return splitAiringsByTime(item.airings).current;
  }

  nextAirings(item: CatalogItem): CatalogAiring[] {
    return splitAiringsByTime(item.airings).upcoming;
  }

  /** Movies/series "Próximas emisiones": the airing on now, then the upcoming ones; never finished ones. */
  currentAndNextAirings(item: CatalogItem): CatalogAiring[] {
    const { current, upcoming } = splitAiringsByTime(item.airings);
    return current ? [current, ...upcoming] : upcoming;
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

  /** Airing-card thumbnails are small (3-5rem) — no need for a full-size TMDb image. */
  airingThumbUrl(value: string): string {
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
  ): Observable<CatalogRequestState<CatalogItem | null>> {
    const missing = of<CatalogRequestState<CatalogItem | null>>({ data: null, unavailable: false, stale: false });
    const catalogId = decodeURIComponent(String(params.get('catalogId') || '')).trim();
    if (catalogId) {
      return this.catalogService.getDetailState(catalogId);
    }

    const slug = decodeURIComponent(String(params.get('slug') || '')).trim();
    const contentType = this.normalizeContentType(data['contentType']);
    if (slug && contentType) {
      return this.catalogService.getBySlugState(contentType, slug);
    }

    const legacyId = decodeURIComponent(String(params.get('id') || '')).trim();
    const legacyMode = this.normalizeLegacyMode(data['legacyCatalogMode']);
    if (!legacyId || !legacyMode) {
      return missing;
    }

    if (legacyMode === 'program') {
      return this.catalogService.getDetailState(buildProgramCatalogId(legacyId));
    }

    const tmdbId = Number(legacyId);
    if (!Number.isFinite(tmdbId)) {
      return missing;
    }

    return this.catalogService.getDetailState(
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

  /**
   * The requested path, which is the URL this page has always been served and indexed under. `item.detailPath` is
   * not used: it is rebuilt from the inferred content type and title (a /programas/ page can yield /series/…), and
   * nothing guarantees that URL resolves to this item. The persistent entity canonical replaces this in Phase 2D-6.
   */
  private canonicalPath(): string {
    return this.router.url.split(/[?#]/)[0];
  }

  private applyMeta(item: CatalogItem): void {
    const canonicalUrl = this.canonicalPath();
    const description =
      item.synopsis ||
      this.buildMetaDescription(item) ||
      'Ficha de contenido, plataformas, emisiones y relacionados en Guía TV.';

    this.metaService.setMetaTags({
      title: this.buildMetaTitle(item),
      description,
      image: item.backdrop || item.image,
      canonicalUrl,
      type: 'article',
      robots: catalogRobotsPolicy(item),
    });
  }

  /** "<title>: <intent> | Guía TV", kept under ~65 characters so titles are not cut in results. */
  private buildMetaTitle(item: CatalogItem): string {
    const suffix = item.contentType === 'program' ? ': cuándo ver en TV | Guía TV' : ': dónde ver | Guía TV';
    return `${MetaService.clamp(item.title, 65 - suffix.length)}${suffix}`;
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

  private presentSchedule(item: CatalogItem | null): void {
    const generated = item?.enrichment?.broadcasts?.generatedAt ? new Date(item.enrichment.broadcasts.generatedAt) : null;
    this.now = this.server && generated && !Number.isNaN(generated.getTime()) ? generated : new Date();
    this.schedule = item ? scheduleView(item, this.now.getTime()) : { verified: null, legacyOnly: [] };
  }

  updatedOn(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('es-ES', { timeZone: GUIDE_TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  private buildStructuredData(item: CatalogItem): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schemas: object[] = [generateBreadcrumbSchema(this.breadcrumbItems, baseUrl)];

    // The generators assume /series/ or /peliculas/ + slug; the page's URL is its canonical (see canonicalPath).
    const url = `${baseUrl}${this.canonicalPath()}`;
    if (item.contentType === 'series') {
      schemas.unshift({ ...generateTVSeriesSchema(item, baseUrl), url });
    } else if (item.contentType === 'movie') {
      // One Movie per page: the verified original title and broadcasts extend it, they never add a second entity for the same work.
      const original = item.enrichment?.metadata?.originalTitle;
      const publication = broadcastPublication(item.enrichment?.broadcasts, baseUrl);
      schemas.unshift({
        ...generateMovieSchema(item, baseUrl), url,
        ...(original ? { alternateName: original } : {}),
        ...(publication.length ? { publication } : {}),
      });
    }

    try {
      this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
        `<script type="application/ld+json">${serializeJsonLd(schemas)}</script>`
      );
    } catch {
      this.safeLdHtml = null;
    }
  }

  private buildBreadcrumbs(item: CatalogItem): void {
    const typeLabels: Record<string, { label: string; path: string }> = {
      movie: { label: 'Películas', path: '/programacion-tv/peliculas' },
      series: { label: 'Series', path: '/programacion-tv/series' },
      program: { label: 'Programas', path: '/programacion-tv/en-directo' },
    };
    const entry = typeLabels[item.contentType] || typeLabels['program'];
    this.breadcrumbItems = [
      { name: 'Inicio', url: '/' },
      { name: entry.label, url: entry.path },
      { name: item.title, url: this.canonicalPath() },
    ];
  }
}
