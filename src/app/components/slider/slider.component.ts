import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { getHoraInicio, formatCorrectTime, slugify } from 'src/app/utils/utils';
import { CommonModule } from '@angular/common';
import { TvGuideService } from 'src/app/services/tv-guide.service';

/**
 * SliderComponent - Native Implementation
 * - Sin dependencias externas (NO Embla)
      !this._loggedFirst &&
      this.variant === 'peliculas' // only auto-log when slider is for movies
 * - SSR-friendly con hidratación progresiva
 * - Lazy loading de imágenes optimizado
 * - Touch gestures nativos
 */
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() key?: string;
  @Input() programas: any[] = [];
  @Input() variant: 'canales' | 'peliculas' | 'series' | 'default' = 'default';
  @Input() logo?: string = '';

  @ViewChild('scrollContainer', { static: false })
  scrollContainer?: ElementRef<HTMLElement>;

  public isBrowser = false;
  private scrollTimeout: any = null;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;

  // Placeholders para lazy loading
  public readonly posterPlaceholder =
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 800 450%27%3E%3Crect width=%27800%27 height=%27450%27 fill=%27%23111827%27/%3E%3C/svg%3E';
  public readonly logoPlaceholder =
    'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 400%27%3E%3Crect width=%27400%27 height=%27400%27 fill=%27%23111827%27/%3E%3C/svg%3E';

  constructor(
    private guiatvSvc: TvGuideService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.scrollContainer) return;

    // Setup Intersection Observer para lazy loading
    this.setupIntersectionObserver();

    // Setup Resize Observer para mantener scroll position
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              try {
                this.intersectionObserver?.unobserve(img);
              } catch (_) {}
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    // Observar todas las imágenes con data-src
    setTimeout(() => {
      const images =
        this.scrollContainer?.nativeElement.querySelectorAll('img[data-src]');
      images?.forEach((img) => this.intersectionObserver?.observe(img));
    }, 100);
  }

  private setupResizeObserver(): void {
    if (!('ResizeObserver' in window)) return;

    this.resizeObserver = new ResizeObserver(() => {
      // Revalidar scroll cuando cambia el tamaño
      this.cdr.markForCheck();
    });

    if (this.scrollContainer?.nativeElement) {
      this.resizeObserver.observe(this.scrollContainer.nativeElement);
    }
  }

  // Navegación con smooth scroll
  public scrollTo(direction: 'prev' | 'next'): void {
    if (!this.scrollContainer?.nativeElement) return;

    const container = this.scrollContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8; // 80% del ancho visible

    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }

  public next(): void {
    this.scrollTo('next');
  }

  public prev(): void {
    this.scrollTo('prev');
  }

  // Backwards-compatible
  public onNextClick(): void {
    this.next();
  }

  public onPrevClick(): void {
    this.prev();
  }

  public hasMultipleSlides(): boolean {
    return Array.isArray(this.programas) && this.programas.length > 1;
  }

  public canScrollPrev(): boolean {
    if (!this.scrollContainer?.nativeElement) return false;
    return this.scrollContainer.nativeElement.scrollLeft > 10;
  }

  public canScrollNext(): boolean {
    if (!this.scrollContainer?.nativeElement) return false;
    const container = this.scrollContainer.nativeElement;
    const maxScroll = container.scrollWidth - container.clientWidth;
    return container.scrollLeft < maxScroll - 10;
  }

  public horaInicio(i: number): string {
    try {
      return getHoraInicio(this.programas[i].start);
    } catch (_) {
      return '';
    }
  }

  public isFirst(index: number): boolean {
    return index === 0;
  }

  public horaFin(i: number): string {
    try {
      const p = this.programas[i] || {};
      const endRaw = p.end || p.stop || p.endTime || p.stop_date || p?.stopDate;
      return endRaw ? formatCorrectTime(endRaw) : '';
    } catch (_) {
      return '';
    }
  }

  manageData(programa: any): void {
    if (!programa) return;
    // Heuristics to detect type: movie, series, program or channel-only
    const titleValue =
      (programa?.title && (programa.title.value || programa.title)) ||
      programa?.name ||
      '';

    const categoryValue =
      (programa?.category && (programa.category.value || programa.category)) ||
      '';

    const looksLikeChannelOnly =
      !!programa?.programs ||
      (!programa?.title &&
        !programa?.start &&
        !programa?.stop &&
        (programa?.name || programa?.id));

    // If it's clearly a channel object (no program fields), navigate to channel page
    if (looksLikeChannelOnly) {
      const slug = slugify(
        programa?.name || programa?.channel || programa?.id || ''
      );
      this.router.navigate(['programacion-tv/ver-canal', slug]);
      return;
    }

    // Otherwise treat as program-like (may be movie or series)
    // Build a normalized bannerData object similar to BannerComponent
    if (programa) {
      // Build a normalized bannerData object similar to BannerComponent
      const bannerData: any = {
        title:
          typeof titleValue === 'string' ? { value: titleValue } : titleValue,
        channel:
          (typeof programa.channel === 'string'
            ? programa.channel
            : programa.channel?.name ||
              programa.channel?.channel ||
              programa.channel?.title) ||
          programa.channel ||
          'Canal desconocido',
        poster: programa?.poster || programa?.icon,
        icon: programa?.icon,
        start:
          this.normalizeTimeString?.(programa.start) ?? (programa.start || ''),
        stop:
          this.normalizeTimeString?.(programa.stop) ?? (programa.stop || ''),
        desc:
          typeof programa.desc === 'string'
            ? { details: programa.desc }
            : programa.desc,
        category:
          typeof programa.category === 'string'
            ? { value: programa.category }
            : programa.category,
        starRating: programa.starRating,
        id: programa.id || programa.uuid || null,
        channel_id:
          typeof programa.channel === 'object'
            ? programa.channel.id || programa.channel_id
            : programa.channel_id || null,
      };

      // Save normalized data in the shared service
      try {
        this.guiatvSvc.setDetallesPrograma(bannerData);
      } catch (_) {}
      // Decide route using improved heuristics
      const cat = String(categoryValue || '').toLowerCase();
      const isMovieData =
        cat.includes('cine') ||
        !!programa?.poster ||
        !!programa?.icon ||
        !!programa?.tmdbId ||
        !!programa?.release_date ||
        !!programa?.releaseDate;
      const isSeriesData =
        cat.includes('series') ||
        /T\d/.test(String(titleValue)) ||
        (programa?.type &&
          String(programa.type).toLowerCase().includes('series'));
      const isProgramData =
        !!programa?.start && !!programa?.stop && !!programa?.channel;

      const slug = slugify((bannerData.title && bannerData.title.value) || '');

      if (isMovieData) {
        this.router.navigate(['/peliculas', slug], { state: { bannerData } });
      } else if (isSeriesData || isProgramData) {
        this.router.navigate(['/programas', slug], { state: { bannerData } });
      } else {
        // Fallback: send to peliculas detail if unsure
        this.router.navigate(['/peliculas', slug], { state: { bannerData } });
      }
    } else {
      // No program data at all - fallback to channel navigation if possible
      const slug = slugify(
        programa?.name || programa?.channel || programa?.id || ''
      );
      this.router.navigate(['programacion-tv/ver-canal', slug]);
    }
  }

  // Local helper: normalize time values safely
  private normalizeTimeString(time: any): string {
    if (!time) return '';
    try {
      if (time instanceof Date) return time.toISOString();
      return String(time);
    } catch (_) {
      return String(time || '');
    }
  }

  // Image helpers optimizados
  public buildWsrvUrl(rawUrl?: string, w = 400, h = 225): string {
    if (!rawUrl) return '';
    try {
      const s = String(rawUrl);
      const low = s.toLowerCase();
      if (low.includes('wsrv.nl') || low.includes('?url=')) return s;
      return `https://wsrv.nl/?url=${encodeURIComponent(
        s
      )}&w=${w}&h=${h}&output=webp`;
    } catch (_) {
      return String(rawUrl);
    }
  }

  public buildSrcset(
    rawUrl?: string,
    sizes: number[] = [400, 600, 800]
  ): string {
    if (!rawUrl) return '';
    return sizes
      .map(
        (s) => `${this.buildWsrvUrl(rawUrl, s, Math.round(s * 0.5625))} ${s}w`
      )
      .join(', ');
  }

  public getLogoSrc(program: any, w = 400, h = 225): string {
    const explicit = program?.icon || program?.channelLogo || program?.logo;
    if (explicit) return this.buildWsrvUrl(explicit, w, h);
    if (this.logo) return this.buildWsrvUrl(this.logo as string, w, h);
    const name =
      program?.channel ||
      program?.name ||
      program?.channelName ||
      program?.channelId ||
      program?.id;
    if (!name) return '';
    const fallback = `https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${name}.png`;
    return this.buildWsrvUrl(fallback, w, h);
  }

  public getOverlayIcon(program: any, size = 120): string {
    const explicit = program?.icon || program?.channelLogo || program?.logo;
    if (explicit && typeof explicit === 'string') {
      const low = explicit.toLowerCase();
      const looksLikePoster =
        /poster|posters|cover|caratula|poster-large/i.test(low);
      if (!looksLikePoster) return this.buildWsrvUrl(explicit, size, size);
    }
    return this.getLogoSrc(program, size, size);
  }

  public onLogoError(event: Event, program: any): void {
    const img = event?.target as HTMLImageElement | null;
    if (!img) return;

    const attempts = Number(img.dataset['attempts'] || '0');

    // Primer intento: usar icon directamente sin transformación
    if (attempts === 0 && program?.icon) {
      img.dataset['attempts'] = '1';
      img.src = program.icon; // URL original sin wsrv
      return;
    }

    // Segundo intento: placeholder gris
    if (attempts === 1) {
      img.dataset['attempts'] = '2';
      img.src = this.posterPlaceholder;
      return;
    }

    // Si todo falla, ocultar
    img.style.display = 'none';
  }

  // TrackBy para mejor performance
  public trackByProgram(index: number, program: any): string {
    return program?.id || program?.uuid || `${program?.title?.value}-${index}`;
  }
}
