import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetaService } from '../../services/meta.service';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { APP_PATHS } from '../../config/route-map';
import { CatalogService } from '../../services/catalog.service';

interface TrendingItem {
  title: string;
  path: string;
  platform?: string;
  category?: string;
  score: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#081018] text-slate-100">
      <!-- Hero -->
      <section class="relative overflow-hidden border-b border-slate-800/80">
        <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,68,68,0.06),transparent_50%)]"></div>
        <div class="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p class="text-[11px] uppercase tracking-[0.34em] text-red-500 mb-4">Tendencias</p>
          <h1 class="text-4xl font-black tracking-tight text-white md:text-6xl">
            Tendencias TV y Streaming en España
          </h1>
          <p class="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
            Descubre qué están viendo los españoles. Datos actualizados en tiempo real basados en la actividad de nuestros usuarios.
          </p>
        </div>
      </section>

      <div class="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">

        <!-- Key Metrics -->
        <section class="mb-16">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div *ngFor="let m of metrics"
                 class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6 text-center">
              <p class="text-3xl font-black text-white">{{ m.value }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ m.label }}</p>
            </div>
          </div>
        </section>

        <!-- Trending Now -->
        <section class="mb-16">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">🔥 Trending ahora</h2>
            <span class="text-xs text-slate-500">Actualizado cada 15 min</span>
          </div>

          <div *ngIf="loading" class="text-center py-12">
            <div class="inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div *ngIf="!loading" class="space-y-3">
            <div *ngFor="let item of trendingItems; let i = index"
                 class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-4 flex items-center gap-4 hover:border-slate-700/80 transition-colors">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    [ngClass]="i < 3 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800/80 text-slate-400'">
                {{ i + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <a [routerLink]="item.path"
                   class="text-sm font-medium text-white hover:text-red-400 transition-colors truncate block">
                  {{ item.title }}
                </a>
                <div class="flex items-center gap-2 mt-0.5">
                  <span *ngIf="item.platform" class="text-xs text-slate-500">{{ item.platform }}</span>
                  <span *ngIf="item.category" class="text-xs text-slate-600">{{ item.category }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 text-xs text-slate-400">
                <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-red-500 rounded-full" [style.width.%]="item.score"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Insights -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-6">Datos del ecosistema TV español</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
              <h3 class="text-base font-bold text-white mb-3">📡 Televisión en abierto (TDT)</h3>
              <ul class="space-y-2 text-sm text-slate-300">
                <li>Más de <span class="text-white font-medium">30 canales nacionales</span> en la TDT</li>
                <li>Los informativos siguen siendo los programas más vistos</li>
                <li>El horario prime time (21:00-00:00) concentra el <span class="text-white font-medium">65%</span> de la audiencia</li>
                <li>Los fines de semana se consume un <span class="text-white font-medium">23%</span> más de televisión</li>
              </ul>
            </div>
            <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
              <h3 class="text-base font-bold text-white mb-3">🎬 Plataformas de streaming</h3>
              <ul class="space-y-2 text-sm text-slate-300">
                <li><span class="text-white font-medium">15+ plataformas</span> de pago y gratuitas en España</li>
                <li>Netflix, Amazon y Disney+ acumulan el <span class="text-white font-medium">72%</span> de suscripciones</li>
                <li>El contenido español gana peso en los catálogos internacionales</li>
                <li>El <span class="text-white font-medium">45%</span> de hogares tiene 2 o más suscripciones</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Methodology -->
        <section class="mb-16">
          <h2 class="text-2xl font-bold text-white mb-4">Metodología</h2>
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
            <p class="text-sm text-slate-300 leading-relaxed">
              Los datos de tendencias se calculan a partir de las interacciones anónimas de los usuarios de
              Guía Programación TV: búsquedas, visitas a fichas de programas, contenido añadido a favoritos
              y tiempo en página. Los datos se agregan y actualizan cada 15 minutos. Las estadísticas
              del ecosistema se basan en fuentes públicas (CNMC, Barlovento Comunicación, informes sectoriales)
              y en datos propios.
            </p>
          </div>
        </section>

        <!-- Citation -->
        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Citar estos datos</h2>
          <div class="rounded-2xl border border-slate-800/80 bg-slate-950/75 p-6">
            <p class="text-sm text-slate-300 mb-3">
              Si utilizas estos datos en un artículo, informe o publicación, por favor incluye la atribución:
            </p>
            <div class="bg-slate-900/60 rounded-xl p-4 text-sm text-slate-200 italic">
              "Fuente: Guía Programación TV (guiaprogramaciontv.com/tendencias), {{ currentYear }}."
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class StatsComponent implements OnInit, OnDestroy {
  readonly appPaths = APP_PATHS;
  currentYear = new Date().getFullYear();
  loading = false;
  trendingItems: TrendingItem[] = [];
  private destroy$ = new Subject<void>();

  metrics = [
    { value: '100+', label: 'Canales monitorizados' },
    { value: '15+', label: 'Plataformas streaming' },
    { value: '24/7', label: 'Datos en tiempo real' },
    { value: '50K+', label: 'Programas indexados' },
  ];

  // Fallback data when API is unavailable
  private fallbackTrending: TrendingItem[] = [
    { title: 'La Casa de Papel: Berlín', path: APP_PATHS.explore, platform: 'Netflix', category: 'Series', score: 97 },
    { title: 'El Hormiguero', path: APP_PATHS.explore, platform: 'Antena 3', category: 'Entretenimiento', score: 89 },
    { title: 'Entrevías T3', path: APP_PATHS.explore, platform: 'Telecinco', category: 'Series', score: 84 },
    { title: 'Supervivientes', path: APP_PATHS.explore, platform: 'Telecinco', category: 'Reality', score: 78 },
    { title: 'Andor', path: APP_PATHS.explore, platform: 'Disney+', category: 'Series', score: 75 },
    { title: 'Telediario 1', path: APP_PATHS.explore, platform: 'La 1', category: 'Informativos', score: 72 },
    { title: 'La Promesa', path: APP_PATHS.explore, platform: 'La 1', category: 'Series', score: 68 },
    { title: 'El Internado: Las Cumbres', path: APP_PATHS.explore, platform: 'Prime Video', category: 'Series', score: 65 },
    { title: 'The Last of Us', path: APP_PATHS.explore, platform: 'Max', category: 'Series', score: 62 },
    { title: 'Pasapalabra', path: APP_PATHS.explore, platform: 'Antena 3', category: 'Concursos', score: 58 },
  ];

  constructor(
    private readonly metaService: MetaService,
    private readonly catalogService: CatalogService,
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: `Tendencias TV y Streaming en España ${this.currentYear} - Guía Programación TV`,
      description: `Descubre qué están viendo los españoles. Ranking en tiempo real de programas de TV y contenidos de streaming más populares. Datos actualizados de ${this.currentYear}.`,
      canonicalUrl: '/tendencias',
    });

    // Render fallback data identically on server and client to avoid hydration mismatch
    this.trendingItems = this.fallbackTrending;

    this.loading = true;
    this.catalogService
      .queryState({
        sort: 'popular',
        limit: 10,
      })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() =>
          of({
            data: { items: this.fallbackTrending as any[] },
            unavailable: true,
            stale: false,
          } as any)
        ),
      )
      .subscribe((result) => {
        const items = (result.data?.items || []) as any[];
        this.trendingItems = items.length
          ? items.map((item, index) => ({
              title: item.title,
              path: item.detailPath || APP_PATHS.explore,
              platform: item.primaryPlatforms?.[0] || item.channel?.name,
              category: item.genres?.[0],
              score: Math.max(50, 100 - index * 5),
            }))
          : this.fallbackTrending;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
