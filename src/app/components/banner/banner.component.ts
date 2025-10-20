import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { slugify } from 'src/app/utils/utils';
import { TvGuideService } from 'src/app/services/tv-guide.service';
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

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class BannerComponent
  implements
    OnInit,
    OnChanges,
    IImageService,
    IBannerDataService,
    ITimeUtilsService
{
  @Input() data: IBannerInputData = {};
  /** If true, the banner adapts to small containers (fills parent) */
  @Input() compact: boolean = false;
  /** If true, use a small square channel logo instead of the large rectangular one */
  @Input() compactLogo: boolean = false;
  /** If true, hide the top-right time display */
  @Input() hideTopTime: boolean = false;

  public bannerData: IBannerData | null = null;
  public logo: string = '';
  public time: string = '';

  constructor(private router: Router, private guiatvSvc: TvGuideService) {}

  ngOnInit(): void {
    this.processBannerData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      this.processBannerData();
    }
  }

  private processBannerData(): void {
    if (!this.data || Object.keys(this.data).length === 0) {
      this.bannerData = null;
      return;
    }

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

  getChannelLogoUrl(channelName: string): string {
    return `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${channelName}.png`;
  }

  getProgramPosterUrl(programData: any): string {
    return (
      programData?.poster || programData?.icon || this.getFallbackImageUrl()
    );
  }

  // Template helper: wrapper for encodeURIComponent so the template can call it
  encodeURIComponent(v: any): string {
    try {
      return globalThis.encodeURIComponent(String(v || ''));
    } catch (_) {
      return String(v || '');
    }
  }

  // Build srcset for the large banner background (desktop sizes)
  getBannerSrcset(raw: string): string {
    if (!raw) return '';
    const sizes = [768, 1024, 1280, 1600, 1920];
    return sizes
      .map(
        (w) =>
          `https://wsrv.nl/?url=${this.encodeURIComponent(
            raw
          )}&w=${w}&h=${Math.round(w * 0.416)}&output=webp ${w}w`
      )
      .join(', ');
  }

  // Stub for reminder action — keep minimal to avoid runtime errors; can be extended later
  addReminder(): void {
    // For now simply log and optionally call a service later
    try {
      console.log(
        'addReminder clicked for',
        this.bannerData?.id || this.bannerData?.title?.value
      );
    } catch (_) {}
  }

  getFallbackImageUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNzQxNTEiLz48L3N2Zz4=';
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.getFallbackImageUrl();
  }

  public getHora(hora: string): string {
    return this.formatTime(hora);
  }

  public onImageError(event: Event): void {
    this.handleImageError(event);
  }

  public navigateTo(): void {
    if (!this.bannerData) return;

    // Use the normalized bannerData so the details component gets a consistent shape
    this.guiatvSvc.setDetallesPrograma(this.bannerData);

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
}
