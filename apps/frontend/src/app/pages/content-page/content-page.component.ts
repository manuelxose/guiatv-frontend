import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BannerComponent } from 'src/app/components/banner/banner.component';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { SliderComponent } from 'src/app/components/slider/slider.component';
import { MetaService } from 'src/app/services/meta.service';
import {
  ContentService,
  ContentKind,
  ContentItem,
  ContentSnapshot,
} from 'src/app/state/content.service';
import { DeviceDetectorService } from 'src/app/services/device-detector.service';
import { DateAlias } from 'src/app/api/models';

type ContentType = 'series' | 'movies';

@Component({
  selector: 'app-content-page',
  templateUrl: './content-page.component.html',
  styleUrls: ['./content-page.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SliderComponent, NavBarComponent, BannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPageComponent implements OnInit, OnDestroy {
  public contentType: ContentType = 'movies'; // Default
  public contentTitle: string = '';

  public get sliderVariant(): 'series' | 'peliculas' {
    return this.contentType === 'series' ? 'series' : 'peliculas';
  }

  public items: ContentItem[] = [];
  public categorias: string[] = [];
  public destacada: ContentItem | null = null;
  public en_emision: ContentItem[] = [];
  public isLoading = true;
  public ldJson: string = '';

  // Cache for categories
  public itemsPorCategoria = new Map<string, ContentItem[]>();
  private destroy$ = new Subject<void>();

  // Search & Filter state
  public activeCategoryFilter: string | null = null;
  public selectedDate: DateAlias = 'today';

  // Dropdown states
  public isCategoryDropdownOpen = false;
  public isDayDropdownOpen = false;

  public diasDisponibles: { label: string; value: DateAlias }[] = [
    { label: 'Ayer', value: 'yesterday' },
    { label: 'Hoy', value: 'today' },
    { label: 'Mañana', value: 'tomorrow' },
    { label: 'Pasado mañana', value: 'day-after-tomorrow' },
  ];

  constructor(
    private contentSvc: ContentService,
    private metaSvc: MetaService,
    public router: Router,
    private route: ActivatedRoute,
    public deviceDetector: DeviceDetectorService,
    private cdr: ChangeDetectorRef
  ) {}

  public toggleCategoryDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    this.isDayDropdownOpen = false;
  }

  public toggleDayDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.isDayDropdownOpen = !this.isDayDropdownOpen;
    this.isCategoryDropdownOpen = false;
  }

  public selectCategory(cat: string | null): void {
    this.activeCategoryFilter = cat;
    this.isCategoryDropdownOpen = false;
    this.applyFilters();
  }

  public selectDay(day: DateAlias): void {
    this.selectedDate = day;
    this.isDayDropdownOpen = false;
    this.initializePage();
  }

  public getSelectedDayLabel(): string {
    return this.diasDisponibles.find(d => d.value === this.selectedDate)?.label || 'Día';
  }

  private applyFilters(): void {
    // Basic filter application - more advanced logic could be added to searchResults if needed
    // For now we use the existing itemsPorCategoria logic in the template
    this.cdr.markForCheck();
  }

  public performSearch(term: string): void {
    // Redundant now, but keeping a minimal implementation for compatibility if needed
    this.applyFilters();
  }

  public toggleCategoryFilter(cat: string): void {
    this.selectCategory(this.activeCategoryFilter === cat ? null : cat);
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
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
    this.loadData(this.selectedDate);
  }

  private setupMetaTags(): void {
    if (this.contentType === 'series') {
      this.contentTitle = 'Series';
      this.metaSvc.setMetaTags({
        title: 'Series de TV en España Hoy en Emisión | Guía Completa',
        description:
          'Descubre todas las series que se emiten hoy en TV: dramas, comedias, thrillers y más. Guía actualizada en emisión en la televisión española con horarios y sinopsis.',
        canonicalUrl: this.router.url,
        keywords:
          'series en emisión hoy, series tv en directo, buscar series en tv, guía tv series España, qué ver ahora series',
        ogImage: '/assets/images/series-og.jpg',
      });
    } else {
      this.contentTitle = 'Peliculas';
      this.metaSvc.setMetaTags({
        title: 'Películas en TV Hoy en Emisión | Cartelera Completa',
        description:
          'Encuentra las mejores películas que se emiten hoy en televisión española: estrenos, clásicos, acción, comedia y drama. Guía en emisión con horarios y fichas completas.',
        canonicalUrl: this.router.url,
        keywords:
          'películas en emisión hoy, películas tv en directo, buscar películas en tv, cartelera tv España, qué ver ahora películas',
        ogImage: '/assets/images/peliculas-og.jpg',
      });
    }
  }

  private loadData(date: DateAlias = 'today'): void {
    console.log(`[ContentPage] Loading ${this.contentType} data for ${date}`);
    this.contentSvc
      .loadContent(this.contentType as ContentKind, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (snapshot) => this.manageData(snapshot),
        error: (error) => {
          console.error(
            `[ContentPage] Error loading ${this.contentType} data:`,
            error
          );
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private manageData(snapshot: ContentSnapshot): void {
    const startTime = performance.now();
    this.items = snapshot.items;
    this.en_emision = snapshot.live.slice(0, 20);

    console.log(`[ContentPage] Data State for ${this.contentType}:`);
    console.log(`   - Total items: ${this.items.length}`);
    console.log(`   - Live items: ${this.en_emision.length}`);

    this.categorias = snapshot.categories
      .filter((cat) => cat && cat.toLowerCase().trim() !== 'otros')
      .slice(0, 12); // Slightly more categories

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.precacheCategories(), { timeout: 2000 });
    } else {
      setTimeout(() => this.precacheCategories(), 100);
    }

    this.loadDestacada(snapshot);

    this.isLoading = false;
    this.cdr.markForCheck();

    const endTime = performance.now();
    console.log(
      `[ContentPage] Processed ${this.contentType} in ${(endTime - startTime).toFixed(2)}ms`
    );
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

  private loadDestacada(snapshot: ContentSnapshot): void {
    setTimeout(() => {
      this.destacada = snapshot.featured || this.items[0] || null;
      if (this.destacada) {
        this.generateJsonLd();
      }
      this.cdr.markForCheck();
    }, 100);
  }

  public getCategoryDescription(cat: string): string {
    const base =
      this.contentType === 'series'
        ? 'Series en emisión hoy'
        : 'Películas en TV hoy';
    return `${base} de ${cat}: horarios, sinopsis y recomendaciones para ver ahora mismo en televisión.`;
  }

  private generateJsonLd(): void {
    try {
      const title = this.destacada?.title || this.destacada?.channel?.name;
      const description =
        this.destacada?.description ||
        `Guia de ${this.contentTitle} en television`;
      const image =
        this.destacada?.image || `/assets/images/${this.contentType}-og.jpg`;

      const pageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${this.contentTitle} en television`,
        description: `Guia actualizada de ${this.contentTitle.toLowerCase()} en television en Espana`,
        url: this.router.url,
        mainEntity: {
          '@type': this.contentType === 'series' ? 'TVSeries' : 'Movie',
          name: title,
          description,
          image,
        },
      };

      this.ldJson = JSON.stringify(pageLd);

      this.metaSvc.setMetaTags({
        title: `${title} — ${this.contentTitle} en TV | Guia TV`,
        description,
        canonicalUrl: this.router.url,
        keywords: `${this.contentType === 'series' ? 'serie' : 'pelicula'} ${title}, ${this.contentType} tv`,
        ogImage: image,
      });
    } catch {
      this.ldJson = '';
    }
  }

  public getItemsByCategory(categoria: string): ContentItem[] {
    if (this.itemsPorCategoria.has(categoria)) {
      return this.itemsPorCategoria.get(categoria)!;
    }

    const items = this.items
      .filter((item) =>
        (item.raw.category || '')
          .toLowerCase()
          .includes(categoria.toLowerCase())
      )
      .slice(0, this.contentType === 'series' ? 15 : 12);

    this.itemsPorCategoria.set(categoria, items);
    return items;
  }

  public trackByCategory(index: number, categoria: string): string {
    return categoria;
  }

  public toBannerData(item: ContentItem | null): any {
    if (!item) return {};
    return {
      id: item.id,
      title: item.title,
      channel: item.channel?.name || '',
      channelName: item.channel?.name || '',
      icon: item.channel?.icon,
      poster: item.image,
      start: item.start,
      stop: item.end,
      desc: { details: item.description },
      category: item.category,
      starRating: item.rating,
    };
  }
}

// Polyfill for requestIdleCallback
declare const requestIdleCallback: (
  callback: () => void,
  options?: { timeout: number }
) => number;
if (typeof requestIdleCallback === 'undefined') {
  (window as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 1);
}
