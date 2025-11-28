import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first, filter, takeUntil, Subject, map } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { HomeDataService } from 'src/app/services/features/home-data.service';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { isLive } from 'src/app/utils/utils';

type ContentType = 'series' | 'movies';

@Component({
  selector: 'app-content-page',
  templateUrl: './content-page.component.html',
  styleUrls: ['./content-page.component.scss'],
  standalone: true,
  imports: [CommonModule, SliderComponent, NavBarComponent, BannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPageComponent implements OnInit, OnDestroy {
  public contentType: ContentType = 'movies'; // Default
  public contentTitle: string = '';
  
  public get sliderVariant(): 'series' | 'peliculas' {
    return this.contentType === 'series' ? 'series' : 'peliculas';
  }
  
  public items: any[] = [];
  public categorias: string[] = [];
  public destacada: any = null;
  public en_emision: any[] = [];
  public isLoading = true;
  public ldJson: string = '';

  // Cache for categories
  public itemsPorCategoria = new Map<string, any[]>();
  private destroy$ = new Subject<void>();

  constructor(
    private svcGuide: TvGuideService,
    private homeDataService: HomeDataService,
    private metaSvc: MetaService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get content type from route data
    this.route.data
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.contentType = data['type'] || 'movies';
        this.initializePage();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.itemsPorCategoria.clear();
  }

  private initializePage(): void {
    this.isLoading = true;
    this.items = [];
    this.en_emision = [];
    this.categorias = [];
    this.destacada = null;
    this.itemsPorCategoria.clear();

    this.setupMetaTags();
    this.loadData();
  }

  private setupMetaTags(): void {
    if (this.contentType === 'series') {
      this.contentTitle = 'Series';
      this.metaSvc.setMetaTags({
        title: 'Series de TV en España Hoy | Guía Completa de Programación',
        description: 'Descubre todas las series que se emiten hoy en TV: dramas, comedias, thrillers y más. Guía actualizada de series en televisión española con horarios.',
        canonicalUrl: this.router.url,
        keywords: 'series tv hoy, series television españa, programacion series, guia tv series',
        ogImage: '/assets/images/series-og.jpg',
      });
    } else {
      this.contentTitle = 'Películas';
      this.metaSvc.setMetaTags({
        title: 'Películas en TV Hoy | Cartelera Completa de Televisión España',
        description: 'Encuentra las mejores películas que se emiten hoy en televisión española: estrenos, clásicos, acción, comedia, drama y más. Guía actualizada con horarios.',
        canonicalUrl: this.router.url,
        keywords: 'peliculas tv hoy, peliculas television, cartelera tv, cine en television españa',
        ogImage: '/assets/images/peliculas-og.jpg',
      });
    }
  }

  private loadData(): void {
    console.log(`[ContentPage] Loading ${this.contentType} data from HomeDataService`);

    // Ensure data is initialized
    this.homeDataService.initializeData().pipe(takeUntil(this.destroy$)).subscribe();

    this.homeDataService.programs$
      .pipe(
        filter((data) => Array.isArray(data) && data.length > 0),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.manageData(data);
        },
        error: (error) => {
          console.error(`[ContentPage] Error loading ${this.contentType} data:`, error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private manageData(data: any[]): void {
    const startTime = performance.now();
    
    // Ensure service has data
    this.svcGuide.setData(data);

    let allItems: any[] = [];

    if (this.contentType === 'series') {
      allItems = this.svcGuide.getAllSeries();
      // Filter series specific logic if needed
    } else {
      allItems = this.svcGuide.getAllMovies();
      // Filter movies specific logic
      allItems = allItems.filter(movie => {
        const title = movie?.title?.value;
        return title && title.toLowerCase().trim() !== 'cine';
      });
    }

    // Filter live items
    const now = Date.now();
    const liveItems = allItems.filter(item => {
      if (!item.start || !item.stop) return false;
      const start = new Date(item.start).getTime();
      const stop = new Date(item.stop).getTime();
      return start <= now && now <= stop;
    });

    this.items = allItems;
    this.en_emision = liveItems.slice(0, 20); // Limit for performance

    // LOGS: Verify data state
    console.log(`📊 [ContentPage] Data State for ${this.contentType}:`);
    console.log(`   - Total items: ${this.items.length}`);
    console.log(`   - Live items: ${this.en_emision.length}`);
    
    // Get categories
    if (this.contentType === 'series') {
      this.categorias = this.svcGuide.getSeriesCategories()
        .filter((cat) => cat && cat.toLowerCase().trim() !== 'otros')
        .slice(0, 8);
    } else {
      this.categorias = this.svcGuide.getMoviesCategories()
        .filter((cat) => cat && cat.toLowerCase().trim() !== 'otros')
        .slice(0, 8);
    }
    
    console.log(`   - Categories found: ${this.categorias.length}`);

    // Lazy load categories
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.precacheCategories(), { timeout: 2000 });
    } else {
      setTimeout(() => this.precacheCategories(), 100);
    }

    this.loadDestacada();

    this.isLoading = false;
    this.cdr.markForCheck();

    const endTime = performance.now();
    console.log(`⚡ [ContentPage] Processed ${this.contentType} in ${(endTime - startTime).toFixed(2)}ms`);
  }

  private precacheCategories(): void {
    const limit = 3;
    for (let i = 0; i < Math.min(limit, this.categorias.length); i++) {
      const cat = this.categorias[i];
      if (!this.itemsPorCategoria.has(cat)) {
        this.getItemsByCategory(cat);
      }
    }
  }

  private loadDestacada(): void {
    // Use setTimeout to not block initial render
    setTimeout(() => {
      if (this.contentType === 'series') {
        try { this.svcGuide.setSeriesDestacadas(); } catch (e) {}
        this.svcGuide.getSeriesDestacadas()
          .pipe(first(), takeUntil(this.destroy$))
          .subscribe(this.handleDestacadaResponse.bind(this));
      } else {
        this.svcGuide.getPeliculasDestacadas()
          .pipe(first(), takeUntil(this.destroy$))
          .subscribe(this.handleDestacadaResponse.bind(this));
      }
    }, 100);
  }

  private handleDestacadaResponse(data: any[]): void {
    this.destacada = data?.[0] || this.items[0] || null;
    if (this.destacada) {
      this.generateJsonLd();
    }
    this.cdr.markForCheck();
  }

  private generateJsonLd(): void {
    try {
      const title = this.destacada?.title?.value || this.destacada?.name;
      const description = this.destacada?.description || this.destacada?.title?.subtitle || `Guía de ${this.contentTitle} en televisión`;
      const image = this.destacada?.image || this.destacada?.poster || this.destacada?.thumb || `/assets/images/${this.contentType}-og.jpg`;

      const pageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${this.contentTitle} en televisión`,
        description: `Guía actualizada de ${this.contentTitle.toLowerCase()} en televisión en España`,
        url: this.router.url,
        mainEntity: {
          '@type': this.contentType === 'series' ? 'TVSeries' : 'Movie',
          name: title,
          description,
          image,
        },
      };

      this.ldJson = JSON.stringify(pageLd);

      // Update meta tags with featured content
      this.metaSvc.setMetaTags({
        title: `${title} — ${this.contentTitle} en TV | Guía TV`,
        description,
        canonicalUrl: this.router.url,
        keywords: `${this.contentType === 'series' ? 'serie' : 'pelicula'} ${title}, ${this.contentType} tv`,
        ogImage: image,
      });
    } catch (e) {
      this.ldJson = '';
    }
  }

  public getItemsByCategory(categoria: string): any[] {
    if (this.itemsPorCategoria.has(categoria)) {
      return this.itemsPorCategoria.get(categoria)!;
    }

    let items: any[] = [];
    if (this.contentType === 'series') {
      items = this.svcGuide.getSeriesByCategory(categoria).slice(0, 15);
    } else {
      items = this.svcGuide.getMoviesByCategory(categoria).slice(0, 12);
    }

    this.itemsPorCategoria.set(categoria, items);
    return items;
  }

  public trackByCategory(index: number, categoria: string): string {
    return categoria;
  }
}

// Polyfill for requestIdleCallback
declare const requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number;
if (typeof requestIdleCallback === 'undefined') {
  (window as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 1);
}
