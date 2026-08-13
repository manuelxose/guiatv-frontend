import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UnifiedPortalShellComponent } from '../../../components/unified-portal-shell/unified-portal-shell.component';
import { EditorialPostCardComponent } from '../../components/editorial-post-card/editorial-post-card.component';
import { CommunityListCardComponent } from '../../../pages/user-area/components/community-list-card/community-list-card.component';
import { APP_PATHS } from '../../../config/route-map';
import { MetaService } from '../../../services/meta.service';
import { UserService } from '../../../services/user.service';
import { EditorialCategorySection, EditorialPost } from '../../models/editorial.models';
import { EditorialService } from '../../services/editorial.service';
import { CommunityList } from '../../../interfaces/user.interface';
import { generateCollectionPageSchema } from '../../../utils/utils';
import { UnifiedTopNavTab } from '../../../components/unified-top-nav/unified-top-nav.component';
import { UnifiedPortalMetric, UnifiedPortalRailSection } from '../../../models/portal-shell.models';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { PORTAL_ICON_PATHS } from '../../../config/portal-navigation.config';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UnifiedPortalShellComponent,
    EditorialPostCardComponent,
    CommunityListCardComponent,
  ],
  templateUrl: './blog-home.component.html',
  styleUrls: ['./blog-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHomeComponent implements OnInit, OnDestroy {
  public readonly appPaths = APP_PATHS;
  public readonly iconPaths = PORTAL_ICON_PATHS;
  public readonly searchQuery = signal('');
  public readonly isAuthenticated = toSignal(this.userService.isAuthenticated$, { initialValue: false });
  public readonly profile = toSignal(this.userService.getProfile(), {
    initialValue: this.userService.getProfileSnapshot(),
  });
  public readonly topPillChips: FilterChipItem[] = [
    { id: 'guides', label: 'Guías', iconPath: this.iconPaths.editorial, tone: 'discover' },
    { id: 'rankings', label: 'Rankings', iconPath: this.iconPaths.rankings, tone: 'discover' },
    { id: 'trends', label: 'Tendencias', iconPath: this.iconPaths.trends, tone: 'discover' },
    { id: 'platforms', label: 'Plataformas', iconPath: this.iconPaths.platforms, tone: 'streaming' },
  ];
  public readonly metrics: UnifiedPortalMetric[] = [
    { label: 'Capa editorial', value: 'Guías · rankings · tendencias', detail: 'El contenido editorial se integra dentro del mismo sistema de navegación del portal.', iconPath: 'M6.75 5.25h10.5v13.5H6.75z' },
    { label: 'Contexto útil', value: 'Catálogo + plataformas', detail: 'Los artículos vuelven a empujar acciones reales dentro de la app.', iconPath: 'M3.75 7.5a2.25 2.25 0 0 1 2.25-2.25h12A2.25 2.25 0 0 1 20.25 7.5v9A2.25 2.25 0 0 1 18 18.75H6A2.25 2.25 0 0 1 3.75 16.5v-9Z' },
    { label: 'Profundidad', value: 'Portada rica y conectada', detail: 'Editorial deja de ser un destino aislado y vuelve al flujo de descubrimiento.', iconPath: 'M7.5 15.75 10.5 12l2.25 2.25L16.5 9.75' },
  ];
  public readonly breadcrumbItems = [
    { name: 'Inicio', url: APP_PATHS.home },
    { name: 'Editorial', url: APP_PATHS.blog },
  ];
  public readonly leftRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'editorial-left',
      eyebrow: 'Editorial',
      title: 'Explora el contexto',
      description: 'Guías, rankings y tendencias dentro del mismo sistema.',
      items: [
        { id: 'editorial-left-home', label: 'Editorial', description: 'Portada editorial', iconPath: this.iconPaths.editorial, path: APP_PATHS.blog },
        { id: 'editorial-left-rankings', label: 'Rankings', description: 'Top listas y selecciones', iconPath: this.iconPaths.rankings, path: APP_PATHS.top10 },
        { id: 'editorial-left-trends', label: 'Tendencias', description: 'Pulso del catálogo', iconPath: this.iconPaths.trends, path: APP_PATHS.stats },
        { id: 'editorial-left-streaming', label: 'Plataformas', description: 'Cruce con servicios', iconPath: this.iconPaths.platforms, path: APP_PATHS.platforms },
      ],
    },
  ]);
  public readonly rightRailSections = computed<UnifiedPortalRailSection[]>(() => [
    {
      id: 'editorial-right-guides',
      eyebrow: 'Cruces',
      title: 'Usa editorial para decidir',
      description: 'La capa editorial empuja discovery y streaming, no vive aparte.',
      variant: 'compact',
      items: [
        { id: 'editorial-right-discover', label: 'Qué Ver', description: 'Abrir discovery principal', iconPath: this.iconPaths.discover, path: APP_PATHS.explore },
        { id: 'editorial-right-platforms', label: 'Plataformas', description: 'Entrar por servicio', iconPath: this.iconPaths.platforms, path: APP_PATHS.platforms },
        { id: 'editorial-right-compare', label: 'Comparador', description: 'Cruzar servicios y perfiles', iconPath: this.iconPaths.compare, path: APP_PATHS.streamingComparison },
      ],
    },
  ]);

  public loading = true;
  public error: string | null = null;
  public hero: EditorialPost | null = null;
  public guidePosts: EditorialPost[] = [];
  public rankingPosts: EditorialPost[] = [];
  public trendPosts: EditorialPost[] = [];
  public categorySections: EditorialCategorySection[] = [];
  public communityLists: CommunityList[] = [];
  public safeLdHtml: SafeHtml | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorialService: EditorialService,
    private readonly metaService: MetaService,
    private readonly userService: UserService,
    private readonly sanitizer: DomSanitizer,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Editorial de cine, series y streaming | Guía TV',
      description:
        'Reportajes, guías y rankings conectados con la app para descubrir qué ver, dónde verlo y por qué merece la pena.',
      canonicalUrl: '/editorial',
      image: '/assets/images/blog-og-image.webp',
      type: 'website',
    });
    this.buildStructuredData();

    this.editorialService
      .getHubState()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.hero = state.hero;
          this.guidePosts = state.guidePosts;
          this.rankingPosts = state.rankingPosts;
          this.trendPosts = state.trendPosts;
          this.categorySections = state.categorySections;
          this.loading = false;
        },
        error: () => {
          this.error = 'No se ha podido cargar la capa editorial.';
          this.loading = false;
        },
      });

    this.userService
      .fetchCommunityLists(4)
      .pipe(takeUntil(this.destroy$))
      .subscribe((lists) => {
        this.communityLists = lists;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToTab(tab: UnifiedTopNavTab['id']): void {
    const pathMap: Record<UnifiedTopNavTab['id'], string> = {
      live: APP_PATHS.guide,
      discover: APP_PATHS.explore,
      streaming: APP_PATHS.platforms,
      sports: APP_PATHS.sports,
    };
    void this.router.navigateByUrl(pathMap[tab]);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSearchSubmit(value: string): void {
    this.searchQuery.set(value);
    void this.router.navigate([APP_PATHS.explore], {
      queryParams: value ? { q: value } : {},
    });
  }

  onTopPillChange(value: string): void {
    const target = {
      guides: APP_PATHS.blog,
      rankings: APP_PATHS.top10,
      trends: APP_PATHS.stats,
      platforms: APP_PATHS.platforms,
    }[value];
    if (target) {
      void this.router.navigateByUrl(target);
    }
  }

  private buildStructuredData(): void {
    const baseUrl = 'https://guiaprogramaciontv.com';
    const schema = generateCollectionPageSchema(
      {
        name: 'Editorial Guia TV',
        description:
          'Guias, rankings y tendencias conectadas con la programacion TV, las plataformas y el descubrimiento de la app.',
        path: '/editorial',
      },
      baseUrl
    );
    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }
}
