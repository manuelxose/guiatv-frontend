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
import { Subscription, of, timeout, catchError } from 'rxjs';

import { ApiConfigService } from 'src/app/api/api-config.service';
import {
  ChannelMetaDTO,
  TvGuideSurfaceDTO,
  TvReadItemDTO,
} from 'src/app/api/models';
import { MetaService } from 'src/app/services/meta.service';
import { slugify } from 'src/app/utils/utils';
import { buildDetailPath, CatalogContentType } from 'src/app/utils/catalog';
import { TvDataService } from 'src/app/state/tv-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { FaqSectionComponent, FaqItem } from '../../components/faq-section/faq-section.component';
import { InteractionButtonsComponent } from '../../components/interaction-buttons/interaction-buttons.component';

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

@Component({
  selector: 'app-lista-canales',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, FaqSectionComponent, InteractionButtonsComponent],
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
  public readonly breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Inicio', url: '/' },
    { name: 'Guía de Canales', url: '/programacion-tv/guia-canales' },
  ];
  public readonly faqItems: FaqItem[] = [
    {
      question: '¿Qué canales de TDT puedo ver gratis en España?',
      answer: 'En España hay más de 20 canales de TDT gratuitos, entre ellos La 1, La 2, Antena 3, Cuatro, Telecinco, La Sexta, Neox, Nova, Mega, Energy, Divinity, Clan, Boing, 24 Horas, Teledeporte, DMAX, DKISS, Atreseries, Atrescine, TRECE, Be Mad y GOL.',
    },
    {
      question: '¿Cómo consultar la programación de TV de hoy?',
      answer: 'Desde esta página puedes ver qué se emite ahora, qué programa viene a continuación y qué hay esta noche en los principales canales. Usa las pestañas «Ahora», «Siguiente» y «Esta noche» para cambiar de franja horaria.',
    },
    {
      question: '¿Se puede filtrar por tipo de canal o categoría?',
      answer: 'Sí. Puedes filtrar por grupo de canales (TDT, Autonómicos, Movistar+, Online, Deporte) y por categoría de contenido (Cine, Series, Deportes y más) para encontrar rápidamente lo que buscas.',
    },
    {
      question: '¿Qué diferencia hay entre canales TDT y Movistar+?',
      answer: 'Los canales TDT son gratuitos y se reciben con una antena terrestre convencional. Los canales de Movistar+ requieren una suscripción de pago y ofrecen contenido premium como cine de estreno, series originales y deporte exclusivo.',
    },
    {
      question: '¿Con qué frecuencia se actualiza la guía de programación?',
      answer: 'La guía de programación se actualiza varias veces al día de forma automática para reflejar cambios de última hora en la parrilla de cada canal.',
    },
  ];

  public channels: GuideChannel[] = [];
  public sections: GuideSection[] = [];
  public nowPrograms: GuideProgram[] = [];
  public nextPrograms: GuideProgram[] = [];
  public tonightPrograms: GuideProgram[] = [];

  private readonly subscriptions = new Subscription();
  private readonly isBrowser: boolean;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
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
      title: 'Canales TDT y televisión en directo — Guía Programación TV',
      description:
        'Consulta qué se está emitiendo ahora, qué viene después y qué destaca esta noche en la televisión española, con acceso directo a todos los canales TDT.',
      canonicalUrl: this.router.url,
    });

    this.loadGuideData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public setActiveTab(tab: GuideTabKey): void {
    this.activeGuideTab = tab;
    // Scroll al inicio del área de contenido (debajo de la barra sticky)
    if (this.isBrowser) {
      requestAnimationFrame(() => {
        const nav = this.document.querySelector('.guide-nav') as HTMLElement | null;
        if (nav) {
          const offset = nav.getBoundingClientRect().bottom + (this.document.documentElement.scrollTop || 0);
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      });
    }
  }

  public selectChannelGroup(group: ChannelGroupKey): void {
    this.selectedChannelGroup = group;
  }

  public selectCategory(category: GuideCategoryKey): void {
    this.selectedCategory = category;
    this.isMoreCategoriesOpen = false;
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
    return section?.channels || [];
  }

  public get visibleNowPrograms(): GuideProgram[] {
    return this.filterPrograms(this.nowPrograms);
  }

  public get visibleNextPrograms(): GuideProgram[] {
    return this.filterPrograms(this.nextPrograms);
  }

  public get visibleTonightPrograms(): GuideProgram[] {
    return this.filterPrograms(this.tonightPrograms);
  }

  public isMoreCategoryActive(): boolean {
    return this.selectedCategory !== 'all' &&
      !PRIMARY_GUIDE_CATEGORIES.some((category) => category.key === this.selectedCategory);
  }

  private loadGuideData(): void {
    this.loading = true;
    this.error = null;

    this.subscriptions.add(
      this.tvDataService.loadGuideSurface('today').pipe(
        timeout(12000),
        catchError(() => of(undefined))
      ).subscribe({
        next: (response) => {
          if (!response) {
            throw new Error('empty_guide_response');
          }
          const normalizedChannels = this.normalizeChannels(response);
          const channelMap = new Map(normalizedChannels.map((channel) => [channel.id, channel] as const));
          this.channels = normalizedChannels;
          this.sections = this.buildSections(normalizedChannels);
          this.nowPrograms = this.sortPrograms(this.normalizePrograms(response.nowItems || [], channelMap));
          this.nextPrograms = this.sortPrograms(this.normalizePrograms(response.nextItems || [], channelMap));
          this.tonightPrograms = this.sortPrograms(this.normalizePrograms(response.nightItems || [], channelMap));
          this.buildLdJson(normalizedChannels);
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

  private normalizeChannels(response: TvGuideSurfaceDTO): GuideChannel[] {
    const assetBaseUrl = this.apiConfig.getAssetBaseUrl();
    const orderedChannels = (response.channels || [])
      .map((entry) => entry.channel)
      .filter((channel): channel is ChannelMetaDTO => Boolean(channel?.id));

    return orderedChannels.map((channel, index) => {
      let icon = channel.icon || undefined;
      if (!icon) {
        icon = `/storage/channel_icons/${channel.id}.webp`;
      }
      if (icon && !icon.startsWith('http')) {
        const cleanPath = icon.startsWith('/') ? icon : `/${icon}`;
        icon = `${assetBaseUrl}${cleanPath}`;
      }

      const slug = slugify(channel.name || channel.id);
      const groupKey = this.resolveChannelGroup(channel);

      return {
        id: channel.id,
        name: channel.name,
        icon,
        type: String(channel.type || 'TDT').toUpperCase(),
        region: channel.country || channel.countryCode || undefined,
        isActive: true,
        sortIndex: typeof channel.sortOrder === 'number' ? channel.sortOrder : index,
        groupKey,
        channelLink: ['/canales', slug],
      };
    });
  }

  private normalizePrograms(
    items: TvReadItemDTO[],
    channelMap: Map<string, GuideChannel>
  ): GuideProgram[] {
    return (items
      .map((item) => {
        const channel = channelMap.get(item.channel.id);
        if (!channel) {
          return null;
        }

        const title = String(item.program.title || '').trim();
        if (!title.trim()) {
          return null;
        }

        const normalizedCategory = this.normalizeGuideCategory(
          item.program.editorialCategory || item.program.genre
        );
        const contentType: CatalogContentType =
          normalizedCategory === 'Cine' ? 'movie' :
          normalizedCategory === 'Series' ? 'series' :
          'program';
        const detailPath = buildDetailPath(contentType, title, slugify);
        const image =
          item.assets.poster?.url ||
          (item.assets.primary?.kind === 'poster' || item.assets.primary?.kind === 'backdrop'
            ? item.assets.primary?.url
            : undefined) ||
          undefined;

        return {
          id: String(item.id),
          catalogId: `program:${item.id}`,
          title,
          channelId: channel.id,
          channelName: channel.name,
          channelIcon: channel.icon,
          category: item.program.editorialCategory,
          normalizedCategory,
          image,
          tmdbId: item.program.tmdbId,
          primaryPlatforms: [],
          start: item.airing.start,
          end: item.airing.end,
          liveNow: item.airing.liveNow,
          groupKey: channel.groupKey,
          sortIndex: channel.sortIndex,
          detailLink: [detailPath],
          channelLink: channel.channelLink,
        } satisfies GuideProgram;
      })
      .filter(Boolean) as GuideProgram[]);
  }

  private sortPrograms(programs: GuideProgram[]): GuideProgram[] {
    return [...programs].sort((left, right) => {
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
        url: `${baseUrl}/canales/${slugify(channel.name)}`,
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
    channel: Pick<ChannelMetaDTO, 'type' | 'name' | 'group'>
  ): Exclude<ChannelGroupKey, 'all'> {
    const canonicalGroup = String(channel.group || '').trim().toLowerCase();
    if (canonicalGroup === 'tdt') return 'tdt';
    if (canonicalGroup === 'autonomico') return 'autonomico';
    if (canonicalGroup === 'movistar') return 'movistar';
    if (canonicalGroup === 'online') return 'online';
    if (canonicalGroup === 'deporte') return 'deporte';

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

  private normalizeGuideCategory(category?: string): string {
    return String(category || '').trim() || 'Otros';
  }

  private sectionIdForTab(tab: GuideTabKey): string {
    if (tab === 'next') return 'guide-next';
    if (tab === 'night') return 'guide-tonight';
    if (tab === 'channels') return 'guide-directory';
    return 'guide-now';
  }
}
