import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { first, takeUntil, Subject } from 'rxjs';
import { CardListComponent } from 'src/app/components/card-list/card-list.component';
import { MetaService } from 'src/app/services/meta.service';
import { normalizePublicImageUrl } from 'src/app/utils/media-url';
import { TvDataService } from 'src/app/state/tv-data.service';
import { TvReadItemDTO, TvReadResponseDTO } from 'src/app/api/models';

@Component({
  selector: 'app-ahora-directo',
  standalone: true,
  imports: [CommonModule, CardListComponent],
  templateUrl: './ahora-directo.component.html',
  styleUrls: ['./ahora-directo.component.scss'],
})
export class AhoraDirectoComponent implements OnInit, OnDestroy {
  // UI state
  public isPelicula = true;
  public isSerie = false;
  public loading = true;
  public error: string | null = null;

  // Data arrays
  public programs: any[] = [];
  public peliculas_live: any[] = [];
  public series_live: any[] = [];

  // JSON-LD structured data
  public ldJson: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private metaSvc: MetaService,
    private router: Router,
    private tvData: TvDataService
  ) {}

  ngOnInit(): void {
    // SEO optimizado
    this.metaSvc.setMetaTags({
      title: 'En Directo Ahora | Peliculas y Series en TV Espana',
      description:
        'Descubre que se emite ahora mismo en la television espanola. Peliculas, series y programas en directo con informacion actualizada en tiempo real.',
      canonicalUrl: this.router.url,
      keywords:
        'tv en directo, peliculas ahora, series ahora, television en vivo espana',
      ogImage: '/assets/images/directo-og.jpg',
    });

    this.buildJsonLd();
    this.loadProgramData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildJsonLd(): void {
    try {
      const pageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Programacion en Directo | TV Espana',
        description:
          'Guia de programacion en directo de television en Espana: peliculas, series y programas que se emiten ahora mismo.',
        url: this.router.url,
        inLanguage: 'es-ES',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Guia TV Espana',
          url: typeof window !== 'undefined' ? window.location.origin : '',
        },
      };

      this.ldJson = JSON.stringify(pageLd, null, 2);
    } catch (e) {
      this.ldJson = '';
    }
  }

  private loadProgramData(): void {
    const startTime = performance.now();

    this.tvData
      .loadReadView('today', { view: 'now', limit: 2000 })
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.processProgramsResponse(resp);
          this.logPerformance(startTime);
        },
        error: (err) => {
          this.handleError(err);
        },
      });
  }

  private processProgramsResponse(resp: TvReadResponseDTO): void {
    try {
      const items = resp?.items || [];
      this.extractLivePrograms(items);
      this.error = null;
    } catch (err) {
      this.handleError(err);
    } finally {
      this.loading = false;
    }
  }

  private extractLivePrograms(items: TvReadItemDTO[]): void {
    this.peliculas_live = [];
    this.series_live = [];

    items.forEach((item) => {
      if (!item.airing.liveNow) return;
      const media = this.resolveMedia(
        item.assets.poster?.url ||
          ((item.assets.primary?.kind === 'poster' ||
            item.assets.primary?.kind === 'backdrop')
            ? item.assets.primary?.url
            : undefined)
      );
      const mapped = {
        id: item.id,
        title: { value: item.program.title },
        category: item.program.editorialCategory || item.program.genre || '',
        start: item.airing.start,
        end: item.airing.end,
        channelId: item.channel.id,
        channel: item.channel.name,
        channelIcon: this.resolveIcon(item.channel.icon),
        image: media,
        poster: media,
        background: media,
        liveNow: item.airing.liveNow,
      };
      if (this.isMovie(mapped)) {
        this.peliculas_live.push(mapped);
      } else if (this.isSeries(mapped)) {
        this.series_live.push(mapped);
      }
    });

    this.peliculas_live = this.peliculas_live.slice(0, 30);
    this.series_live = this.series_live.slice(0, 30);
    this.programs = [...this.peliculas_live];
  }

  // Switch to movies view
  public getPeliculasAhora(): void {
    if (this.isPelicula) return;

    this.isPelicula = true;
    this.isSerie = false;
    this.programs = [...this.peliculas_live];

    this.metaSvc.setMetaTags({
      title: 'Peliculas en Directo Ahora | TV Espana',
      description: `${this.peliculas_live.length} peliculas emitiendose ahora mismo en television espanola.`,
    });
  }

  // Switch to series view
  public getSeriesAhora(): void {
    if (this.isSerie) return;

    this.isPelicula = false;
    this.isSerie = true;
    this.programs = [...this.series_live];

    this.metaSvc.setMetaTags({
      title: 'Series en Directo Ahora | TV Espana',
      description: `${this.series_live.length} series emitiendose ahora mismo en television espanola.`,
    });
  }

  public horaInicio(item: any): string {
    try {
      const start =
        item?.start || item?.startDate || item?.date || item?.start_time;
      if (!start) return '';

      const date = new Date(start);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '';
    }
  }

  public getCorrectedDate(dateStr: string): Date {
    try {
      if (!dateStr) return new Date();
      // No longer applying -2 hour correction, just return the date as-is
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  }

  public getProgressDate(dateStr: string): Date {
    try {
      if (!dateStr) {
        return new Date();
      }
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  }

  public onLogoError(event: Event, programa: any): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.dataset['errorHandled']) {
      img.dataset['errorHandled'] = 'true';
      img.style.display = 'none';
    }
  }

  public trackById(index: number, item: any): any {
    return item?.id || item?.channelId || item?.start || index;
  }

  private handleError(err: any): void {
    console.error('AHORA-DIRECTO - Error:', err);
    this.error =
      'No se pudo cargar la programacion en directo. Intenta recargar la pagina.';
    this.loading = false;
  }

  private logPerformance(startTime: number): void {
    void startTime;
  }

  private isMovie(p: { category?: string }): boolean {
    const cat = (p.category || '').toLowerCase();
    return cat.includes('cine') || cat.includes('movie') || cat.includes('pel');
  }

  private isSeries(p: { category?: string }): boolean {
    const cat = (p.category || '').toLowerCase();
    return cat.includes('serie') || cat.includes('series');
  }

  private resolveIcon(icon?: string | null): string | undefined {
    if (!icon) return undefined;
    return normalizePublicImageUrl(icon);
  }

  private resolveMedia(url?: string | null): string | undefined {
    if (!url) return undefined;
    return normalizePublicImageUrl(url);
  }
}
