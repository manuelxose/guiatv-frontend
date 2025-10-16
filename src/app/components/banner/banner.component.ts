import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { diffHour, getHoraInicio, formatCorrectTime } from 'src/app/utils/utils';
import { 
  IBannerData, 
  IBannerInputData, 
  IImageService, 
  IBannerDataService,
  ITimeUtilsService 
} from '../../interfaces/banner.interface';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class BannerComponent implements OnInit, OnChanges, IImageService, IBannerDataService, ITimeUtilsService {
  @Input() data: IBannerInputData = {};
  
  public bannerData: IBannerData | null = null;
  public logo: string = '';
  public time: string = '';

  constructor(private router: Router, private guiatvSvc: TvGuideService) {}

  ngOnInit(): void {
    console.log('BannerComponent initialized with data:', this.data);
    this.processBannerData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.processBannerData();
    }
  }

  /**
   * Procesa los datos de entrada y los convierte al formato del banner
   */
  private processBannerData(): void {
    if (!this.data || Object.keys(this.data).length === 0) {
      this.bannerData = null;
      return;
    }

    // Detectar el tipo de datos y convertir apropiadamente
    if (this.isMovieData(this.data)) {
      this.bannerData = this.convertMovieToBannerData(this.data);
    } else if (this.isProgramData(this.data)) {
      this.bannerData = this.convertProgramToBannerData(this.data);
    } else {
      this.bannerData = this.convertGenericToBannerData(this.data);
    }

    // Calcular tiempo después de la conversión
    if (this.bannerData?.start && this.bannerData?.stop) {
      this.time = this.calculateDuration(this.bannerData.start, this.bannerData.stop);
    }
  }
  /**
   * Detecta si los datos son de una película destacada
   */
  private isMovieData(data: IBannerInputData): boolean {
    return !!(data.title && (data.poster || data.description || data.rating || data.releaseDate));
  }

  /**
   * Detecta si los datos son de un programa de TV
   */
  private isProgramData(data: IBannerInputData): boolean {
    return !!(data.title && data.channel && data.start && data.stop);
  }

  // Implementación de IBannerDataService
  convertMovieToBannerData(movieData: IBannerInputData): IBannerData {
    const title = typeof movieData.title === 'string' 
      ? { value: movieData.title } 
      : movieData.title || { value: 'Título desconocido' };

    const descData = typeof movieData.desc === 'string' 
      ? { details: movieData.desc } 
      : movieData.desc;

    return {
      title,
      channel: movieData.channelName || movieData.channel || 'Canal desconocido',
      poster: movieData.poster || movieData.icon,
      icon: movieData.icon,
      start: this.normalizeTimeString(movieData.startTime || movieData.start),
      stop: this.normalizeTimeString(movieData.endTime || movieData.stop),
      desc: {
        details: movieData.description || descData?.details || movieData.overview,
        year: movieData.year || movieData.releaseDate || descData?.year,
        rate: movieData.rating?.toString() || descData?.rate || 'TP'
      },
      category: typeof movieData.category === 'string' 
        ? { value: movieData.category } 
        : movieData.category,
      starRating: movieData.starRating || movieData.vote_average || movieData.rating,
      id: movieData.id
    };
  }

  convertProgramToBannerData(programData: IBannerInputData): IBannerData {
    const title = typeof programData.title === 'string' 
      ? { value: programData.title } 
      : programData.title || { value: 'Programa desconocido' };

    return {
      title,
      channel: programData.channel || 'Canal desconocido',
      poster: programData.poster || programData.icon,
      icon: programData.icon,
      start: this.normalizeTimeString(programData.start),
      stop: this.normalizeTimeString(programData.stop),
      desc: typeof programData.desc === 'string' 
        ? { details: programData.desc } 
        : programData.desc,
      category: typeof programData.category === 'string' 
        ? { value: programData.category } 
        : programData.category,
      starRating: programData.starRating,
      id: programData.id
    };
  }

  convertGenericToBannerData(data: IBannerInputData): IBannerData {
    // Fallback genérico
    return this.convertProgramToBannerData(data);
  }

  // Implementación de ITimeUtilsService
  formatTime(timeString: string): string {
    try {
      // Usar la utilidad centralizada para consistencia
      return formatCorrectTime(timeString);
    } catch (error) {
      return getHoraInicio(timeString); // Fallback a la utilidad original
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

  // Implementación de IImageService
  getChannelLogoUrl(channelName: string): string {
    return `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${channelName}.png`;
  }

  getProgramPosterUrl(programData: any): string {
    return programData?.poster || programData?.icon || this.getFallbackImageUrl();
  }

  getFallbackImageUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNzQxNTEiLz48L3N2Zz4=';
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.getFallbackImageUrl();
  }

  // Métodos públicos para el template
  public getHora(hora: string): string {
    return this.formatTime(hora);
  }

  private getTime(start: string, stop: string): string {
    return this.calculateDuration(start, stop);
  }

  public onImageError(event: Event): void {
    this.handleImageError(event);
  }

  public navigateTo(): void {
    if (!this.bannerData) return;
    
    this.guiatvSvc.setDetallesPrograma(this.data);

    const titleValue = this.bannerData.title?.value || 'unknown';
    this.router.navigate([
      'programacion-tv/detalles',
      titleValue.replace(/\s/g, '-'),
    ]);
  }
}
