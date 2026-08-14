import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FilterChipBarComponent, FilterChipItem } from '../filter-chip-bar/filter-chip-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { UnifiedRailSectionComponent } from '../unified-rail-section/unified-rail-section.component';
import {
  UnifiedTopNavComponent,
  UnifiedTopNavTab,
} from '../unified-top-nav/unified-top-nav.component';
import { PORTAL_ICON_PATHS, PORTAL_PRIMARY_DESTINATIONS } from '../../config/portal-navigation.config';
import { APP_PATHS } from '../../config/route-map';
import { ChatService } from '../../services/chat.service';
import { StorageService } from '../../services/storage.service';
import { UserService } from '../../services/user.service';
import { ViewportService } from '../../services/viewport.service';
import { UnifiedShellUiStateService } from '../../state/unified-shell-ui.state';
import {
  UnifiedPortalHeroVariant,
  UnifiedPortalMetric,
  UnifiedPortalRailItem,
  UnifiedPortalRailSection,
  UnifiedPortalRightRailVariant,
} from '../../models/portal-shell.models';

const SEARCH_HISTORY_KEY = 'gtv.unified-search.history';

export type {
  UnifiedPortalHeroVariant,
  UnifiedPortalMetric,
  UnifiedPortalRailActionId,
  UnifiedPortalRailItem,
  UnifiedPortalRailSection,
  UnifiedPortalRailSectionVariant,
  UnifiedPortalRightRailVariant,
} from '../../models/portal-shell.models';

@Component({
  selector: 'app-unified-portal-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedTopNavComponent,
    BreadcrumbComponent,
    FilterChipBarComponent,
    FooterComponent,
    UnifiedRailSectionComponent,
  ],
  templateUrl: './unified-portal-shell.component.html',
  styleUrl: './unified-portal-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class UnifiedPortalShellComponent {
  private readonly shellUi = inject(UnifiedShellUiStateService);
  private readonly userService = inject(UserService);
  private readonly chatService = inject(ChatService);
  private readonly storage = inject(StorageService);
  private readonly viewport = inject(ViewportService);

  readonly tone = input<
    'home' | 'live' | 'discover' | 'streaming' | 'sports' | 'editorial' | 'rankings'
  >('home');
  readonly activeTab = input<UnifiedTopNavTab['id'] | null>(null);
  readonly searchQuery = input('');
  readonly topPillChips = input<readonly FilterChipItem[]>([]);
  readonly topPillSelection = input<string | readonly string[]>('all');
  readonly topPillLabel = input('Filtros rápidos');
  readonly isAuthenticated = input(false);
  readonly profileName = input('Cuenta');
  readonly breadcrumbItems = input<readonly { name: string; url: string }[]>([]);
  readonly showHero = input(true);
  readonly eyebrow = input('');
  readonly title = input('');
  readonly description = input('');
  readonly heroVariant = input<UnifiedPortalHeroVariant>('default');
  readonly metrics = input<readonly UnifiedPortalMetric[]>([]);
  readonly filterButtonLabel = input('Filtros');
  readonly showFilterButton = input(false);
  readonly filterCount = input(0);
  readonly rightRailLabel = input('Panel contextual');
  readonly rightRailVariant = input<UnifiedPortalRightRailVariant>('default');
  readonly leftRailSections = input<readonly UnifiedPortalRailSection[]>([]);
  readonly rightRailSections = input<readonly UnifiedPortalRailSection[]>([]);

  @Output() tabChange = new EventEmitter<UnifiedTopNavTab['id']>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() topPillChange = new EventEmitter<string>();
  @Output() quickFilterChange = new EventEmitter<string>();
  @Output() filterToggle = new EventEmitter<void>();

  readonly tabs = signal(PORTAL_PRIMARY_DESTINATIONS.map((destination) => ({
    id: destination.id as UnifiedTopNavTab['id'],
    label: destination.label,
    path: destination.path,
    hint: destination.hint,
    iconPath: destination.iconPath,
  })));

  trackByTab(_index: number, tab: UnifiedTopNavTab): string {
    return tab.id;
  }

  readonly iconPaths = PORTAL_ICON_PATHS;
  readonly leftRailOpen = signal(false);
  readonly rightRailOpen = signal(false);
  readonly leftRailCollapsed = this.shellUi.leftRailCollapsed;
  readonly favorites = toSignal(this.userService.getFavorites(), { initialValue: [] as any[] });
  readonly watchlist = toSignal(this.userService.getWatchlist(), { initialValue: [] as any[] });
  readonly history = toSignal(this.userService.getInteractionHistory(), { initialValue: [] as any[] });
  readonly searchHistory = signal<string[]>(this.readSearchHistory());

  readonly personalLeftRailSections = computed(() => this.buildPersonalLeftRailSections());
  readonly resolvedLeftRailSections = computed(() =>
    this.leftRailSections().filter((section) => section.items.length > 0)
  );
  readonly hasLeftRail = computed(() =>
    this.resolvedLeftRailSections().some((section) => section.items.length > 0)
  );
  readonly hasTopPillShelf = computed(
    () => this.topPillChips().length > 0 || this.showFilterButton()
  );
  readonly showRightRailToggle = computed(() => false);

  // True once the hero has real eyebrow/title/description copy to show.
  // Media-only heroes (e.g. home's live-now hero, docs/visual-directions.md
  // Direction 3) skip the copy column entirely instead of rendering an empty
  // one — the projected `shell-hero-media` content is the answer, not a
  // headline about it.
  readonly heroHasCopy = computed(() => Boolean(this.eyebrow() || this.title() || this.description()));

  trackByMetric(_index: number, metric: UnifiedPortalMetric): string {
    return metric.label;
  }

  trackByRailSection(_index: number, section: UnifiedPortalRailSection): string {
    return section.id;
  }

  toggleLeftRail(): void {
    this.rightRailOpen.set(false);
    if (this.viewport.hasPersistentLeftRail()) {
      this.shellUi.toggleLeftRailCollapsed();
      return;
    }
    this.leftRailOpen.update((current) => !current);
  }

  toggleRightRail(): void {
    this.leftRailOpen.set(false);
    if (this.viewport.hasPersistentRightRail()) {
      return;
    }
    this.rightRailOpen.update((current) => !current);
  }

  closeLeftRail(): void {
    this.leftRailOpen.set(false);
  }

  closeRightRail(): void {
    this.rightRailOpen.set(false);
  }

  closeDrawers(): void {
    this.leftRailOpen.set(false);
    this.rightRailOpen.set(false);
  }

  handleRailAction(item: UnifiedPortalRailItem): void {
    if (item.actionId === 'assistant') {
      this.chatService.requestOpenChat('portal-assistant');
      this.closeDrawers();
    }
  }

  emitTopPillChange(value: string): void {
    this.topPillChange.emit(value);
    this.quickFilterChange.emit(value);
  }

  private buildPersonalLeftRailSections(): UnifiedPortalRailSection[] {
    const historyItems = this.searchHistory()
      .slice(0, 2)
      .map((entry, index) => ({
        id: `left-search-${index}`,
        label: entry,
        description: 'Retoma esta búsqueda',
        iconPath: PORTAL_ICON_PATHS.search,
        path: APP_PATHS.explore,
        queryParams: { q: entry },
      }));

    if (this.isAuthenticated()) {
      return [
        {
          id: 'portal-personal',
          eyebrow: 'Tu espacio',
          title: 'Seguimiento',
          description: 'Favoritos, guardados e historial sin moverlos al panel derecho.',
          items: [
            {
              id: 'personal-for-you',
              label: 'Para ti',
              description: 'Discovery personalizado',
              iconPath: PORTAL_ICON_PATHS.sparkles,
              path: APP_PATHS.forYou,
            },
            {
              id: 'personal-profile',
              label: 'Mi perfil',
              description: 'Actividad y preferencias',
              iconPath: PORTAL_ICON_PATHS.account,
              path: APP_PATHS.profile,
            },
            {
              id: 'personal-watchlist',
              label: 'Guardados',
              description: 'Pendientes por ver',
              iconPath: PORTAL_ICON_PATHS.bookmark,
              path: APP_PATHS.profile,
              badge: String(this.watchlist().length || 0),
            },
            {
              id: 'personal-favorites',
              label: 'Favoritos',
              description: 'Canales y contenidos seguidos',
              iconPath: PORTAL_ICON_PATHS.rankings,
              path: APP_PATHS.profile,
              badge: String(this.favorites().length || 0),
            },
            {
              id: 'personal-history',
              label: 'Historial',
              description: 'Continúa donde lo dejaste',
              iconPath: PORTAL_ICON_PATHS.history,
              path: APP_PATHS.forYou,
              badge: String(this.history().length || 0),
            },
            ...historyItems,
          ],
        },
      ];
    }

    return [
      {
        id: 'portal-personal',
        eyebrow: 'Tu espacio',
        title: 'Cuenta y memoria',
        description: 'Acceso limpio y búsquedas recientes dentro del rail secundario.',
        items: [
          {
            id: 'personal-login',
            label: 'Iniciar sesión',
            description: 'Activa guardados y seguimiento',
            iconPath: PORTAL_ICON_PATHS.account,
            path: APP_PATHS.login,
          },
          {
            id: 'personal-register',
            label: 'Crear cuenta',
            description: 'Empieza a personalizar',
            iconPath: PORTAL_ICON_PATHS.sparkles,
            path: APP_PATHS.register,
          },
          ...historyItems,
        ],
      },
    ];
  }

  private readSearchHistory(): string[] {
    const parsed = this.storage.readJson<unknown[]>(SEARCH_HISTORY_KEY, []);
    return Array.isArray(parsed)
      ? parsed.map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 5)
      : [];
  }
}
