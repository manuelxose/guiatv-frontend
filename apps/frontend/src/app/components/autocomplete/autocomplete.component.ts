import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  map,
} from 'rxjs/operators';
import { CatalogService, CatalogSuggestion } from '../../services/catalog.service';

type FilterType = 'all' | 'tv' | 'streaming' | 'movies' | 'series';

interface SearchResult extends CatalogSuggestion {
  typeBadge: string;
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
export class AutocompleteComponent implements OnInit {
  public readonly dataInput = new FormControl('');
  public filteredData: Observable<SearchResult[]> = of([]);
  public activeFilter: FilterType = 'all';
  public isDropdownOpen = false;

  constructor(
    private readonly catalogService: CatalogService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.filteredData = this.dataInput.valueChanges.pipe(
      startWith(''),
      debounceTime(180),
      distinctUntilChanged(),
      switchMap((value) => {
        const query = typeof value === 'string' ? value.trim() : '';
        if (!query) {
          return of([]);
        }
        return this.catalogService.suggest(query, 8).pipe(
          map((items) => items
            .filter((item) => this.matchesActiveFilter(item))
            .map((item) => ({
              ...item,
              typeBadge: this.getItemType(item),
            }))
          )
        );
      })
    );
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
    const currentValue = this.dataInput.value || '';
    this.dataInput.setValue(currentValue, { emitEvent: true });
  }

  getFilterLabel(): string {
    if (this.activeFilter === 'tv') return 'TV';
    if (this.activeFilter === 'streaming') return 'Streaming';
    if (this.activeFilter === 'movies') return 'Películas';
    if (this.activeFilter === 'series') return 'Series';
    return 'Todo';
  }

  getFilterButtonClass(): string {
    if (this.activeFilter === 'tv') return 'text-emerald-300';
    if (this.activeFilter === 'streaming') return 'text-sky-300';
    if (this.activeFilter === 'movies') return 'text-amber-300';
    if (this.activeFilter === 'series') return 'text-violet-300';
    return 'text-gray-300';
  }

  getPlaceholder(): string {
    if (this.activeFilter === 'tv') return 'Buscar en televisión...';
    if (this.activeFilter === 'streaming') return 'Buscar en plataformas...';
    if (this.activeFilter === 'movies') return 'Buscar películas...';
    if (this.activeFilter === 'series') return 'Buscar series...';
    return 'Buscar en todo el catálogo...';
  }

  navigateTo(result: SearchResult): void {
    this.router.navigate(['/contenido', result.catalogId]);
    this.clearInput();
  }

  submitCurrentSearch(): void {
    const query = String(this.dataInput.value || '').trim();
    if (!query) {
      return;
    }

    this.router.navigate(['/programacion-tv/que-ver-hoy'], {
      queryParams: {
        q: query,
        ...(this.activeFilter === 'tv'
          ? { types: 'program', availability: 'live' }
          : this.activeFilter === 'streaming'
            ? { types: 'movie,series', availability: 'streaming' }
            : this.activeFilter === 'movies'
              ? { types: 'movie' }
              : this.activeFilter === 'series'
                ? { types: 'series' }
                : {}),
      },
    });
    this.clearInput();
  }

  displayFn(result: SearchResult | string): string {
    if (!result) return '';
    return typeof result === 'string' ? result : result.title || '';
  }

  getOptionImage(result: SearchResult): string {
    return result.image || '/assets/images/default-movie-poster.svg';
  }

  getOptionTitle(result: SearchResult): string {
    return result.title || '';
  }

  getOptionSubtitle(result: SearchResult): string {
    return result.subtitle || result.primaryPlatforms?.join(' · ') || '';
  }

  getItemType(result: Pick<SearchResult, 'contentType' | 'source' | 'primaryPlatforms'>): string {
    if (result.source === 'program') return 'TV';
    if (result.contentType === 'movie') return 'Película';
    if (result.contentType === 'series') return 'Serie';
    return 'Contenido';
  }

  getTypeBadgeClass(result: SearchResult): string {
    if (result.source === 'program') return 'border-emerald-500/30 text-emerald-200';
    if (result.contentType === 'movie') return 'border-amber-500/30 text-amber-200';
    if (result.contentType === 'series') return 'border-violet-500/30 text-violet-200';
    return 'border-slate-600 text-slate-200';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-movie-poster.svg';
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    if ((event.target as HTMLElement)?.tagName?.toLowerCase() === 'input') {
      this.submitCurrentSearch();
    }
  }

  private clearInput(): void {
    setTimeout(() => this.dataInput.setValue(''), 50);
  }

  private matchesActiveFilter(item: CatalogSuggestion): boolean {
    if (this.activeFilter === 'all') return true;
    if (this.activeFilter === 'tv') return item.source === 'program';
    if (this.activeFilter === 'streaming') return item.source === 'tmdb';
    if (this.activeFilter === 'movies') return item.contentType === 'movie';
    if (this.activeFilter === 'series') return item.contentType === 'series';
    return true;
  }
}
