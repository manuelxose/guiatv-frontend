import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, first, takeUntil } from 'rxjs';
import { ApiConfigService } from 'src/app/api/api-config.service';
import { TvChannelSurfaceDTO, TvReadItemDTO } from 'src/app/api/models';
import { InteractionButtonsComponent } from 'src/app/components/interaction-buttons/interaction-buttons.component';
import { MetaService } from 'src/app/services/meta.service';
import { TvDataService } from 'src/app/state/tv-data.service';
import { buildDetailPath, CatalogContentType, slugifyTitle } from 'src/app/utils/catalog';
import { normalizePublicImageUrl } from 'src/app/utils/media-url';
import { slugify } from 'src/app/utils/utils';

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
  private readonly tvDataService = inject(TvDataService);
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

    this.tvDataService
      .loadChannelSurface(this.normalizeChannelToken(this.query || this.canal), this.activeDayAlias)
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

  private managePrograms(surface: TvChannelSurfaceDTO): void {
    if (!surface.channel) {
      this.error = 'No hemos encontrado este canal en la guía actual.';
      this.isLoading = false;
      return;
    }

    const channelName = String(surface.channel?.name || this.canal || '').trim();
    this.canal = channelName || this.canal;
    this.channelDescription = surface.channel?.description || null;
    this.logo =
      this.resolveImageUrl(surface.channel?.icon) ||
      this.buildLocalChannelIcon(
        surface.channel?.id || surface.channel?.normalizedName || this.query
      );

    const normalizedPrograms = (surface.scheduleItems || [])
      .map((program: TvReadItemDTO) => this.normalizeProgram(program))
      .filter(Boolean) as ChannelProgram[];

    normalizedPrograms.sort(
      (left, right) =>
        new Date(left.start).getTime() - new Date(right.start).getTime()
    );

    this.programs = normalizedPrograms;
    this.currentProgram =
      this.normalizeProgram(surface.current) ||
      normalizedPrograms.find((program) => program.liveNow) ||
      normalizedPrograms[0] ||
      null;
    this.nextPrograms = (surface.next ? [surface.next] : [])
      .map((program) => this.normalizeProgram(program))
      .filter(Boolean) as ChannelProgram[];
    this.tonightPrograms = (surface.tonightItems || [])
      .map((program) => this.normalizeProgram(program))
      .filter(Boolean) as ChannelProgram[];
    this.featuredPrograms = this.buildFeaturedPrograms(normalizedPrograms);
    this.relatedChannels = this.buildRelatedChannels(surface);
    this.setupMetaTags();
    this.isLoading = false;
  }

  private normalizeProgram(program: TvReadItemDTO | undefined): ChannelProgram | null {
    const title = String(program?.program?.title || '').trim();
    const start = String(program?.airing?.start || '').trim();
    const end = String(program?.airing?.end || '').trim();

    if (!title || !start || !end) {
      return null;
    }

    const normalizedCategory = this.normalizeCategory(
      program?.program?.editorialCategory || program?.program?.genre
    );
    const contentType: CatalogContentType =
      normalizedCategory === 'Cine' ? 'movie' :
      normalizedCategory === 'Series' ? 'series' :
      'program';
    const imageUrl = this.resolveImageUrl(
      program?.assets?.poster?.url ||
      ((program?.assets?.primary?.kind === 'poster' || program?.assets?.primary?.kind === 'backdrop')
        ? program?.assets?.primary?.url
        : undefined)
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
      description: String(program?.program?.description || '').trim() || undefined,
      category: String(program?.program?.editorialCategory || '').trim() || undefined,
      normalizedCategory,
      contentType,
      image: imageUrl,
      start,
      end,
      liveNow: Boolean(program?.airing?.liveNow),
      detailPath: buildDetailPath(
        contentType,
        title,
        contentType === 'program' ? slugify : slugifyTitle
      ),
      durationMinutes: program?.airing?.durationMinutes || durationMinutes,
    };
  }

  private buildNextPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    const now = Date.now();
    return programs
      .filter((program) => new Date(program.start).getTime() > now)
      .slice(0, 6);
  }

  private buildFeaturedPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    const now = Date.now();
    const upcoming = programs.filter((program) => new Date(program.end).getTime() >= now);
    return (upcoming.length ? upcoming : programs).slice(0, 8);
  }

  private buildRelatedChannels(surface: TvChannelSurfaceDTO): RelatedChannel[] {
    return (surface.relatedChannels || [])
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

  private normalizeCategory(input: unknown): string {
    return String((input as any)?.value || input || '').trim() || 'Otros';
  }

  private filterPrograms(programs: ChannelProgram[]): ChannelProgram[] {
    if (this.selectedCategory === 'all') {
      return programs;
    }

    return programs.filter(
      (program) => program.normalizedCategory === this.selectedCategory
    );
  }
}
