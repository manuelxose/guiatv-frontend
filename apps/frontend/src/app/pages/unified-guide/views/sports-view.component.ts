import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, combineLatest, startWith, switchMap, timer } from 'rxjs';
import { BottomSheetComponent } from '../../../components/bottom-sheet/bottom-sheet.component';
import { FilterChipItem } from '../../../components/filter-chip-bar/filter-chip-bar.component';
import { UnifiedFilterDockComponent, UnifiedFilterDockSection } from '../../../components/unified-filter-dock/unified-filter-dock.component';
import { UnifiedProgramCardComponent } from '../../../components/unified-program-card/unified-program-card.component';
import { TvReadItemDTO } from '../../../api/models';
import { UnifiedGuideStateService } from '../../../state/unified-guide.state';
import { UnifiedShellUiStateService } from '../../../state/unified-shell-ui.state';
import { TvDataFacade } from '../../../state/tv-data.facade';
import { normalizeToCard } from '../../../utils/tv-normalizers';
import { ViewportService } from '../../../services/viewport.service';

interface SportsDirectorySection {
  id: string;
  kind: 'sport' | 'competition';
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    label: string;
    meta: string;
    active: boolean;
  }>;
}

interface SportsModule {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: TvReadItemDTO[];
}

@Component({
  selector: 'app-sports-view',
  standalone: true,
  imports: [
    CommonModule,
    BottomSheetComponent,
    UnifiedFilterDockComponent,
    UnifiedProgramCardComponent,
  ],
  templateUrl: './sports-view.component.html',
  styleUrl: './sports-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportsViewComponent {
  private readonly isBrowser: boolean;
  readonly selectedItem = signal<TvReadItemDTO | null>(null);
  readonly dateChips = computed(() => buildDateChips());
  readonly timeRangeChips: FilterChipItem[] = [
    { id: 'all', label: 'Hoy', iconPath: 'M6.75 3.75v2.25M17.25 3.75v2.25M4.5 8.25h15', tone: 'sports' },
    { id: 'live', label: 'En directo', iconPath: 'M8.25 8.25h.008v.008H8.25V8.25Zm3.75 0h.008v.008H12V8.25Zm3.75 0h.008v.008H15.75V8.25ZM6.75 12h10.5M6.75 15.75h6', tone: 'sports' },
    { id: 'next', label: 'Próximos', iconPath: 'M12 6v6l4.5 2.25', tone: 'sports' },
    { id: 'tonight', label: 'Noche', iconPath: 'M18 15.75A6.75 6.75 0 1 1 8.25 6a6 6 0 1 0 9.75 9.75Z', tone: 'sports' },
    { id: 'week', label: 'Semana', iconPath: 'M6.75 3.75v2.25M17.25 3.75v2.25M4.5 8.25h15M6.75 12h3v3h-3z', tone: 'sports' },
  ];

  private readonly filters = computed(() => this.guideState.sportsFilters());
  private readonly filters$ = toObservable(this.filters).pipe(startWith(this.filters()));
  readonly liveSports = toSignal(
    this.buildPollingStream((filters) => this.facade.getLiveSports(filters)),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly nextSports = toSignal(
    this.buildPollingStream((filters) => this.facade.getUpcomingSports(filters)),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly tonightSports = toSignal(
    this.filters$.pipe(switchMap((filters) => this.facade.getTonightSports(filters))),
    { initialValue: [] as TvReadItemDTO[] }
  );
  readonly heroLead = computed(() => this.liveSports()[0] || this.nextSports()[0] || this.tonightSports()[0] || null);
  readonly heroStack = computed(() => {
    const live = this.liveSports().slice(1, 4);
    if (live.length) {
      return live;
    }
    return this.nextSports().slice(0, 3);
  });
  readonly availableChannels = computed(() => {
    const map = new Map<string, { id: string; name: string }>();
    [...this.liveSports(), ...this.nextSports(), ...this.tonightSports()].forEach((item) => {
      if (!map.has(item.channel.id)) {
        map.set(item.channel.id, { id: item.channel.id, name: item.channel.name });
      }
    });
    return Array.from(map.values()).slice(0, 10);
  });
  readonly availableSports = computed(() =>
    Array.from(
      new Set(
        [...this.liveSports(), ...this.nextSports(), ...this.tonightSports()]
          .map((item) => String(item.program.sportFacet || item.program.editorialCategory || '').trim())
          .filter(Boolean)
      )
    )
      .sort((left, right) => left.localeCompare(right, 'es'))
      .slice(0, 10)
  );
  readonly availableCompetitions = computed(() =>
    Array.from(
      new Set(
        [...this.liveSports(), ...this.nextSports(), ...this.tonightSports()]
          .map((item) => inferCompetition(item))
          .filter(Boolean)
      )
    )
      .sort((left, right) => left.localeCompare(right, 'es'))
      .slice(0, 12)
  );
  readonly agendaPulse = computed(() => [
    {
      label: 'Eventos live',
      value: String(this.liveSports().length || 0),
      detail: 'La prioridad es lo que está pasando ahora mismo.',
    },
    {
      label: 'Agenda visible',
      value: String(this.highlightedAgenda().length || 0),
      detail:
        this.guideState.sportsFilters().timeRange === 'week'
          ? 'Cobertura abierta a varios días.'
          : 'Selección inmediata para decidir rápido.',
    },
    {
      label: 'Competiciones',
      value: String(this.availableCompetitions().length || 0),
      detail: 'Agrupación contextual cuando la señal del título lo permite.',
    },
  ]);
  readonly footballHighlights = computed(() =>
    [...this.liveSports(), ...this.nextSports(), ...this.tonightSports()]
      .filter((item) => /f[úu]tbol|liga|champions|copa/i.test(buildSportsSearchText(item)))
      .slice(0, 6)
  );
  readonly highlightedAgenda = computed(() => {
    const range = this.guideState.sportsFilters().timeRange;
    if (range === 'live') {
      return this.liveSports();
    }
    if (range === 'tonight') {
      return this.tonightSports();
    }
    if (range === 'week') {
      return [...this.nextSports(), ...this.tonightSports()].slice(0, 12);
    }
    return this.nextSports();
  });
  readonly groupedBySport = computed(() => {
    const groups = new Map<string, TvReadItemDTO[]>();
    this.highlightedAgenda().forEach((item) => {
      const key = item.program.sportFacet || item.program.editorialCategory || 'Otros';
      const list = groups.get(key) || [];
      list.push(item);
      groups.set(key, list);
    });
    return Array.from(groups.entries()).map(([sport, items]) => ({ sport, items: items.slice(0, 4) }));
  });
  readonly groupedByCompetition = computed(() => {
    const groups = new Map<string, TvReadItemDTO[]>();
    [...this.liveSports(), ...this.highlightedAgenda()].forEach((item) => {
      const key = inferCompetition(item);
      const list = groups.get(key) || [];
      list.push(item);
      groups.set(key, list);
    });
    return Array.from(groups.entries())
      .filter(([competition]) =>
        this.guideState.sportsFilters().competition
          ? competition === this.guideState.sportsFilters().competition
          : true
      )
      .map(([competition, items]) => ({ competition, items: items.slice(0, 4) }))
      .slice(0, 6);
  });
  readonly quickDirectories = computed<SportsDirectorySection[]>(() => [
    {
      id: 'sport-directory',
      kind: 'sport',
      eyebrow: 'Disciplinas',
      title: 'Quick sports directories',
      description: 'Fútbol, baloncesto, motor y más visibles antes del grid principal.',
      items: [
        {
          id: 'all',
          label: 'Todos',
          meta: 'Cobertura deportiva completa',
          active: this.guideState.sportsFilters().sport === 'all',
        },
        ...this.availableSports().slice(0, 7).map((sport) => ({
          id: sport,
          label: sport,
          meta: sport === 'Fútbol' ? 'Prioridad editorial' : 'Abrir agenda filtrada',
          active: this.guideState.sportsFilters().sport === sport,
        })),
      ],
    },
    {
      id: 'competition-directory',
      kind: 'competition',
      eyebrow: 'Competiciones',
      title: 'Agenda por torneo',
      description: 'Una navegación terciaria útil para bajar fricción en la vertical.',
      items: [
        {
          id: '',
          label: 'Todas',
          meta: 'Sin restringir competición',
          active: !this.guideState.sportsFilters().competition,
        },
        ...this.availableCompetitions().slice(0, 7).map((competition) => ({
          id: competition,
          label: competition,
          meta: 'Abrir bloque filtrado',
          active: this.guideState.sportsFilters().competition === competition,
        })),
      ],
    },
  ]);
  readonly spotlightModules = computed<SportsModule[]>(() =>
    [
      {
        id: 'sports-live-module',
        eyebrow: 'Live now',
        title: 'Eventos en directo',
        description: 'La vista abre con lo que está ocurriendo y no con un listado frío.',
        items: this.liveSports().slice(0, 4),
      },
      {
        id: 'sports-next-module',
        eyebrow: 'Próximos',
        title: 'A continuación',
        description: 'Siguiente salto de agenda sin perder contexto de canal y deporte.',
        items: this.nextSports().slice(0, 4),
      },
      {
        id: 'sports-night-module',
        eyebrow: 'Esta noche',
        title: 'Prime time deportivo',
        description: 'El tramo fuerte de la noche aparece como superficie propia.',
        items: this.tonightSports().slice(0, 4),
      },
      {
        id: 'sports-week-module',
        eyebrow: 'Semana',
        title: 'Semana en foco',
        description: 'Selección extendida para preparar la agenda y no solo el directo.',
        items: [...this.nextSports(), ...this.tonightSports()].slice(0, 4),
      },
    ].filter((module) => module.items.length)
  );
  readonly activeFilterSummary = computed(() => {
    const filters = this.guideState.sportsFilters();
    const labels = [
      filters.sport !== 'all' ? filters.sport : '',
      filters.channel ? this.availableChannels().find((channel) => channel.id === filters.channel)?.name || filters.channel : '',
      filters.competition,
      filters.date !== 'today' ? this.dateChips().find((chip) => chip.id === filters.date)?.label || filters.date : '',
      filters.timeRange !== 'all' ? this.timeRangeChips.find((chip) => chip.id === filters.timeRange)?.label || filters.timeRange : '',
    ].filter(Boolean);
    if (this.guideState.searchQuery()) {
      labels.push(`"${this.guideState.searchQuery()}"`);
    }
    return labels;
  });
  readonly filterDockSections = computed<UnifiedFilterDockSection[]>(() => [
    {
      id: 'date',
      title: 'Agenda',
      options: this.dateChips().map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.sportsFilters().date === chip.id,
      })),
    },
    {
      id: 'timeRange',
      title: 'Franja',
      options: this.timeRangeChips.map((chip) => ({
        id: chip.id,
        label: chip.label,
        selected: this.guideState.sportsFilters().timeRange === chip.id,
      })),
    },
    {
      id: 'channel',
      title: 'Canal',
      options: [
        { id: '', label: 'Todos los canales', selected: !this.guideState.sportsFilters().channel },
        ...this.availableChannels().map((channel) => ({
          id: channel.id,
          label: channel.name,
          selected: this.guideState.sportsFilters().channel === channel.id,
        })),
      ],
    },
    {
      id: 'competition',
      title: 'Competición',
      description: 'Inferida desde el título cuando hay suficiente señal',
      options: [
        { id: '', label: 'Todas', selected: !this.guideState.sportsFilters().competition },
        ...this.availableCompetitions().map((competition) => ({
          id: competition,
          label: competition,
          selected: this.guideState.sportsFilters().competition === competition,
        })),
      ],
    },
  ]);

  constructor(
    readonly guideState: UnifiedGuideStateService,
    readonly shellUi: UnifiedShellUiStateService,
    private readonly facade: TvDataFacade,
    private readonly router: Router,
    private readonly viewport: ViewportService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  selectDate(date: string): void {
    this.guideState.updateSportsFilters({ date });
  }

  selectTimeRange(timeRange: string): void {
    if (
      timeRange === 'all' ||
      timeRange === 'live' ||
      timeRange === 'next' ||
      timeRange === 'tonight' ||
      timeRange === 'week'
    ) {
      this.guideState.updateSportsFilters({ timeRange });
    }
  }

  selectChannel(channel: string): void {
    this.guideState.updateSportsFilters({
      channel: this.guideState.sportsFilters().channel === channel ? '' : channel,
    });
  }

  selectSport(sport: string): void {
    this.guideState.updateSportsFilters({
      sport: this.guideState.sportsFilters().sport === sport ? 'all' : sport,
    });
  }

  selectCompetition(competition: string): void {
    this.guideState.updateSportsFilters({
      competition:
        this.guideState.sportsFilters().competition === competition ? '' : competition,
    });
  }

  applyQuickDirectory(kind: SportsDirectorySection['kind'], optionId: string): void {
    if (kind === 'sport') {
      this.selectSport(optionId);
      return;
    }
    this.selectCompetition(optionId);
  }

  clearFilters(): void {
    this.guideState.updateSportsFilters({
      sport: 'all',
      channel: '',
      competition: '',
      date: 'today',
      timeRange: 'all',
    });
  }

  closeDock(): void {
    this.shellUi.closeFilterDock();
  }

  handleDockSelect(event: { sectionId: string; optionId: string }): void {
    if (event.sectionId === 'date') {
      this.selectDate(event.optionId);
      return;
    }
    if (event.sectionId === 'timeRange') {
      this.selectTimeRange(event.optionId);
      return;
    }
    if (event.sectionId === 'channel') {
      this.guideState.updateSportsFilters({ channel: event.optionId || '' });
      return;
    }
    if (event.sectionId === 'competition') {
      this.selectCompetition(event.optionId);
    }
  }

  openItem(item: TvReadItemDTO): void {
    if (this.isBrowser && this.viewport.isMobile()) {
      this.selectedItem.set(item);
      return;
    }
    void this.router.navigateByUrl(normalizeToCard(item).detailPath);
  }

  closeSheet(): void {
    this.selectedItem.set(null);
  }

  trackByItem(_index: number, item: TvReadItemDTO): string {
    return item.id;
  }

  trackByChannel(_index: number, channel: { id: string; name: string }): string {
    return channel.id;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }

  trackByCompetition(_index: number, group: { competition: string }): string {
    return group.competition;
  }

  trackBySport(_index: number, group: { sport: string }): string {
    return group.sport;
  }

  private buildPollingStream(
    resolver: (filters: ReturnType<typeof this.filters>) => Observable<TvReadItemDTO[]>
  ): Observable<TvReadItemDTO[]> {
    if (!this.isBrowser) {
      return this.filters$.pipe(switchMap((filters) => resolver(filters)));
    }
    return combineLatest([this.filters$, timer(0, 30_000)]).pipe(
      switchMap(([filters]) => resolver(filters))
    );
  }
}

function buildDateChips(): FilterChipItem[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const id =
      index === 0
        ? 'today'
        : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
            date.getDate()
          ).padStart(2, '0')}`;
    return {
      id,
      label:
        index === 0
          ? 'Hoy'
          : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      iconPath: index === 0 ? 'M6.75 3.75v2.25M17.25 3.75v2.25M4.5 8.25h15M6.75 12h3v3h-3z' : undefined,
      tone: 'sports',
    };
  });
}

function inferCompetition(item: TvReadItemDTO): string {
  const title = String(item.program.title || '').trim();
  const titleLead = title.split(':')[0]?.trim();
  if (titleLead && titleLead.length >= 4) {
    return titleLead;
  }
  return String(item.program.sportFacet || item.program.editorialCategory || 'Otros').trim();
}

function buildSportsSearchText(item: TvReadItemDTO): string {
  return [
    item.program.title,
    item.program.sportFacet,
    item.program.editorialCategory,
    item.channel.name,
  ]
    .map((entry) => String(entry || '').trim())
    .join(' ')
    .toLowerCase();
}
