/**
 * RightSidebarComponent - Migrado a ContentService
 */
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { slugify } from 'src/app/utils/utils';
import { ContentService, ContentItem } from 'src/app/state/content.service';
import { environment } from 'src/environments/environment';

interface ISidebarItem {
  id?: string | number;
  title: { value: string };
  category: { value: string };
  icon: string;
  starRating: string | number;
}

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class RightSidebarComponent implements OnInit {
  private readonly contentService = inject(ContentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  public readonly popular_movies = signal<ISidebarItem[]>([]);
  public readonly popular_series = signal<ISidebarItem[]>([]);
  public readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.initializeDataStreams();
  }

  private initializeDataStreams(): void {
    // Cargar películas populares desde ContentService
    this.contentService
      .loadContent('movies', 'today')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((snapshot) => snapshot.items.slice(0, 4))
      )
      .subscribe((movies) => {
        if (movies && movies.length > 0) {
          const converted = this.convertContentToSidebarFormat(movies, 'movie');
          this.popular_movies.set(converted);
          this.isLoading.set(false);
        }
      });

    // Cargar series populares desde ContentService
    this.contentService
      .loadContent('series', 'today')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((snapshot) => snapshot.items.slice(0, 4))
      )
      .subscribe((series) => {
        if (series && series.length > 0) {
          const converted = this.convertContentToSidebarFormat(series, 'series');
          this.popular_series.set(converted);
        }
      });
  }

  private convertContentToSidebarFormat(
    items: ContentItem[],
    type: 'movie' | 'series'
  ): ISidebarItem[] {
    return items.map((item, index) => {
      const baseTitle = item.title || `${type === 'movie' ? 'Película' : 'Serie'} ${index + 1}`;

      return {
        id: item.id,
        title: {
          value: type === 'series' ? `${baseTitle} (Serie)` : baseTitle,
        },
        category: {
          value: item.category || (type === 'series' ? 'Series,Drama' : 'Cine,Drama'),
        },
        icon: item.image || this.getDefaultPosterUrl(),
        starRating: this.normalizeRating(item.rating),
      };
    });
  }

  private normalizeRating(rating: any): string {
    if (!rating) return '6.0';
    if (typeof rating === 'number') return rating.toFixed(1);
    if (typeof rating === 'string') {
      if (rating.includes('/10')) return rating.split('/10')[0] || '6.0';
      const num = parseFloat(rating);
      if (!isNaN(num)) return num.toFixed(1);
    }
    return '6.0';
  }

  private getDefaultPosterUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGE1NTY4Ii8+CjxwYXRoIGQ9Ik00NS41IDk1TDYwIDgwVjEyMEw0NS41IDEwNVpNNzUgODBMMTA0LjUgOTVMNzUgMTEwVjgwWiIgZmlsbD0iI2ZmZmZmZiIvPgo8L3N2Zz4K';
  }

  public navigateTo(item: ISidebarItem): void {
    const rawTitle = item?.title?.value || '';
    const slug = slugify(rawTitle);
    const cat = item?.category?.value || '';
    const looksLikeMovie = cat.startsWith('Cine') || !!(item as any).icon;
    if (looksLikeMovie) {
      this.router.navigate(['/peliculas', slug]);
    } else {
      this.router.navigate(['/programas', slug]);
    }
  }

  public navigateTo2(type: string): void {
    if (type === 'movie') {
      this.router.navigate(['programacion-tv/peliculas']);
    } else if (type === 'serie') {
      this.router.navigate(['programacion-tv/series']);
    }
  }

  public getMovieImageUrl(movie: ISidebarItem): string {
    if (movie.icon && !movie.icon.includes('picons_dobleM')) {
      return movie.icon;
    }
    return this.getDefaultPosterUrl();
  }

  public getSerieImageUrl(serie: ISidebarItem): string {
    return serie.icon || this.getDefaultPosterUrl();
  }

  public getMovieCategory(movie: ISidebarItem): string {
    if (!movie?.category?.value) return 'Drama';
    const val: any = movie.category.value;
    const raw =
      typeof val === 'string'
        ? val
        : Array.isArray(val)
        ? val.join(',')
        : val?.value || val?.name || String(val || '');
    const parts = raw.split(',');
    return parts[1]?.trim() || parts[0]?.trim() || 'Drama';
  }

  public getSerieCategory(serie: ISidebarItem): string {
    if (!serie?.category?.value) return 'Drama';
    const val: any = serie.category.value;
    const raw =
      typeof val === 'string'
        ? val
        : Array.isArray(val)
        ? val.join(',')
        : val?.value || val?.name || String(val || '');
    const parts = raw.split(',');
    return parts[1]?.trim() || parts[0]?.trim() || 'Drama';
  }

  public formatRating(rating: any): string {
    if (!rating) return 'N/A';
    const normalizedRating = this.normalizeRating(rating);
    if (!normalizedRating.includes('/10')) {
      return `${normalizedRating}/10`;
    }
    return normalizedRating;
  }

  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.getDefaultPosterUrl();
  }

  public isDebugMode(): boolean {
    return !environment.production;
  }

  public trackByMovieId(index: number, movie: ISidebarItem): string {
    const title = movie.title?.value || '';
    return (movie.id || title || index.toString()).toString();
  }

  public trackBySerieId(index: number, serie: ISidebarItem): string {
    const title = serie.title?.value || '';
    return (serie.id || title || index.toString()).toString();
  }

  // Compatibilidad con template
  public forceReload(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 500);
  }
}
