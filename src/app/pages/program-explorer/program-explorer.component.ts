import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, first, filter, take } from 'rxjs';
import { NavBarComponent } from 'src/app/components/nav-bar/nav-bar.component';
import { CardListComponent } from 'src/app/components/card-list/card-list.component';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { TvDataService } from 'src/app/state/tv-data.service';
import { HttpService } from 'src/app/services/http.service';
import { isLive, slugify } from 'src/app/utils/utils';
import { ProgramsResponse, ProgramLayoutDTO, ChannelMetaDTO } from 'src/app/api/models';

type ExplorerMode = 'live' | 'featured';
type ContentType = 'all' | 'movies' | 'series';

@Component({
  selector: 'app-program-explorer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavBarComponent, CardListComponent],
  templateUrl: './program-explorer.component.html',
  styleUrls: ['./program-explorer.component.scss'],
})
export class ProgramExplorerComponent implements OnInit, OnDestroy {
  public mode: ExplorerMode = 'live';
  public activeType: ContentType = 'all';
  
  public loading = true;
  public error: string | null = null;
  
  // Data
  public allItems: any[] = [];
  public filteredItems: any[] = [];
  
  // Search & Filter
  public searchControl = new FormControl('');
  public isSearching = false;
  public categories: string[] = [];
  public activeCategoryFilter: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private metaSvc: MetaService,
    private tvData: TvDataService,
    private guiaSvc: TvGuideService,
    private http: HttpService
  ) {}

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.mode = data['mode'] || 'live';
      this.initializeView();
    });

    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => this.performSearch(term || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeView(): void {
    this.loading = true;
    this.error = null;
    this.allItems = [];
    this.filteredItems = [];
    this.activeType = 'all'; // Default to show all
    
    this.setupMetaTags();
    
    if (this.mode === 'live') {
      this.loadLiveData();
    } else {
      this.loadFeaturedData();
    }
  }

  private setupMetaTags(): void {
    if (this.mode === 'live') {
      this.metaSvc.setMetaTags({
        title: 'En Directo Ahora | Guía TV',
        description: 'Descubre qué se emite ahora mismo en TV: películas, series y programas en directo.',
        canonicalUrl: this.router.url
      });
    } else {
      this.metaSvc.setMetaTags({
        title: 'Qué Ver Hoy | Guía TV',
        description: 'Selección curada de las mejores películas y series para ver hoy en televisión.',
        canonicalUrl: this.router.url
      });
    }
  }

  // --- Data Loading Strategies ---

  private loadLiveData(): void {
    this.tvData.loadPrograms({ date: 'today', fields: 'full', limit: 5000 })
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => this.processLiveResponse(resp),
        error: (err) => this.handleError(err)
      });
  }

  private processLiveResponse(resp: ProgramsResponse): void {
    const programs = resp?.programs || [];
    const channelMap = new Map((resp?.channels || []).map(c => [c.id, c]));
    
    console.log('[ProgramExplorer] Processing programs:', {
      totalPrograms: programs.length,
      currentTime: new Date().toISOString(),
      currentTimeLocal: new Date().toLocaleString('es-ES'),
      sampleProgram: programs[0] ? {
        title: programs[0].title,
        start: programs[0].start,
        end: programs[0].end,
        startLocal: new Date(programs[0].start).toLocaleString('es-ES'),
        endLocal: new Date(programs[0].end).toLocaleString('es-ES')
      } : null
    });

    this.allItems = programs
      .filter(p => {
        const live = isLive(p.start, p.end);
        if (!live && Math.random() < 0.01) { // Log 1% of non-live for debugging
          console.log('[ProgramExplorer] Not live:', {
            title: p.title,
            start: new Date(p.start).toLocaleString('es-ES'),
            end: new Date(p.end).toLocaleString('es-ES'),
            now: new Date().toLocaleString('es-ES')
          });
        }
        return live;
      })
      .map(p => this.normalizeProgram(p, channelMap.get(p.channelId || '')));

    console.log('[ProgramExplorer] Live programs loaded:', {
      total: this.allItems.length,
      sample: this.allItems[0],
      currentTime: new Date().toISOString()
    });

    this.extractCategories();
    this.applyFilters();
    this.loading = false;
  }

  private loadFeaturedData(): void {
    // Reusing logic from ListaDestacadas
    this.http.getProgramacion('today')
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.guiaSvc.setData(data);
            Promise.all([
              this.guiaSvc.setPeliculasDestacadas(),
              this.guiaSvc.setSeriesDestacadas()
            ]).then(() => {
              this.loadFeaturedFromService();
            });
          } else {
             // Fallback or wait for stream
             this.loadFeaturedFromService(); 
          }
        },
        error: (err) => this.handleError(err)
      });
  }

  private loadFeaturedFromService(): void {
    // Combine both arrays for internal storage, filter by view later
    const movies$ = this.guiaSvc.getPeliculasDestacadas().pipe(take(1));
    const series$ = this.guiaSvc.getSeriesDestacadas().pipe(take(1));

    // We fetch both to have them ready for switching
    import('rxjs').then(({ forkJoin }) => {
        forkJoin([movies$, series$]).subscribe(([movies, series]) => {
            const normMovies = ((movies as any[]) || []).map(p => ({ ...this.normalizeGeneric(p), _type: 'movies' }));
            const normSeries = ((series as any[]) || []).map(p => ({ ...this.normalizeGeneric(p), _type: 'series' }));
            this.allItems = [...normMovies, ...normSeries];
            
            this.extractCategories();
            this.applyFilters();
            this.loading = false;
        });
    });
  }

  // --- Normalization ---

  private normalizeProgram(p: ProgramLayoutDTO, channel?: ChannelMetaDTO): any {
    const media = this.resolveMedia((p as any).image || (p as any).poster || (p as any).background);
    return {
      id: p.id,
      title: typeof p.title === 'object' ? p.title.value : p.title,
      channel: channel?.name || p.channelId,
      channelIcon: this.resolveMedia(channel?.icon),
      image: media,
      start: p.start,
      end: p.end,
      category: (p.category || '').toString(),
      description: ((p as any).desc?.details || (p as any).desc?.value || '').toString(),
      _type: this.guessType(p.category || ''),
      live: true
    };
  }

  private normalizeGeneric(p: any): any {
     return {
        id: p.id || p.uuid,
        title: p.title?.value || p.title,
        channel: p.channel?.name || p.channelName || 'Canal',
        image: p.image || p.poster || p.background || p.icon,
        start: p.start || p.startDate,
        category: p.category?.value || p.category || '',
        description: p.desc?.value || p.description || '',
        live: false
     };
  }

  private guessType(cat: string): ContentType {
    if (!cat) return 'movies'; // Default
    
    const c = cat.toLowerCase();
    
    // Check for series indicators
    if (c.includes('serie') || c.includes('season') || c.includes('episod')) {
      return 'series';
    }
    
    // Check for movie indicators (cine, película, movie, film)
    if (c.includes('cine') || c.includes('película') || c.includes('pelicula') || 
        c.includes('movie') || c.includes('film')) {
      return 'movies';
    }
    
    // Default to movies for other content
    return 'movies';
  }

  private resolveMedia(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('data')) return url;
    return (typeof window !== 'undefined' ? window.location.origin : '') + url;
  }

  // --- Filtering & Search ---

  public setType(type: ContentType): void {
    this.activeType = type;
    this.applyFilters();
  }

  public toggleCategoryFilter(cat: string): void {
    this.activeCategoryFilter = this.activeCategoryFilter === cat ? null : cat;
    this.applyFilters();
  }

  public performSearch(term: string): void {
    this.isSearching = !!term;
    this.applyFilters();
  }

  private applyFilters(): void {
    const term = this.searchControl.value?.toLowerCase().trim() || '';
    
    this.filteredItems = this.allItems.filter(item => {
      // 1. Type Filter (All, Movies, or Series)
      let typeMatch = true;
      if (this.activeType !== 'all') {
        const itemType = item._type || this.guessType(item.category);
        typeMatch = itemType === this.activeType;
      }
      
      // 2. Text Search
      const textMatch = !term || item.title.toLowerCase().includes(term);

      // 3. Category Filter
      const catMatch = !this.activeCategoryFilter || 
        (item.category && item.category.toLowerCase().includes(this.activeCategoryFilter.toLowerCase()));

      return typeMatch && textMatch && catMatch;
    });

    console.log('[ProgramExplorer] Filter applied:', {
      activeType: this.activeType,
      totalItems: this.allItems.length,
      filteredCount: this.filteredItems.length,
      sampleFiltered: this.filteredItems[0] ? {
        title: this.filteredItems[0].title,
        category: this.filteredItems[0].category,
        _type: this.filteredItems[0]._type
      } : null
    });
  }

  private extractCategories(): void {
    const cats = new Set<string>();
    this.allItems.forEach(i => {
      if (i.category) {
        const mainCat = i.category.split(',')[0].split('/')[0].trim();
        if (mainCat) cats.add(mainCat);
      }
    });
    this.categories = Array.from(cats).slice(0, 10); // Limit chips
  }

  // --- Helpers ---

  public trackById(index: number, item: any): any {
    return item.id || index;
  }

  public formatTime(dateStr: string): string {
    if (!dateStr) return '';
    
    // The API returns times in UTC, but they represent local Spanish time
    // So we need to subtract 1 hour to display correctly
    const date = new Date(dateStr);
    date.setHours(date.getHours() - 1);
    
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  public goToDetails(item: any): void {
    const slug = slugify(item.title);
    const route = this.activeType === 'series' ? '/programas' : '/peliculas';
    this.router.navigate([route, slug]);
  }

  private handleError(err: any): void {
    console.error('Explorer Error:', err);
    this.error = 'No se pudieron cargar los datos. Inténtalo de nuevo.';
    this.loading = false;
  }
}
