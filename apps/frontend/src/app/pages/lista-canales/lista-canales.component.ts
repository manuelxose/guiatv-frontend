import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription, forkJoin } from 'rxjs';

import { ApiConfigService } from 'src/app/api/api-config.service';
import {
  ChannelMetaDTO,
  ProgramsResponse,
} from 'src/app/api/models';
import { MetaService } from 'src/app/services/meta.service';
import { slugify } from 'src/app/utils/utils';
import { CatalogItem, CatalogService } from 'src/app/services/catalog.service';
import { buildProgramCatalogId } from 'src/app/utils/catalog';
import { TvDataService } from 'src/app/state/tv-data.service';

type GuideTabKey = 'now' | 'next' | 'night' | 'channels';
type ChannelGroupKey =
  | 'all'
  | 'tdt'
  | 'autonomico'
  | 'movistar'
  | 'online'
  | 'deporte';
type GuideCategoryKey = 'all' | 'Cine' | 'Series' | 'Deportes' | string;

interface GuideProgram {
  id: string;
  catalogId: string;
  title: string;
  channelId: string;
  channelName: string;
  channelIcon?: string;
  category?: string;
  normalizedCategory: string;
  image?: string;
  tmdbId?: number;
  primaryPlatforms: string[];
  providersResolvedAt?: string;
  start: string;
  end: string;
  liveNow: boolean;
  groupKey: Exclude<ChannelGroupKey, 'all'>;
  sortIndex: number;
  editorialScore: number;
  detailLink: any[];
  channelLink: any[];
}

interface GuideChannel {
  id: string;
  name: string;
  icon?: string;
  type: string;
  region?: string;
  isActive: boolean;
  sortIndex: number;
  groupKey: Exclude<ChannelGroupKey, 'all'>;
  channelLink: any[];
}

interface GuideSection {
  key: Exclude<ChannelGroupKey, 'all'>;
  title: string;
  description: string;
  channels: GuideChannel[];
}

const PRIMARY_GUIDE_CATEGORIES: Array<{ key: GuideCategoryKey; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'Cine', label: 'Cine' },
  { key: 'Series', label: 'Series' },
  { key: 'Deportes', label: 'Deportes' },
];

const EDITORIAL_CATEGORY_PRIORITY: Record<string, number> = {
  Cine: 0,
  Series: 1,
  Deportes: 2,
  Noticias: 3,
  Infantil: 4,
  Documental: 5,
  Entretenimiento: 6,
  Otros: 7,
};

@Component({
  selector: 'app-lista-canales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-canales.component.html',
  styleUrls: ['./lista-canales.component.scss'],
})
export class ListaCanalesComponent implements OnInit, OnDestroy {
  public readonly guideTabs: Array<{ key: GuideTabKey; label: string }> = [
    { key: 'now', label: 'Ahora' },
    { key: 'next', label: 'Siguiente' },
    { key: 'night', label: 'Esta noche' },
    { key: 'channels', label: 'Canales' },
  ];
  public readonly quickCategoryTabs = PRIMARY_GUIDE_CATEGORIES;

  public activeGuideTab: GuideTabKey = 'now';
  public selectedChannelGroup: ChannelGroupKey = 'tdt';
  public selectedCategory: GuideCategoryKey = 'all';
  public loading = true;
  public error: string | null = null;
  public safeLdHtml: SafeHtml | null = null;
  public isMoreCategoriesOpen = false;

  public channels: GuideChannel[] = [];
  public sections: GuideSection[] = [];
  public nowPrograms: GuideProgram[] = [];
  public nextPrograms: GuideProgram[] = [];
  public tonightPrograms: GuideProgram[] = [];

  private readonly subscriptions = new Subscription();
  private readonly isBrowser: boolean;
  private readonly enrichedCatalogIds = new Set<string>();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
    private readonly catalogService: CatalogService,
    private readonly apiConfig: ApiConfigService,
    private readonly metaService: MetaService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly tvDataService: TvDataService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Guía TV en directo y canales - Guía TV',
      description:
        'Consulta qué se está emitiendo ahora, qué viene después y qué destaca esta noche en la televisión española, con acceso directo a todos los canales.',
      canonicalUrl: this.router.url,
    });

    this.loadGuideData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public setActiveTab(tab: GuideTabKey): void {
    this.activeGuideTab = tab;
    this.ensureGuideEnrichment(tab);
    this.scrollToSection(this.sectionIdForTab(tab));
  }

  public selectChannelGroup(group: ChannelGroupKey): void {
    this.selectedChannelGroup = group;
    this.ensureGuideEnrichment(this.activeGuideTab);
    this.scrollToSection(this.sectionIdForTab(this.activeGuideTab));
  }

  public selectCategory(category: GuideCategoryKey): void {
    this.selectedCategory = category;
    this.isMoreCategoriesOpen = false;
    this.ensureGuideEnrichment(this.activeGuideTab);
  }

  public toggleMoreCategories(): void {
    this.isMoreCategoriesOpen = !this.isMoreCategoriesOpen;
  }

  public programTrackBy(index: number, program: GuideProgram): string {
    return program.id || `${program.channelId}-${index}`;
  }

  public channelTrackBy(index: number, channel: GuideChannel): string {
    return channel.id || `${channel.name}-${index}`;
  }

  public formatTimeRange(program: GuideProgram): string {
    return `${this.formatTime(program.start)} - ${this.formatTime(program.end)}`;
  }

  public navigateToChannel(channel: GuideChannel): void {
    if (!channel?.channelLink?.length) {
      return;
    }
    void this.router.navigate(channel.channelLink);
  }

  public formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  public get totalChannels(): number {
    return this.channels.length;
  }

  public get channelGroups(): Array<{ key: ChannelGroupKey; label: string; count: number }> {
    const countFor = (key: ChannelGroupKey) =>
      key === 'all'
        ? this.channels.length
        : this.sections.find((section) => section.key === key)?.channels.length || 0;

    const groups: Array<{ key: ChannelGroupKey; label: string; count: number }> = [
      { key: 'all', label: 'Todos', count: countFor('all') },
      { key: 'tdt', label: 'TDT', count: countFor('tdt') },
      { key: 'autonomico', label: 'Autonómicos', count: countFor('autonomico') },
      { key: 'movistar', label: 'Movistar+', count: countFor('movistar') },
      { key: 'online', label: 'Online', count: countFor('online') },
      { key: 'deporte', label: 'Deporte', count: countFor('deporte') },
    ];

    return groups.filter((group) => group.count > 0);
  }

  public get extraCategories(): string[] {
    const primaryKeys = new Set(PRIMARY_GUIDE_CATEGORIES.map((category) => category.key));
    const categories = new Set<string>();

    [...this.nowPrograms, ...this.nextPrograms, ...this.tonightPrograms].forEach((program) => {
      if (!primaryKeys.has(program.normalizedCategory) && program.normalizedCategory !== 'Otros') {
        categories.add(program.normalizedCategory);
      }
    });

    return Array.from(categories).sort((left, right) => left.localeCompare(right, 'es'));
  }

  public get visibleSections(): GuideSection[] {
    if (this.selectedChannelGroup === 'all') {
      return this.sections;
    }
    return this.sections.filter((section) => section.key === this.selectedChannelGroup);
  }

  public get quickChannels(): GuideChannel[] {
    const fallbackKey =
      this.selectedChannelGroup === 'all' ? 'tdt' : this.selectedChannelGroup;
    const section =
      this.sections.find((entry) => entry.key === fallbackKey) ||
      this.sections.find((entry) => entry.key === 'tdt') ||
      this.sections[0];
    return section?.channels.slice(0, 12) || [];
  }

  public get visibleNowPrograms(): GuideProgram[] {
    return this.filterPrograms(this.nowPrograms).slice(0, 12);
  }

  public get visibleNextPrograms(): GuideProgram[] {
    return this.filterPrograms(this.nextPrograms).slice(0, 12);
  }

  public get visibleTonightPrograms(): GuideProgram[] {
    return this.filterPrograms(this.tonightPrograms).slice(0, 12);
  }

  public isMoreCategoryActive(): boolean {
    return this.selectedCategory !== 'all' &&
      !PRIMARY_GUIDE_CATEGORIES.some((category) => category.key === this.selectedCategory);
  }

  private loadGuideData(): void {
    this.loading = true;
    this.error = null;

    this.subscriptions.add(
      forkJoin({
        channels: this.tvDataService.loadChannels(),
        programs: this.tvDataService.loadPrograms({
          date: 'today',
          fields: 'full',
          limit: 2500,
        }),
      }).subscribe({
        next: ({ channels, programs }) => {
          const normalizedChannels = this.normalizeChannels(programs, channels || []);
          const channelMap = new Map(
            normalizedChannels.map((channel) => [channel.id, channel] as const)
          );
          const programCards = this.normalizePrograms(programs, channelMap);

          this.channels = normalizedChannels;
          this.sections = this.buildSections(normalizedChannels);
          this.nowPrograms = this.sortPrograms(programCards.filter((program) => program.liveNow));
          this.nextPrograms = this.buildNextPrograms(programCards);
          this.tonightPrograms = this.buildTonightPrograms(programCards);
          this.buildLdJson(normalizedChannels);
          this.ensureGuideEnrichment('now');
          this.loading = false;
        },
        error: () => {
          this.error =
            'No se pudo cargar la guía ahora mismo. Inténtalo de nuevo en unos minutos.';
          this.loading = false;
        },
      })
    );
  }

  private normalizeChannels(
    response: ProgramsResponse | undefined,
    fullChannelCatalog: ChannelMetaDTO[]
  ): GuideChannel[] {
    const assetBaseUrl = this.apiConfig.getAssetBaseUrl();
    const metaById = new Map<string, ChannelMetaDTO>();

    [...(fullChannelCatalog || []), ...((response?.channels || []) as ChannelMetaDTO[])].forEach(
      (channel) => {
        if (channel?.id) {
          metaById.set(channel.id, {
            ...(metaById.get(channel.id) || {}),
            ...channel,
          });
        }
      }
    );

    const orderedChannels = (response?.channels || fullChannelCatalog || []).filter(
      (channel): channel is ChannelMetaDTO => Boolean(channel?.id)
    );

    return orderedChannels.map((channel, index) => {
      const merged = metaById.get(channel.id) || channel;
      let icon = merged.icon || undefined;
      if (!icon) {
        icon = `/storage/channel_icons/${merged.id}.webp`;
      }
      if (icon && !icon.startsWith('http')) {
        const cleanPath = icon.startsWith('/') ? icon : `/${icon}`;
        icon = `${assetBaseUrl}${cleanPath}`;
      }

      const slug = slugify(merged.name || merged.id);
      const groupKey = this.resolveChannelGroup(merged);

      return {
        id: merged.id,
        name: merged.name,
        icon,
        type: String(merged.type || 'TDT').toUpperCase(),
        region: merged.country || merged.countryCode || undefined,
        isActive: true,
        sortIndex: index,
        groupKey,
        channelLink: ['/programacion-tv/ver-canal', slug],
      };
    });
  }

  private normalizePrograms(
    response: ProgramsResponse | undefined,
    channelMap: Map<string, GuideChannel>
  ): GuideProgram[] {
    const now = Date.now();

    return ((response?.programs || [])
      .map((program) => {
        const channel = channelMap.get(program.channelId);
        if (!channel) {
          return null;
        }

        const title =
          typeof program.title === 'string'
            ? program.title
            : String(program.title?.value || '');
        if (!title.trim()) {
          return null;
        }

        const startTime = new Date(program.start).getTime();
        const endTime = new Date(program.end).getTime();
        const catalogId = buildProgramCatalogId(String(program.id));
        const normalizedCategory = this.normalizeGuideCategory(program.category, title);
        const editorialScore = this.buildEditorialScore(normalizedCategory, channel.sortIndex);

        return {
          id: String(program.id),
          catalogId,
          title,
          channelId: channel.id,
          channelName: channel.name,
          channelIcon: channel.icon,
          category: program.category,
          normalizedCategory,
          image: program.image,
          tmdbId: program.tmdbId,
          primaryPlatforms: [],
          start: program.start,
          end: program.end,
          liveNow: startTime <= now && now < endTime,
          groupKey: channel.groupKey,
          sortIndex: channel.sortIndex,
          editorialScore,
          detailLink: ['/contenido', catalogId],
          channelLink: channel.channelLink,
        } satisfies GuideProgram;
      })
      .filter(Boolean) as GuideProgram[]);
  }

  private buildNextPrograms(programs: GuideProgram[]): GuideProgram[] {
    const now = Date.now();
    const nextByChannel = new Map<string, GuideProgram>();

    programs.forEach((program) => {
      const start = new Date(program.start).getTime();
      if (start <= now) {
        return;
      }

      const current = nextByChannel.get(program.channelId);
      if (!current || start < new Date(current.start).getTime()) {
        nextByChannel.set(program.channelId, program);
      }
    });

    return this.sortPrograms(Array.from(nextByChannel.values()));
  }

  private buildTonightPrograms(programs: GuideProgram[]): GuideProgram[] {
    return this.sortPrograms(
      programs.filter((program) => {
        const start = new Date(program.start);
        const hour = start.getHours();
        return hour >= 20 && hour <= 23;
      })
    );
  }

  private sortPrograms(programs: GuideProgram[]): GuideProgram[] {
    return [...programs].sort((left, right) => {
      const categoryDifference = this.categoryPriority(left.normalizedCategory) - this.categoryPriority(right.normalizedCategory);
      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      if (left.sortIndex !== right.sortIndex) {
        return left.sortIndex - right.sortIndex;
      }

      return new Date(left.start).getTime() - new Date(right.start).getTime();
    });
  }

  private buildSections(channels: GuideChannel[]): GuideSection[] {
    const definitions: Array<{
      key: GuideSection['key'];
      title: string;
      description: string;
    }> = [
      {
        key: 'tdt',
        title: 'Canales TDT',
        description: 'Generalistas y temáticos de acceso abierto en el orden habitual de la TDT española.',
      },
      {
        key: 'autonomico',
        title: 'Canales autonómicos',
        description: 'Televisión regional para seguir la programación local y autonómica.',
      },
      {
        key: 'movistar',
        title: 'Canales Movistar+',
        description: 'Señales premium y temáticas dentro del ecosistema Movistar+.',
      },
      {
        key: 'online',
        title: 'Canales online y OTT',
        description: 'Señales conectadas, cable y otros canales digitales.',
      },
      {
        key: 'deporte',
        title: 'Canales deportivos',
        description: 'Cobertura temática de fútbol, motor, baloncesto y otros eventos.',
      },
    ];

    return definitions
      .map((definition) => ({
        key: definition.key,
        title: definition.title,
        description: definition.description,
        channels: channels.filter((channel) => channel.groupKey === definition.key),
      }))
      .filter((section) => section.channels.length > 0);
  }

  private buildLdJson(channels: GuideChannel[]): void {
    const baseUrl =
      this.isBrowser && this.document.location
        ? this.document.location.origin
        : '';

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Guía TV y canales de España',
      description:
        'Canales disponibles en Guía TV con acceso a emisiones actuales, próximas franjas y programación destacada de esta noche.',
      itemListElement: channels.slice(0, 150).map((channel, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: channel.name,
        url: `${baseUrl}/programacion-tv/ver-canal/${slugify(channel.name)}`,
      })),
    };

    this.safeLdHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
    );
  }

  private scrollToSection(id: string): void {
    if (!this.isBrowser) {
      return;
    }
    requestAnimationFrame(() => {
      this.document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  private ensureGuideEnrichment(tab: GuideTabKey): void {
    const programs = this.getProgramsByTab(tab)
      .filter((program) => !!program.catalogId && !this.enrichedCatalogIds.has(program.catalogId))
      .slice(0, 12);

    if (!programs.length) {
      return;
    }

    programs.forEach((program) => this.enrichedCatalogIds.add(program.catalogId));

    this.subscriptions.add(
      forkJoin(
        programs.map((program) => this.catalogService.getDetail(program.catalogId))
      ).subscribe((details) => {
        const byCatalogId = new Map<string, CatalogItem>();
        details.forEach((detail) => {
          if (detail?.catalogId) {
            byCatalogId.set(detail.catalogId, detail);
          }
        });

        this.nowPrograms = this.mergeProgramDetails(this.nowPrograms, byCatalogId);
        this.nextPrograms = this.mergeProgramDetails(this.nextPrograms, byCatalogId);
        this.tonightPrograms = this.mergeProgramDetails(this.tonightPrograms, byCatalogId);
      })
    );
  }

  private getProgramsByTab(tab: GuideTabKey): GuideProgram[] {
    if (tab === 'next') {
      return this.visibleNextPrograms;
    }
    if (tab === 'night') {
      return this.visibleTonightPrograms;
    }
    if (tab === 'channels') {
      return [];
    }
    return this.visibleNowPrograms;
  }

  private mergeProgramDetails(
    programs: GuideProgram[],
    details: Map<string, CatalogItem>
  ): GuideProgram[] {
    return programs.map((program) => {
      const detail = details.get(program.catalogId);
      if (!detail) {
        return program;
      }

      return {
        ...program,
        primaryPlatforms: detail.primaryPlatforms?.slice(0, 2) || [],
        providersResolvedAt: new Date().toISOString(),
        image: program.image || detail.backdrop || detail.image,
      };
    });
  }

  private filterPrograms(programs: GuideProgram[]): GuideProgram[] {
    return programs.filter((program) => {
      const matchesGroup =
        this.selectedChannelGroup === 'all' || program.groupKey === this.selectedChannelGroup;
      const matchesCategory =
        this.selectedCategory === 'all' || program.normalizedCategory === this.selectedCategory;
      return matchesGroup && matchesCategory;
    });
  }

  private resolveChannelGroup(
    channel: Pick<ChannelMetaDTO, 'type' | 'name'>
  ): Exclude<ChannelGroupKey, 'all'> {
    const type = String(channel.type || '').trim().toUpperCase();
    const name = String(channel.name || '').trim().toUpperCase();

    if (type === 'TDT') return 'tdt';
    if (type === 'AUTONOMICO') return 'autonomico';
    if (type === 'MOVISTAR') return 'movistar';
    if (type === 'DEPORTES' || type === 'SPORTS') return 'deporte';
    if (type === 'CABLE' || type === 'ONLINE' || type === 'OTT') return 'online';
    if (name.includes('DAZN') || name.includes('EUROSPORT')) return 'deporte';
    return 'online';
  }

  private normalizeGuideCategory(category?: string, title?: string): string {
    const source = `${category || ''} ${title || ''}`.toLowerCase();

    if (/(cine|pel[ií]cula|film|movie)/.test(source)) return 'Cine';
    if (/(serie|series|ficci[oó]n|telenovela|cap[ií]tulo)/.test(source)) return 'Series';
    if (/(deport|f[úu]tbol|baloncesto|tenis|formula|motogp|liga|champions)/.test(source)) return 'Deportes';
    if (/(noticia|informativo|actualidad|debate|pol[ií]tica)/.test(source)) return 'Noticias';
    if (/(infantil|dibujos|kids|juvenil|familia)/.test(source)) return 'Infantil';
    if (/(documental|docu)/.test(source)) return 'Documental';
    if (/(reality|entretenimiento|concurso|show|magazine)/.test(source)) return 'Entretenimiento';

    return category?.trim() || 'Otros';
  }

  private buildEditorialScore(category: string, sortIndex: number): number {
    const priority = this.categoryPriority(category);
    return 1000 - priority * 100 - sortIndex;
  }

  private categoryPriority(category: string): number {
    return EDITORIAL_CATEGORY_PRIORITY[category] ?? EDITORIAL_CATEGORY_PRIORITY['Otros'];
  }

  private sectionIdForTab(tab: GuideTabKey): string {
    if (tab === 'next') return 'guide-next';
    if (tab === 'night') return 'guide-tonight';
    if (tab === 'channels') return 'guide-directory';
    return 'guide-now';
  }
}
