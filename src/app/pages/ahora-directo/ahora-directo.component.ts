import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { first, takeUntil, Subject } from 'rxjs';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { CardListComponent } from 'src/app/components/card-list/card-list.component';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive, getHoraInicio } from 'src/app/utils/utils';
import { TvDataService } from 'src/app/state/tv-data.service';
import { ProgramsResponse, ProgramLayoutDTO, ChannelMetaDTO } from 'src/app/api/models';

@Component({
  selector: 'app-ahora-directo',
  standalone: true,
  imports: [CommonModule, NavBarComponent, CardListComponent],
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
    private svcGuide: TvGuideService,
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
      .loadPrograms({ date: 'today', fields: 'full', limit: 5000 })
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

  private processProgramsResponse(resp: ProgramsResponse): void {
    try {
      const programs = resp?.programs || [];
      const channelMap = new Map<string, ChannelMetaDTO>(
        (resp?.channels || []).map((c) => [c.id, c])
      );
      this.extractLivePrograms(programs, channelMap);
      this.error = null;
    } catch (err) {
      this.handleError(err);
    } finally {
      this.loading = false;
    }
  }

  private extractLivePrograms(
    programs: ProgramLayoutDTO[],
    channelMap: Map<string, ChannelMetaDTO>
  ): void {
    this.peliculas_live = [];
    this.series_live = [];

    programs.forEach((p) => {
      if (!isLive(p.start, p.end)) return;
      const channelMeta = channelMap.get(p.channelId || '') as ChannelMetaDTO;
      const media = this.resolveMedia(
        (p as any).image || (p as any).poster || (p as any).background
      );
      const mapped = {
        ...p,
        title: typeof p.title === 'object' ? p.title : { value: p.title },
        channel: channelMeta?.name || p.channelId,
        channelIcon: this.resolveIcon(channelMeta?.icon),
        image: media,
        poster: media,
        background: media,
      };
      if (this.isMovie(p)) {
        this.peliculas_live.push(mapped);
      } else if (this.isSeries(p)) {
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
      return getHoraInicio(start);
    } catch {
      return '';
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
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(
      `AHORA-DIRECTO - Datos procesados en ${duration}ms | Peliculas: ${this.peliculas_live.length} | Series: ${this.series_live.length}`
    );
  }

  private isMovie(p: ProgramLayoutDTO): boolean {
    const cat = (p.category || '').toLowerCase();
    return cat.includes('cine') || cat.includes('movie') || cat.includes('pel');
  }

  private isSeries(p: ProgramLayoutDTO): boolean {
    const cat = (p.category || '').toLowerCase();
    return cat.includes('serie') || cat.includes('series');
  }

  private resolveIcon(icon?: string | null): string | undefined {
    if (!icon) return undefined;
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
      return icon;
    }
    if (icon.startsWith('/')) {
      return (typeof window !== 'undefined' ? window.location.origin : '') + icon;
    }
    return icon;
  }

  private resolveMedia(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('/')) {
      return (typeof window !== 'undefined' ? window.location.origin : '') + url;
    }
    return url;
  }
}
