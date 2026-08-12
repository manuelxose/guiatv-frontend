import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { DiscoveryService } from '../../services/discovery.service';
import { CatalogItem } from '../../services/catalog.service';
import { StorageService } from '../../services/storage.service';

const SEARCH_HISTORY_KEY = 'gtv.unified-search.history';

@Component({
  selector: 'app-unified-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './unified-search.component.html',
  styleUrl: './unified-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedSearchComponent implements OnInit, OnChanges {
  private readonly destroyRef = inject(DestroyRef);

  @Input() activeTab: 'live' | 'discover' | 'streaming' | 'sports' | null = 'discover';
  @Input() query = '';
  @Input() expanded = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();

  readonly control = new FormControl('', { nonNullable: true });
  suggestions: CatalogItem[] = [];
  history: string[] = [];
  showMenu = false;
  isLoading = false;
  focusedIndex = -1;
  private userInteracted = false;

  private readonly isBrowser: boolean;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly router: Router,
    private readonly storage: StorageService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.control.setValue(this.query || '', { emitEvent: false });
    this.history = this.readHistory();

    this.control.valueChanges
      .pipe(
        startWith(this.query || ''),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const q = String(value || '').trim();
          this.searchChange.emit(q);
          if (!q) {
            this.isLoading = false;
            return of([]);
          }
          this.isLoading = true;
          return this.discoveryService.search({ q, limit: 5 }).pipe(
            map((response) => (response.items || []).filter((item) => this.matchesTab(item)))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => {
        this.suggestions = items;
        this.isLoading = false;
        this.focusedIndex = -1;
        // Only show menu if user has interacted with the input
        if (this.userInteracted) {
          this.showMenu = true;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('query' in changes && this.control.value !== this.query) {
      this.control.setValue(this.query || '', { emitEvent: false });
    }
  }

  get placeholder(): string {
    if (this.activeTab === 'live') {
      return 'Buscar programas, franjas o canales';
    }
    if (this.activeTab === 'streaming') {
      return 'Buscar títulos, plataformas o géneros';
    }
    if (this.activeTab === 'sports') {
      return 'Buscar eventos, deportes o competiciones';
    }
    return 'Buscar en todo el portal';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showMenu = false;
  }

  onFocus(): void {
    this.userInteracted = true;
    this.showMenu = true;
    this.focusedIndex = -1;
  }

  onShellClick(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.showMenu) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        this.showMenu = true;
      }
      return;
    }

    const itemsCount = this.suggestions.length > 0 ? this.suggestions.length : this.history.length;
    if (itemsCount === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedIndex = Math.min(this.focusedIndex + 1, itemsCount - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedIndex = Math.max(this.focusedIndex - 1, -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.focusedIndex >= 0) {
        if (this.suggestions.length > 0) {
          this.openSuggestion(this.suggestions[this.focusedIndex]);
        } else {
          this.useHistory(this.history[this.focusedIndex]);
        }
      } else {
        this.submit();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.showMenu = false;
      this.focusedIndex = -1;
    }
  }

  clear(): void {
    this.control.setValue('');
    this.searchChange.emit('');
    this.showMenu = false;
  }

  submit(): void {
    const value = String(this.control.value || '').trim();
    this.persistHistory(value);
    this.searchSubmit.emit(value);
    this.showMenu = false;
  }

  openSuggestion(item: CatalogItem): void {
    this.persistHistory(item.title);
    this.showMenu = false;
    void this.router.navigateByUrl(item.detailPath || `/contenido/${item.catalogId}`);
  }

  useHistory(entry: string): void {
    this.control.setValue(entry);
    this.submit();
  }

  private matchesTab(item: CatalogItem): boolean {
    if (!this.activeTab) {
      return true;
    }
    if (this.activeTab === 'live' || this.activeTab === 'sports') {
      return item.source === 'program';
    }
    if (this.activeTab === 'streaming') {
      return item.source !== 'program';
    }
    return true;
  }

  private persistHistory(value: string): void {
    if (!this.isBrowser || !value) {
      return;
    }
    const next = [value, ...this.readHistory().filter((entry) => entry !== value)].slice(0, 5);
    this.storage.writeJson(SEARCH_HISTORY_KEY, next);
    this.history = next;
  }

  private readHistory(): string[] {
    if (!this.isBrowser) {
      return [];
    }
    const parsed = this.storage.readJson<unknown[]>(SEARCH_HISTORY_KEY, []);
    return Array.isArray(parsed)
      ? parsed.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
  }
}
