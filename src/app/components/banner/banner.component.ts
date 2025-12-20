/**
 * BannerComponent - VERSIÓN OPTIMIZADA PARA LCP
 * 
 * Optimizaciones aplicadas:
 * 1. Srcset con breakpoints específicos (menos variantes, más apropiadas)
 * 2. Atributo sizes optimizado para cada viewport
 * 3. Calidad diferenciada por tamaño de imagen
 * 4. Soporte para preload de imagen principal
 * 5. Logo de canal con tamaño optimizado (43x28 real)
 * 6. Mejor manejo de errores de imagen
 */
import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { slugify } from 'src/app/utils/utils';
import {
  diffHour,
  getHoraInicio,
  formatCorrectTime,
} from 'src/app/utils/utils';
import {
  IBannerData,
  IBannerInputData,
  IImageService,
  IBannerDataService,
  ITimeUtilsService,
} from '../../interfaces/banner.interface';
import { environment } from 'src/environments/environment';
import { InteractionButtonsComponent } from '../interaction-buttons/interaction-buttons.component';

// ============================================================
// CONFIGURACIÓN OPTIMIZADA DE IMÁGENES
// ============================================================

/**
 * Breakpoints optimizados para el banner
 * Reducido a solo los tamaños necesarios para cada viewport
 */
const OPTIMIZED_BANNER_WIDTHS = [480, 768, 1024, 1440, 1920] as const;

/**
 * Calidad WebP optimizada por tamaño
 * Imágenes más pequeñas pueden tener menor calidad sin pérdida visual perceptible
 */
const QUALITY_BY_WIDTH: Record<number, number> = {
  480: 70,
  768: 75,
  1024: 78,
  1440: 80,
  1920: 82,
};

/**
 * Configuración de logo de canal
 * Tamaño real de visualización: 43x28
 */
const LOGO_CONFIG = {
  WIDTH: 60,        // Ligeramente mayor para nitidez
  HEIGHT: 40,
  WIDTH_2X: 120,    // Para pantallas retina
  HEIGHT_2X: 80,
  QUALITY: 80,
} as const;

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  standalone: true,
  imports: [CommonModule, InteractionButtonsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerComponent
  implements
    OnInit,
    OnChanges,
    IImageService,
    IBannerDataService,
    ITimeUtilsService
{
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  
  // Aspect ratio del banner (height/width)
  private readonly bannerAspectRatio = 800 / 1920; // ~0.417
  
  @Input() data: IBannerInputData = {};
  @Input() compact: boolean = false;
  @Input() compactLogo: boolean = false;
  @Input() hideTopTime: boolean = false;
  @Input() showFullDescription: boolean = false;

  public bannerData: IBannerData | null = null;
  public logo: string = '';
  public time: string = '';
  public isMobile: boolean = false;
  
  private lastLoggedSignature: string | null = null;

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  ngOnInit(): void {
    this.isMobile = this.detectMobile();
    this.processBannerData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.processBannerData();
    }
  }

  // ============================================================
  // DATA PROCESSING
  // ============================================================

  private processBannerData(): void {
    if (!this.data || Object.keys(this.data).length === 0) {
      this.bannerData = null;
      return;
    }
    this.logBannerData(this.data);

    if (this.isMovieData(this.data)) {
      this.bannerData = this.convertMovieToBannerData(this.data);
    } else if (this.isProgramData(this.data)) {
      this.bannerData = this.convertProgramToBannerData(this.data);
    } else {
      this.bannerData = this.convertGenericToBannerData(this.data);
    }

    if (this.bannerData?.start && this.bannerData?.stop) {
      this.time = this.calculateDuration(
        this.bannerData.start,
        this.bannerData.stop
      );
    }
    
    // Precargar imagen del banner para LCP
    this.preloadBannerImage();
  }

  private detectMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.innerWidth < 768;
  }

  // ============================================================
  // MÉTODOS DE IMAGEN OPTIMIZADOS
  // ============================================================

  /**
   * Obtiene la URL de imagen inicial para el src base
   * Usa un tamaño apropiado según el dispositivo
   */
  getBannerImageUrl(programData: any, width: number = 1440): string {
    const rawUrl = this.getProgramPosterUrl(programData);
    // Para móvil, usar imagen más pequeña como base
    const targetWidth = this.isMobile ? 768 : width;
    return this.buildProxyUrl(rawUrl, targetWidth);
  }

  /**
   * Genera srcset optimizado para el banner
   * Solo incluye los tamaños necesarios para cada breakpoint
   */
  getBannerSrcset(rawUrl: string): string {
    if (!rawUrl || rawUrl.startsWith('data:')) return '';
    
    return OPTIMIZED_BANNER_WIDTHS
      .map(width => {
        const height = Math.round(width * this.bannerAspectRatio);
        const quality = QUALITY_BY_WIDTH[width] || 80;
        const url = this.buildProxyUrlWithQuality(rawUrl, width, height, quality);
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Genera el atributo sizes optimizado
   * Específico para evitar descargar imágenes más grandes de lo necesario
   */
  getBannerSizes(): string {
    return [
      '(max-width: 480px) 480px',
      '(max-width: 768px) 768px',
      '(max-width: 1024px) 1024px',
      '(max-width: 1440px) 1440px',
      '1920px'
    ].join(', ');
  }

  /**
   * URL del logo del canal optimizada
   * Tamaño real: ~43x28, servimos 60x40 para nitidez
   */
  getChannelLogoUrl(channelName: string): string {
    if (!channelName) return this.getFallbackImageUrl();
    
    const raw = `https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${encodeURIComponent(channelName)}.png`;
    return this.buildProxyUrlWithQuality(
      raw, 
      LOGO_CONFIG.WIDTH, 
      LOGO_CONFIG.HEIGHT, 
      LOGO_CONFIG.QUALITY
    );
  }

  /**
   * Srcset para logo de canal (soporte retina)
   */
  getChannelLogoSrcset(channelName: string): string {
    if (!channelName) return '';
    
    const raw = `https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${encodeURIComponent(channelName)}.png`;
    const src1x = this.buildProxyUrlWithQuality(raw, LOGO_CONFIG.WIDTH, LOGO_CONFIG.HEIGHT, LOGO_CONFIG.QUALITY);
    const src2x = this.buildProxyUrlWithQuality(raw, LOGO_CONFIG.WIDTH_2X, LOGO_CONFIG.HEIGHT_2X, LOGO_CONFIG.QUALITY);
    
    return `${src1x} 1x, ${src2x} 2x`;
  }

  getProgramPosterUrl(programData: any): string {
    if (!programData) return this.getFallbackImageUrl();
    return (
      programData?.poster ||
      programData?.icon ||
      programData?.background ||
      this.getFallbackImageUrl()
    );
  }

  /**
   * Construye URL optimizada con wsrv.nl
   */
  private buildProxyUrl(raw: string, width: number, height?: number): string {
    const safeRaw = raw || this.getFallbackImageUrl();
    if (safeRaw.startsWith('data:')) {
      return safeRaw;
    }
    
    const encoded = this.encodeURIComponent(safeRaw);
    const targetHeight = height ?? Math.max(1, Math.round(width * this.bannerAspectRatio));
    const quality = QUALITY_BY_WIDTH[width] || 80;
    
    return `https://wsrv.nl/?url=${encoded}&w=${width}&h=${targetHeight}&output=webp&q=${quality}&fit=cover`;
  }

  /**
   * Construye URL con calidad específica
   */
  private buildProxyUrlWithQuality(
    raw: string, 
    width: number, 
    height: number, 
    quality: number
  ): string {
    if (!raw || raw.startsWith('data:')) return raw;
    
    const encoded = this.encodeURIComponent(raw);
    return `https://wsrv.nl/?url=${encoded}&w=${width}&h=${height}&output=webp&q=${quality}&fit=cover`;
  }

  /**
   * Precargar imagen del banner para mejorar LCP
   */
  private preloadBannerImage(): void {
    if (!isPlatformBrowser(this.platformId) || !this.bannerData) return;
    
    const rawUrl = this.getProgramPosterUrl(this.bannerData);
    if (!rawUrl || rawUrl.startsWith('data:')) return;
    
    // Verificar si ya existe un preload
    const existingPreload = document.querySelector('link[rel="preload"][as="image"][data-banner="true"]');
    if (existingPreload) {
      existingPreload.remove();
    }
    
    // Crear link de preload
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.setAttribute('data-banner', 'true');
    
    // Usar tamaño apropiado para el dispositivo
    const width = this.isMobile ? 768 : 1024;
    const height = Math.round(width * this.bannerAspectRatio);
    const quality = QUALITY_BY_WIDTH[width] || 80;
    
    link.href = this.buildProxyUrlWithQuality(rawUrl, width, height, quality);
    link.setAttribute('imagesrcset', this.getBannerSrcset(rawUrl));
    link.setAttribute('imagesizes', this.getBannerSizes());
    
    document.head.appendChild(link);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  encodeURIComponent(value: any): string {
    try {
      return globalThis.encodeURIComponent(String(value ?? ''));
    } catch (_) {
      return String(value ?? '');
    }
  }

  getFallbackImageUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNzQxNTEiLz48L3N2Zz4=';
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.getFallbackImageUrl();
      target.srcset = '';
    }
  }

  public onImageError(event: Event): void {
    this.handleImageError(event);
  }

  public getHora(hora: string): string {
    return this.formatTime(hora);
  }

  formatTime(timeString: string): string {
    try {
      return formatCorrectTime(timeString);
    } catch (error) {
      return getHoraInicio(timeString);
    }
  }

  calculateDuration(start: string, stop: string): string {
    return diffHour(start, stop);
  }

  private normalizeTimeString(time: string | Date | undefined): string {
    if (!time) return new Date().toISOString();
    if (time instanceof Date) return time.toISOString();
    return time;
  }

  // ============================================================
  // DATA CONVERSION METHODS
  // ============================================================

  private logBannerData(data: IBannerInputData): void {
    if (environment.production) return;
    try {
      const signature = JSON.stringify({
        id: data.id,
        title: typeof data.title === 'string' ? data.title : data.title?.value,
        channel: (data as any)?.channel || (data as any)?.channelName,
        start: (data as any)?.start || (data as any)?.startTime,
        stop: (data as any)?.stop || (data as any)?.endTime,
        poster: (data as any)?.poster || (data as any)?.icon,
      });
      if (this.lastLoggedSignature === signature) return;
      this.lastLoggedSignature = signature;
      console.log('[BannerComponent] processBannerData:', data);
    } catch {
      console.log('[BannerComponent] processBannerData:', data);
    }
  }

  private isMovieData(data: IBannerInputData): boolean {
    return !!(
      data.title &&
      (data.poster || data.description || data.rating || data.releaseDate)
    );
  }

  private isProgramData(data: IBannerInputData): boolean {
    return !!(data.title && data.channel && data.start && data.stop);
  }

  convertMovieToBannerData(movieData: IBannerInputData): IBannerData {
    const title =
      typeof movieData.title === 'string'
        ? { value: movieData.title }
        : movieData.title || { value: 'Título desconocido' };
    const descData =
      typeof movieData.desc === 'string'
        ? { details: movieData.desc }
        : movieData.desc;

    return {
      title,
      channel:
        movieData.channelName || movieData.channel || 'Canal desconocido',
      poster: movieData.poster || movieData.icon,
      icon: movieData.icon,
      start: this.normalizeTimeString(movieData.startTime || movieData.start),
      stop: this.normalizeTimeString(movieData.endTime || movieData.stop),
      desc: {
        details:
          movieData.description || descData?.details || movieData.overview,
        year: movieData.year || movieData.releaseDate || descData?.year,
        rate: movieData.rating?.toString() || descData?.rate || 'TP',
      },
      category:
        typeof movieData.category === 'string'
          ? { value: movieData.category }
          : movieData.category,
      starRating:
        movieData.starRating || movieData.vote_average || movieData.rating,
      id: movieData.id,
    };
  }

  convertProgramToBannerData(programData: IBannerInputData): IBannerData {
    const title =
      typeof programData.title === 'string'
        ? { value: programData.title }
        : programData.title || { value: 'Programa desconocido' };
    return {
      title,
      channel: programData.channel || 'Canal desconocido',
      poster: programData.poster || programData.icon,
      icon: programData.icon,
      start: this.normalizeTimeString(programData.start),
      stop: this.normalizeTimeString(programData.stop),
      desc:
        typeof programData.desc === 'string'
          ? { details: programData.desc }
          : programData.desc,
      category:
        typeof programData.category === 'string'
          ? { value: programData.category }
          : programData.category,
      starRating: programData.starRating,
      id: programData.id,
    };
  }

  convertGenericToBannerData(data: IBannerInputData): IBannerData {
    return this.convertProgramToBannerData(data);
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  public navigateTo(): void {
    if (!this.bannerData) return;

    const titleValue = this.bannerData.title?.value || 'unknown';
    const slug = slugify(titleValue);
    
    if (this.isMovieData(this.data)) {
      this.router.navigate(['/peliculas', slug], {
        state: { bannerData: this.bannerData },
      });
    } else {
      this.router.navigate(['/programas', slug], {
        state: { bannerData: this.bannerData },
      });
    }
  }

  addReminder(): void {
    try {
      console.log(
        'addReminder clicked for',
        this.bannerData?.id || this.bannerData?.title?.value
      );
    } catch (_) {}
  }
}