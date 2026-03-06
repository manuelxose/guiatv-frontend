import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { CatalogCardComponent } from '../../components/catalog-card/catalog-card.component';
import { InteractionButtonsComponent } from '../../components/interaction-buttons/interaction-buttons.component';
import { WhereToWatchComponent } from '../../components/where-to-watch/where-to-watch.component';
import { CatalogItem, CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavBarComponent,
    CatalogCardComponent,
    InteractionButtonsComponent,
    WhereToWatchComponent,
  ],
  template: `
    <div class="min-h-screen bg-[#081018] text-slate-100">
      <app-nav-bar></app-nav-bar>

      <div *ngIf="loading" class="flex min-h-[60vh] items-center justify-center">
        <div class="h-12 w-12 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
      </div>

      <ng-container *ngIf="!loading && item as content">
        <section class="relative overflow-hidden border-b border-slate-800/80">
          <div class="absolute inset-0">
            <img
              *ngIf="content.backdrop || content.image"
              [src]="content.backdrop || content.image"
              [alt]="content.title"
              class="h-full w-full object-cover opacity-35"
            />
            <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,16,24,0.12),rgba(8,16,24,0.98))]"></div>
          </div>

          <div class="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pt-20">
            <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
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
                    class="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-200"
                  >
                    {{ platform }}
                  </span>
                </div>

                <div>
                  <h1 class="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
                    {{ content.title }}
                  </h1>
                  <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <span *ngIf="content.releaseYear">{{ content.releaseYear }}</span>
                    <span *ngIf="content.durationMinutes">{{ content.durationMinutes }} min</span>
                    <span *ngIf="content.channel?.name">{{ content.channel?.name }}</span>
                    <span *ngIf="content.start">{{ formatTime(content.start) }}</span>
                    <span *ngIf="content.rating" class="text-amber-300">
                      {{ content.rating | number:'1.0-1' }}/10
                    </span>
                  </div>
                </div>

                <p class="max-w-3xl text-base leading-8 text-slate-300">
                  {{ content.synopsis || 'Sinopsis no disponible.' }}
                </p>

                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let genre of content.genres"
                    class="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200"
                  >
                    {{ genre }}
                  </span>
                </div>

                <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/75 p-4">
                  <app-interaction-buttons
                    [itemId]="content.catalogId"
                    [title]="content.title"
                    [type]="content.contentType"
                    [tmdbId]="content.tmdbId"
                    [genres]="content.genres"
                  ></app-interaction-buttons>
                </div>
              </div>

              <aside class="space-y-6">
                <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-6">
                  <p class="mb-3 text-[11px] uppercase tracking-[0.32em] text-slate-500">Dónde ver</p>
                  <app-where-to-watch
                    [providersData]="content.whereToWatch"
                    [tmdbId]="content.tmdbId"
                    [contentType]="providerContentType(content)"
                  ></app-where-to-watch>
                </div>

                <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/80 p-6">
                  <p class="mb-4 text-[11px] uppercase tracking-[0.32em] text-slate-500">Ficha</p>
                  <div class="space-y-3 text-sm text-slate-300">
                    <p *ngIf="content.director"><span class="text-slate-500">Dirección:</span> {{ content.director }}</p>
                    <p *ngIf="content.socialSummary?.friendsWhoWatched">
                      <span class="text-slate-500">Tus amigos:</span>
                      {{ content.socialSummary?.friendsWhoWatched }} lo han visto
                    </p>
                    <p *ngIf="content.userInteraction?.status">
                      <span class="text-slate-500">Tu estado:</span>
                      {{ humanStatus(content.userInteraction?.status || '') }}
                    </p>
                    <p *ngIf="content.userInteraction?.rating">
                      <span class="text-slate-500">Tu nota:</span>
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
          <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/75 p-6">
            <p class="mb-4 text-[11px] uppercase tracking-[0.32em] text-slate-500">Próximas emisiones</p>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div
                *ngFor="let airing of content.airings"
                class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
              >
                <p class="text-sm font-semibold text-white">{{ airing.channelName }}</p>
                <p class="mt-1 text-xs text-slate-400">
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
          <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-950/75 p-6">
            <p class="mb-4 text-[11px] uppercase tracking-[0.32em] text-slate-500">Reparto</p>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <div
                *ngFor="let cast of content.cast"
                class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
              >
                <p class="font-semibold text-white">{{ cast.name }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ cast.character || 'Reparto' }}</p>
              </div>
            </div>
          </div>
        </section>

        <section
          *ngIf="content.related?.length"
          class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div class="mb-5">
            <p class="text-[11px] uppercase tracking-[0.32em] text-slate-500">Relacionados</p>
            <h2 class="mt-1 text-2xl font-semibold text-white">Sigue explorando</h2>
          </div>
          <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <app-catalog-card
              *ngFor="let related of content.related"
              [item]="related"
            ></app-catalog-card>
          </div>
        </section>
      </ng-container>
    </div>
  `,
})
export class CatalogDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly destroy$ = new Subject<void>();

  public item: CatalogItem | null = null;
  public loading = true;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.loading = true;
          const catalogId = decodeURIComponent(String(params.get('catalogId') || ''));
          return this.catalogService.getDetail(catalogId);
        })
      )
      .subscribe((item) => {
        this.item = item;
        this.loading = false;
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
}
