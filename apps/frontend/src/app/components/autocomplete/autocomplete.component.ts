import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { slugify } from 'src/app/utils/utils';
import { Observable } from 'rxjs';
import {
  map,
  startWith,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { ProgramListService } from 'src/app/state/program-list.service';
import { ContentService } from 'src/app/state/content.service';

type FilterType = 'all' | 'channels' | 'movies' | 'series' | 'programs';

interface SearchResult {
  type: 'channel' | 'movie' | 'series' | 'program';
  title: string;
  image: string;
  subtitle?: string;
  data: any;
}

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
  ],
})
export class AutocompleteComponent {
  public dataInput: FormControl;
  public filteredData: Observable<SearchResult[]>;
  public activeFilter: FilterType = 'movies'; // Default to movies
  public isDropdownOpen = false;
  
  private channelsData: any[] = [];
  private moviesData: any[] = [];
  private seriesData: any[] = [];

  constructor(
    private programList: ProgramListService,
    private contentService: ContentService,
    private router: Router
  ) {
    this.dataInput = new FormControl();
    this.filteredData = new Observable<SearchResult[]>();
  }

  ngOnInit(): void {
    this.loadDataSources();
    
    this.filteredData = this.dataInput.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      map((value) => {
        const str = typeof value === 'string' ? value : '';
        return this._filter(str);
      })
    );
  }

  private loadDataSources(): void {
    this.programList.loadProgramList('today').subscribe({
      next: (snap) => {
        this.channelsData = snap.channels || [];
      },
      error: (err) => console.error('Error loading channels', err),
    });

    this.contentService.loadContent('movies', 'today').subscribe({
      next: (snap) => {
        this.moviesData = snap.items || [];
      },
      error: (err) => console.error('Error loading movies', err),
    });

    this.contentService.loadContent('series', 'today').subscribe({
      next: (snap) => {
        this.seriesData = snap.items || [];
      },
      error: (err) => console.error('Error loading series', err),
    });
  }

  private _filter(query: string): SearchResult[] {
    const str = (query || '').trim().toLowerCase();
    if (str.length === 0) return [];

    const results: SearchResult[] = [];

    if (this.activeFilter === 'all' || this.activeFilter === 'channels') {
      const channels = this.channelsData
        .filter((c) => c?.channel?.name?.toLowerCase().includes(str))
        .slice(0, 3)
        .map((c) => ({
          type: 'channel' as const,
          title: c.channel?.name || '',
          image: `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${c.channel?.name}.png`,
          subtitle: 'Canal de televisión',
          data: c,
        }));
      results.push(...channels);
    }

    if (this.activeFilter === 'all' || this.activeFilter === 'programs') {
      const programs = this.channelsData
        .flatMap((c) => c?.programs || [])
        .filter((p) => p?.title?.value?.toLowerCase().includes(str))
        .slice(0, 3)
        .map((p) => ({
          type: 'program' as const,
          title: p.title?.value || '',
          image: p.icon || '/assets/images/placeholder.jpg',
          subtitle: p.start ? `${new Date(p.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : '',
          data: p,
        }));
      results.push(...programs);
    }

    if (this.activeFilter === 'all' || this.activeFilter === 'movies') {
      const movies = this.moviesData
        .filter((m) => m?.title?.toLowerCase().includes(str))
        .slice(0, 3)
        .map((m) => ({
          type: 'movie' as const,
          title: m.title || '',
          image: m.image || '/assets/images/placeholder.jpg',
          subtitle: m.category || 'Película',
          data: m,
        }));
      results.push(...movies);
    }

    if (this.activeFilter === 'all' || this.activeFilter === 'series') {
      const series = this.seriesData
        .filter((s) => s?.title?.toLowerCase().includes(str))
        .slice(0, 3)
        .map((s) => ({
          type: 'series' as const,
          title: s.title || '',
          image: s.image || '/assets/images/placeholder.jpg',
          subtitle: s.category || 'Serie',
          data: s,
        }));
      results.push(...series);
    }

    return results.slice(0, 8);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.isDropdownOpen = false;
    const currentValue = this.dataInput.value;
    this.dataInput.setValue(currentValue || '');
  }

  getFilterLabel(): string {
    switch (this.activeFilter) {
      case 'channels': return 'Canales';
      case 'movies': return 'Películas';
      case 'series': return 'Series';
      case 'programs': return 'Programas';
      default: return 'Todos';
    }
  }

  getFilterButtonClass(): string {
    switch (this.activeFilter) {
      case 'channels': return 'text-blue-300';
      case 'movies': return 'text-purple-300';
      case 'series': return 'text-green-300';
      case 'programs': return 'text-orange-300';
      default: return 'text-gray-300';
    }
  }

  getPlaceholder(): string {
    switch (this.activeFilter) {
      case 'channels': return 'Buscar canales...';
      case 'movies': return 'Buscar películas...';
      case 'series': return 'Buscar series...';
      case 'programs': return 'Buscar programas...';
      default: return 'Buscar...';
    }
  }

  navigateTo(result: SearchResult): void {
    switch (result.type) {
      case 'channel':
        this.router.navigate(['/programacion-tv/ver-canal', slugify(result.title)]);
        break;
      case 'movie':
        this.router.navigate(['/peliculas', slugify(result.title)]);
        break;
      case 'series':
        this.router.navigate(['/series', slugify(result.title)]);
        break;
      case 'program':
        this.router.navigate(['/programas', slugify(result.title)]);
        break;
    }
    this.clearInput();
  }

  private clearInput(): void {
    setTimeout(() => this.dataInput.setValue(''), 50);
  }

  displayFn(result: SearchResult | string): string {
    if (!result) return '';
    if (typeof result === 'string') return result;
    return result.title || '';
  }

  getOptionImage(result: SearchResult): string {
    return result.image || '/assets/images/placeholder.jpg';
  }

  getOptionTitle(result: SearchResult): string {
    return result.title || '';
  }

  getOptionSubtitle(result: SearchResult): string {
    return result.subtitle || '';
  }

  getItemType(result: SearchResult): string {
    switch (result.type) {
      case 'channel': return 'Canal';
      case 'movie': return 'Película';
      case 'series': return 'Serie';
      case 'program': return 'Programa';
      default: return '';
    }
  }

  getTypeBadgeClass(result: SearchResult): string {
    switch (result.type) {
      case 'channel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'movie': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'series': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'program': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/placeholder.jpg';
  }
}
