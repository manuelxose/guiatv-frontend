import { Injectable, computed, inject, signal } from '@angular/core';
import { Params } from '@angular/router';
import { StorageService } from '../services/storage.service';

export type UnifiedGuideTab = 'live' | 'discover' | 'streaming' | 'sports';
export type UnifiedLiveView = 'now' | 'next' | 'night' | 'day';
export type UnifiedContentType = 'program' | 'movie' | 'series';
export type UnifiedAvailability =
  | 'live'
  | 'streaming'
  | 'free'
  | 'flatrate'
  | 'rent'
  | 'buy';
export type UnifiedSort = 'personalized' | 'popular' | 'rating' | 'airtime' | 'recent';
export type UnifiedLiveFlag = 'live' | 'catchup' | 'streaming';
export type UnifiedDiscoverIntent = '' | 'featured' | 'popular' | 'rating' | 'recent';
export type UnifiedSportsTimeRange = 'all' | 'live' | 'next' | 'tonight' | 'week';

export interface UnifiedGuideState {
  activeTab: UnifiedGuideTab;
  searchQuery: string;
  shellPrefs: {
    lastSubmodeByTab: Partial<Record<UnifiedGuideTab, string>>;
    lastSearchByTab: Partial<Record<UnifiedGuideTab, string>>;
  };
  liveFilters: {
    group: string;
    category: string;
    liveView: UnifiedLiveView;
    date: string;
    channel: string;
    channelType: string;
    region: string;
    flags: UnifiedLiveFlag[];
  };
  discoverFilters: {
    types: UnifiedContentType[];
    availability: UnifiedAvailability[];
    platforms: string[];
    genres: string[];
    intent: UnifiedDiscoverIntent;
    sort: UnifiedSort;
    date: string;
    page: number;
  };
  streamingFilters: {
    platform: string;
    type: '' | 'movie' | 'series';
    availability: UnifiedAvailability[];
    genres: string[];
    sort: Exclude<UnifiedSort, 'personalized' | 'airtime'> | 'popular';
    page: number;
  };
  sportsFilters: {
    sport: string;
    channel: string;
    competition: string;
    date: string;
    timeRange: UnifiedSportsTimeRange;
  };
}

const UNIFIED_GUIDE_STATE_KEY = 'gtv.unified-guide.state';

const DEFAULT_STATE: UnifiedGuideState = {
  activeTab: 'live',
  searchQuery: '',
  shellPrefs: {
    lastSubmodeByTab: {
      live: 'now',
      discover: 'featured',
      streaming: 'popular',
      sports: 'live',
    },
    lastSearchByTab: {},
  },
  liveFilters: {
    group: 'tdt',
    category: 'all',
    liveView: 'now',
    date: 'today',
    channel: '',
    channelType: 'all',
    region: 'all',
    flags: [],
  },
  discoverFilters: {
    types: ['program', 'movie', 'series'],
    availability: [],
    platforms: [],
    genres: [],
    intent: '',
    sort: 'popular',
    date: 'today',
    page: 1,
  },
  streamingFilters: {
    platform: '',
    type: '',
    availability: [],
    genres: [],
    sort: 'popular',
    page: 1,
  },
  sportsFilters: {
    sport: 'all',
    channel: '',
    competition: '',
    date: 'today',
    timeRange: 'all',
  },
};

@Injectable({ providedIn: 'root' })
export class UnifiedGuideStateService {
  private readonly storage = inject(StorageService);
  private readonly stateSignal = signal<UnifiedGuideState>(DEFAULT_STATE);

  readonly state = computed(() => this.stateSignal());
  readonly activeTab = computed(() => this.stateSignal().activeTab);
  readonly searchQuery = computed(() => this.stateSignal().searchQuery);
  readonly liveFilters = computed(() => this.stateSignal().liveFilters);
  readonly discoverFilters = computed(() => this.stateSignal().discoverFilters);
  readonly streamingFilters = computed(() => this.stateSignal().streamingFilters);
  readonly sportsFilters = computed(() => this.stateSignal().sportsFilters);
  readonly shellPrefs = computed(() => this.stateSignal().shellPrefs);

  constructor() {
    this.stateSignal.set(this.readState());
  }

  selectTab(tab: UnifiedGuideTab): void {
    this.patchState({ activeTab: tab });
  }

  setSearch(q: string): void {
    const value = String(q || '').trim();
    const current = this.stateSignal();
    this.patchState({
      searchQuery: value,
      shellPrefs: {
        ...current.shellPrefs,
        lastSearchByTab: {
          ...current.shellPrefs.lastSearchByTab,
          [current.activeTab]: value,
        },
      },
    });
  }

  updateLiveFilters(partial: Partial<UnifiedGuideState['liveFilters']>): void {
    const next = {
      ...this.stateSignal().liveFilters,
      ...partial,
    };
    this.patchState({
      liveFilters: next,
      shellPrefs: {
        ...this.stateSignal().shellPrefs,
        lastSubmodeByTab: {
          ...this.stateSignal().shellPrefs.lastSubmodeByTab,
          live: deriveLiveSubmode(next),
        },
      },
    });
  }

  updateDiscoverFilters(partial: Partial<UnifiedGuideState['discoverFilters']>): void {
    const next = {
      ...this.stateSignal().discoverFilters,
      ...partial,
    };
    next.page = Math.max(1, Number(next.page || 1));
    this.patchState({
      discoverFilters: next,
      shellPrefs: {
        ...this.stateSignal().shellPrefs,
        lastSubmodeByTab: {
          ...this.stateSignal().shellPrefs.lastSubmodeByTab,
          discover: deriveDiscoverSubmode(next),
        },
      },
    });
  }

  updateStreamingFilters(partial: Partial<UnifiedGuideState['streamingFilters']>): void {
    const next = {
      ...this.stateSignal().streamingFilters,
      ...partial,
    };
    next.page = Math.max(1, Number(next.page || 1));
    this.patchState({
      streamingFilters: next,
      shellPrefs: {
        ...this.stateSignal().shellPrefs,
        lastSubmodeByTab: {
          ...this.stateSignal().shellPrefs.lastSubmodeByTab,
          streaming: deriveStreamingSubmode(next),
        },
      },
    });
  }

  updateSportsFilters(partial: Partial<UnifiedGuideState['sportsFilters']>): void {
    const next = {
      ...this.stateSignal().sportsFilters,
      ...partial,
    };
    this.patchState({
      sportsFilters: next,
      shellPrefs: {
        ...this.stateSignal().shellPrefs,
        lastSubmodeByTab: {
          ...this.stateSignal().shellPrefs.lastSubmodeByTab,
          sports: deriveSportsSubmode(next),
        },
      },
    });
  }

  syncFromQueryParams(params: Params | null | undefined, tab = this.activeTab()): void {
    const current = this.stateSignal();
    const safeParams = params || {};
    const searchQuery = readString(safeParams['q']) || current.searchQuery;

    const nextState: UnifiedGuideState = {
      ...current,
      activeTab: tab,
      searchQuery,
    };

    if (tab === 'live') {
      nextState.liveFilters = {
        group: readString(safeParams['group']) || current.liveFilters.group,
        category: readString(safeParams['category']) || current.liveFilters.category,
        liveView: readLiveView(safeParams['liveView']) || current.liveFilters.liveView,
        date: readString(safeParams['date']) || current.liveFilters.date,
        channel: readString(safeParams['channel']) || current.liveFilters.channel,
        channelType: readString(safeParams['channelType']) || current.liveFilters.channelType,
        region: readString(safeParams['region']) || current.liveFilters.region,
        flags: (readCsvOrDefault(safeParams['flags'], current.liveFilters.flags) as UnifiedLiveFlag[]),
      };
    }

    if (tab === 'discover') {
      nextState.discoverFilters = {
        types:
          (readCsvOrDefault(safeParams['types'], current.discoverFilters.types) as UnifiedContentType[]),
        availability:
          (readCsvOrDefault(
            safeParams['availability'],
            current.discoverFilters.availability
          ) as UnifiedAvailability[]),
        platforms: readCsvOrDefault(
          safeParams['platforms'],
          current.discoverFilters.platforms
        ),
        genres: readCsvOrDefault(safeParams['genres'], current.discoverFilters.genres),
        intent: readIntent(safeParams['intent']) || current.discoverFilters.intent,
        sort: readSort(safeParams['sort']) || current.discoverFilters.sort,
        date: readString(safeParams['date']) || current.discoverFilters.date,
        page: readPositiveNumber(safeParams['page']) || current.discoverFilters.page,
      };
    }

    if (tab === 'streaming') {
      const nextType = readString(safeParams['type']);
      nextState.streamingFilters = {
        platform: readString(safeParams['platform']) || current.streamingFilters.platform,
        type: nextType === 'movie' || nextType === 'series' ? nextType : current.streamingFilters.type,
        availability:
          (readCsvOrDefault(
            safeParams['availability'],
            current.streamingFilters.availability
          ) as UnifiedAvailability[]),
        genres: readCsvOrDefault(safeParams['genres'], current.streamingFilters.genres),
        sort: (readString(safeParams['sort']) as UnifiedGuideState['streamingFilters']['sort']) || current.streamingFilters.sort,
        page: readPositiveNumber(safeParams['page']) || current.streamingFilters.page,
      };
    }

    if (tab === 'sports') {
      nextState.sportsFilters = {
        sport: readString(safeParams['sport']) || current.sportsFilters.sport,
        channel: readString(safeParams['channel']) || current.sportsFilters.channel,
        competition: readString(safeParams['competition']) || current.sportsFilters.competition,
        date: readString(safeParams['date']) || current.sportsFilters.date,
        timeRange: readTimeRange(safeParams['timeRange']) || current.sportsFilters.timeRange,
      };
    }

    nextState.shellPrefs = {
      ...current.shellPrefs,
      lastSearchByTab: {
        ...current.shellPrefs.lastSearchByTab,
        [tab]: searchQuery,
      },
      lastSubmodeByTab: {
        ...current.shellPrefs.lastSubmodeByTab,
        live: deriveLiveSubmode(nextState.liveFilters),
        discover: deriveDiscoverSubmode(nextState.discoverFilters),
        streaming: deriveStreamingSubmode(nextState.streamingFilters),
        sports: deriveSportsSubmode(nextState.sportsFilters),
      },
    };
    this.stateSignal.set(nextState);
    this.persist(nextState);
  }

  toQueryParams(tab = this.activeTab()): Params {
    const state = this.stateSignal();
    const base: Params = {
      q: state.searchQuery || null,
    };

    if (tab === 'live') {
      return {
        ...base,
        group: nullable(state.liveFilters.group, 'tdt'),
        category: nullable(state.liveFilters.category, 'all'),
        liveView: nullable(state.liveFilters.liveView, 'now'),
        date: nullable(state.liveFilters.date, 'today'),
        channel: nullable(state.liveFilters.channel),
        channelType: nullable(state.liveFilters.channelType, 'all'),
        region: nullable(state.liveFilters.region, 'all'),
        flags: state.liveFilters.flags.length ? state.liveFilters.flags.join(',') : null,
      };
    }

    if (tab === 'discover') {
      return {
        ...base,
        types: state.discoverFilters.types.length
          ? state.discoverFilters.types.join(',')
          : null,
        availability: state.discoverFilters.availability.length
          ? state.discoverFilters.availability.join(',')
          : null,
        platforms: state.discoverFilters.platforms.length
          ? state.discoverFilters.platforms.join(',')
          : null,
        genres: state.discoverFilters.genres.length
          ? state.discoverFilters.genres.join(',')
          : null,
        intent: nullable(state.discoverFilters.intent),
        sort: nullable(state.discoverFilters.sort, 'popular'),
        date: nullable(state.discoverFilters.date, 'today'),
        page: state.discoverFilters.page > 1 ? state.discoverFilters.page : null,
      };
    }

    if (tab === 'streaming') {
      return {
        ...base,
        platform: nullable(state.streamingFilters.platform),
        type: nullable(state.streamingFilters.type),
        availability: state.streamingFilters.availability.length
          ? state.streamingFilters.availability.join(',')
          : null,
        genres: state.streamingFilters.genres.length
          ? state.streamingFilters.genres.join(',')
          : null,
        sort: nullable(state.streamingFilters.sort, 'popular'),
        page: state.streamingFilters.page > 1 ? state.streamingFilters.page : null,
      };
    }

    return {
      ...base,
      sport: nullable(state.sportsFilters.sport, 'all'),
      channel: nullable(state.sportsFilters.channel),
      competition: nullable(state.sportsFilters.competition),
      date: nullable(state.sportsFilters.date, 'today'),
      timeRange: nullable(state.sportsFilters.timeRange, 'all'),
    };
  }

  reset(): void {
    this.stateSignal.set(DEFAULT_STATE);
    this.persist(DEFAULT_STATE);
  }

  private patchState(partial: Partial<UnifiedGuideState>): void {
    this.stateSignal.update((current) => {
      const next = {
        ...current,
        ...partial,
      };
      this.persist(next);
      return next;
    });
  }

  private readState(): UnifiedGuideState {
    const parsed = this.storage.readJson<Partial<UnifiedGuideState> | null>(
      UNIFIED_GUIDE_STATE_KEY,
      null
    );
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_STATE;
    }
    return {
      ...DEFAULT_STATE,
      ...parsed,
      shellPrefs: {
        ...DEFAULT_STATE.shellPrefs,
        ...(parsed.shellPrefs || {}),
        lastSubmodeByTab: {
          ...DEFAULT_STATE.shellPrefs.lastSubmodeByTab,
          ...(parsed.shellPrefs?.lastSubmodeByTab || {}),
        },
        lastSearchByTab: {
          ...DEFAULT_STATE.shellPrefs.lastSearchByTab,
          ...(parsed.shellPrefs?.lastSearchByTab || {}),
        },
      },
    };
  }

  private persist(state: UnifiedGuideState): void {
    this.storage.writeJson(UNIFIED_GUIDE_STATE_KEY, state);
  }
}

function readString(value: unknown): string {
  return String(value || '').trim();
}

function readCsv(value: unknown): string[] {
  const raw = readString(value);
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readCsvOrDefault(value: unknown, fallback: string[]): string[] {
  const entries = readCsv(value);
  return entries.length ? entries : [...fallback];
}

function readPositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return Math.floor(parsed);
}

function readLiveView(value: unknown): UnifiedLiveView | null {
  const raw = readString(value);
  if (raw === 'now' || raw === 'next' || raw === 'night' || raw === 'day') {
    return raw;
  }
  return null;
}

function readSort(value: unknown): UnifiedSort | null {
  const raw = readString(value);
  if (
    raw === 'personalized' ||
    raw === 'popular' ||
    raw === 'rating' ||
    raw === 'airtime' ||
    raw === 'recent'
  ) {
    return raw;
  }
  return null;
}

function readIntent(value: unknown): UnifiedDiscoverIntent | null {
  const raw = readString(value);
  if (raw === '' || raw === 'featured' || raw === 'popular' || raw === 'rating' || raw === 'recent') {
    return raw;
  }
  return null;
}

function readTimeRange(value: unknown): UnifiedSportsTimeRange | null {
  const raw = readString(value);
  if (raw === 'all' || raw === 'live' || raw === 'next' || raw === 'tonight' || raw === 'week') {
    return raw;
  }
  return null;
}

function nullable(value: string | number | null | undefined, fallback?: string): string | number | null {
  if (value == null || value === '' || value === fallback) {
    return null;
  }
  return value;
}

function deriveLiveSubmode(filters: UnifiedGuideState['liveFilters']): string {
  return filters.liveView || 'now';
}

function deriveDiscoverSubmode(filters: UnifiedGuideState['discoverFilters']): string {
  return (
    filters.intent ||
    filters.availability[0] ||
    filters.platforms[0] ||
    filters.genres[0] ||
    filters.types[0] ||
    'featured'
  );
}

function deriveStreamingSubmode(filters: UnifiedGuideState['streamingFilters']): string {
  return filters.type || filters.platform || filters.sort || 'popular';
}

function deriveSportsSubmode(filters: UnifiedGuideState['sportsFilters']): string {
  return filters.timeRange !== 'all' ? filters.timeRange : filters.sport || 'live';
}
