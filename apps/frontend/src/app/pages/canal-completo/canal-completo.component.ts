import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, first, takeUntil } from 'rxjs';
import { ApiConfigService } from 'src/app/api/api-config.service';
import { InteractionButtonsComponent } from 'src/app/components/interaction-buttons/interaction-buttons.component';
import { MetaService } from 'src/app/services/meta.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';
import { buildDetailPath, CatalogContentType } from 'src/app/utils/catalog';
import { normalizePublicImageUrl } from 'src/app/utils/media-url';
import { isLive, slugify } from 'src/app/utils/utils';

type GuideQuickCategory = 'all' | 'Cine' | 'Series' | 'Deportes';
type DayAlias = 'today' | 'tomorrow' | 'after_tomorrow';

interface DayOption {
  label: string;
  value: DayAlias;
}

interface ChannelProgram {
  id: string;
  title: string;
  description?: string;
  category?: string;
  normalizedCategory: string;
  contentType: CatalogContentType;
  image?: string;
  start: string;
  end: string;
  liveNow: boolean;
  detailPath: string;
  durationMinutes?: number;
}

interface RelatedChannel {
  id: string;
  name: string;
  description?: string;
  logo: string;
  link: any[];
}

const PRIMARY_GUIDE_CATEGORIES: Array<{ key: GuideQuickCategory; label: string }> = [
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
  selector: 'app-canal-completo',
  standalone: true,
  templateUrl: './canal-completo.component.html',
  styleUrls: ['./canal-completo.component.scss'],
  imports: [CommonModule, RouterModule, InteractionButtonsComponent],
})
export class CanalCompletoComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tvGuideService = inject(TvGuideService);
  private readonly metaService = inject(MetaService);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly destroy$ = new Subject<void>();

  public readonly days: DayOption[] = [
    { label: 'Hoy', value: 'today' },
    { label: 'Mañana', value: 'tomorrow' },
    { label: 'Pasado', value: 'after_tomorrow' },
  ];
  public readonly quickCategoryTabs = PRIMARY_GUIDE_CATEGORIES;

  public query = '';
  public canal = '';
  public logo = '';
  public channelDescription: string | null = null;
  public isLoading = true;
  public error: string | null = null;
  public diaSeleccionado = 'Hoy';
  public activeDayAlias: DayAlias = 'today';
  public selectedCategory: string = 'all';
  public isMoreCategoriesOpen = false;
  public readonly posterFallback = '/assets/images/default-movie-poster.svg';
  public readonly channelFallback = '/assets/images/channels/antena3.svg';

  public programs: ChannelProgram[] = [];
  public currentProgram: ChannelProgram | null = null;
  public nextPrograms: ChannelProgram[] = [];
  public tonightPrograms: ChannelProgram[] = [];
  public featuredPrograms: ChannelProgram[] = [];
  public relatedChannels: RelatedChannel[] = [];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.query = String(params.get('id') || '').trim();
        this.canal = this.formatChannelName(this.query);
        this.setupMetaTags();
        this.loadProgramData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public async cambiarDia(value: string): Promise<void> {
    const nextDay = (this.days.find((day) => day.value === value)?.value || 'today') as DayAlias;
    this.activeDayAlias = nextDay;
    this.diaSeleccionado =
      this.days.find((day) => day.value === nextDay)?.label || 'Hoy';
    this.setupMetaTags();
    this.loadProgramData();
  }

  public selectCategory(category: string): void {
    this.selectedCategory = category;
    this.isMoreCategoriesOpen = false;
  }

  public toggleMoreCategories(): void {
    this.isMoreCategoriesOpen = !this.isMoreCategoriesOpen;
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

  public formatTimeRange(program: ChannelProgram): string {
    return `${this.formatTime(program.start)} - ${this.formatTime(program.end)}`;
  }

  public trackProgram(index: number, program: ChannelProgram): string {
    return program.id || `${program.title}-${index}`;
  }

  public trackChannel(index: number, channel: RelatedChannel): string {
    return channel.id || `${channel.name}-${index}`;
  }

  public onPosterError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = this.posterFallback;
    }
  }

  public onChannelLogoError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = this.channelFallback;
    }
  }

  public get extraCategories(): string[] {
    const primary = new Set<string>(PRIMARY_GUIDE_CATEGORIES.map((category) => category.key));
    const categories = new Set<string>();
    this.programs.forEach((program) => {
      if (program.normalizedCategory !== 'Otros' && !primary.has(program.normalizedCategory)) {
        categories.add(program.normalizedCategory);
      }
    });
    return Array.from(categories).sort((left, right) => left.localeCompare(right, 'es'));
  }

  public get filteredSchedule(): ChannelProgram[] {
    if (this.selectedCategory === 'all') {
      return this.programs;
    }

    return this.programs.filter(
      (program) => program.normalizedCategory === this.selectedCategory
    );
  }

  public get filteredCurrentProgram(): ChannelProgram | null {
    if (!this.currentProgram) {
      return null;
    }

    return this.selectedCategory === 'all' ||
      this.currentProgram.normalizedCategory === this.selectedCategory
      ? this.currentProgram
      : null;
  }

  public get filteredNextPrograms(): ChannelProgram[] {
    return this.filterPrograms(this.nextPrograms).slice(0, 6);
  }

  public get filteredTonightPrograms(): ChannelProgram[] {
    return this.filterPrograms(this.tonightPrograms).slice(0, 6);
  }

  public get filteredFeaturedPrograms(): ChannelProgram[] {
    return this.filterPrograms(this.featuredPrograms).slice(0, 8);
  }

  private loadProgramData(): void {
    this.isLoading = true;
    this.error = null;

    this.tvGuideService
      .getFromApi(this.activeDayAlias)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.managePrograms(data),
        error: () => {
          this.error =
            'No se pudo cargar la programación del canal ahora mismo. Inténtalo de nuevo en unos minutos.';
          this.isLoading = false;
        },
      });
  }

  private managePrograms(layouts: any[]): void {
    const channelGroup = this.findChannelGroup(layouts);
    if (!channelGroup) {
      this.error = 'No hemos encontrado este canal en la guía actual.';
      this.isLoading = false;
      return;
    }

    const channelName = String(channelGroup.channel?.name || this.canal || '').trim();
    this.canal = channelName || this.canal;
    this.channelDescription = channelGroup.channel?.description || null;
    this.logo = this.buildLocalChannelIcon(
      channelGroup.channel?.id || channelGroup.channel?.normalizedName || this.query
    );

    const normalizedPrograms = (channelGroup.programs || [])
      .map((program: any) => this.normalizeProgram(program))
      .filter(Boolean) as ChannelProgram[];

    normalizedPrograms.sort(
      (left, right) =>
        new Date(left.start).getTime() - new Date(right.start).getTime()
    );

    this.programs = normalizedPrograms;
    this.currentProgram =
      normalizedPrograms.find((program) => program.liveNow) || normalizedPrograms[0] || null;
    this.nextPrograms = this.buildNextPrograms(normalizedPrograms);
    this.tonightPrograms = this.buildTonightPrograms(normalizedPrograms);
    this.featuredPrograms = this.buildFeaturedPrograms(normalizedPrograms);
    this.relatedChannels = this.buildRelatedChannels(layouts, channelGroup);
    this.setupMetaTags();
    this.isLoading = false;
  }

  private normalizeProgram(program: any): ChannelProgram | null {
    const title = String(program?.title?.value || program?.title || '').trim();
    const start = String(program?.start || '').trim();
    const end = String(program?.end || program?.stop || '').trim();

    if (!title || !start || !end) {
      return null;
    }

    const normalizedCategory = this.normalizeCategory(program?.category, title);
    const contentType: CatalogContentType =
      normalizedCategory === 'Cine' ? 'movie' :
      normalizedCategory === 'Series' ? 'series' :
      'program';
    const imageUrl = this.resolveImageUrl(
      program?.poster || program?.icon || program?.image
    );
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMinutes =
      !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
        ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
        : undefined;

    return {
      id: String(program?.id || `${slugify(title)}-${start}`),
      title,
      description: String(program?.desc?.details || program?.desc || '').trim() || undefined,
      category: String(program?.category?.value || program?.category || '').trim() || undefined,
      normalizedCategory,
      contentType,
      image: imageUrl,
      start,
      end,
      liveNow: isLive(start, end),
      detailPath: buildDetailPath(contentType, title, slugify),
      durationMinutes,
    };
  }

  private buildNextPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    const now = Date.now();
    return programs
      .filter((program) => new Date(program.start).getTime() > now)
      .slice(0, 6);
  }

  private buildTonightPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    return this.sortEditorial(
      programs.filter((program) => {
        const hour = new Date(program.start).getHours();
        return hour >= 20 && hour <= 23;
      })
    ).slice(0, 8);
  }

  private buildFeaturedPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    return this.sortEditorial(programs).slice(0, 8);
  }

  private sortEditorial(programs: ChannelProgram[]): ChannelProgram[] {
    return [...programs].sort((left, right) => {
      const categoryDiff =
        this.categoryPriority(left.normalizedCategory) -
        this.categoryPriority(right.normalizedCategory);
      if (categoryDiff !== 0) {
        return categoryDiff;
      }

      return new Date(left.start).getTime() - new Date(right.start).getTime();
    });
  }

  private buildRelatedChannels(layouts: any[], currentGroup: any): RelatedChannel[] {
    const currentType = String(currentGroup?.channel?.type || '').toUpperCase();

    return (layouts || [])
      .filter((entry) => entry?.channel?.id !== currentGroup?.channel?.id)
      .sort((left, right) => {
        const leftType = String(left?.channel?.type || '').toUpperCase();
        const rightType = String(right?.channel?.type || '').toUpperCase();
        const leftScore = leftType === currentType ? 0 : 1;
        const rightScore = rightType === currentType ? 0 : 1;
        if (leftScore !== rightScore) {
          return leftScore - rightScore;
        }
        return 0;
      })
      .slice(0, 8)
      .map((entry) => {
        const slug = slugify(entry?.channel?.normalizedName || entry?.channel?.name || entry?.channel?.id || '');
        return {
          id: String(entry?.channel?.id || slug),
          name: String(entry?.channel?.name || slug),
          description: String(entry?.channel?.description || '').trim() || undefined,
          logo: this.buildLocalChannelIcon(
            entry?.channel?.id || entry?.channel?.normalizedName || entry?.channel?.name || slug
          ),
          link: ['/canales', slug],
        };
      });
  }

  private findChannelGroup(layouts: any[]): any | undefined {
    const target = this.normalizeChannelToken(this.query || this.canal);
    return (layouts || []).find((entry) => {
      const nameToken = this.normalizeChannelToken(entry?.channel?.name || '');
      const idToken = this.normalizeChannelToken(entry?.channel?.id || '');
      const slugToken = this.normalizeChannelToken(entry?.channel?.normalizedName || '');
      return nameToken === target || idToken === target || slugToken === target;
    });
  }

  private setupMetaTags(): void {
    const channelName = this.canal || this.formatChannelName(this.query);
    const currentText = this.diaSeleccionado.toLowerCase();
    this.metaService.setMetaTags({
      title: `Programación de ${channelName} ${currentText} — Guía TV`,
      description:
        this.channelDescription ||
        `Consulta qué están emitiendo ahora, qué viene después y la parrilla completa de ${channelName} ${currentText}.`,
      canonicalUrl: this.router.url,
      ogTitle: `${channelName} en directo y programación ${currentText}`,
      ogDescription:
        this.channelDescription ||
        `Parrilla completa de ${channelName} con horarios, programas destacados y acceso directo a cada contenido.`,
      ogType: 'website',
      ogImage: `https://guiaprogramaciontv.com${this.buildLocalChannelIcon(this.query || channelName)}`,
    });
  }

  private formatChannelName(value: string): string {
    return String(value || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private normalizeChannelToken(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private buildLocalChannelIcon(channelRef?: string): string {
    const token = this.normalizeChannelToken(channelRef || this.query || this.canal);
    return `/storage/channel_icons/${encodeURIComponent(token)}.webp`;
  }

  private resolveImageUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    return normalizePublicImageUrl(url, this.apiConfig.getAssetBaseUrl());
  }

  private normalizeCategory(input: unknown, title: string): string {
    const category = String((input as any)?.value || input || '').trim().toLowerCase();
    const normalizedTitle = String(title || '').toLowerCase();

    if (category.includes('cine') || category.includes('pelicul') || normalizedTitle.includes('cine')) {
      return 'Cine';
    }
    if (category.includes('serie') || category.includes('telenovela')) {
      return 'Series';
    }
    if (category.includes('deporte') || category.includes('futbol') || category.includes('baloncesto')) {
      return 'Deportes';
    }
    if (category.includes('noticia') || category.includes('informativ')) {
      return 'Noticias';
    }
    if (category.includes('infantil') || category.includes('kids') || category.includes('dibujos')) {
      return 'Infantil';
    }
    if (category.includes('documental')) {
      return 'Documental';
    }
    if (category.includes('entreten')) {
      return 'Entretenimiento';
    }

    return 'Otros';
  }

  private filterPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    if (this.selectedCategory === 'all') {
      return programs;
    }

    return programs.filter(
      (program) => program.normalizedCategory === this.selectedCategory
    );
  }

  private categoryPriority(category: string): number {
    return EDITORIAL_CATEGORY_PRIORITY[category] ?? EDITORIAL_CATEGORY_PRIORITY['Otros'];
  }
}
