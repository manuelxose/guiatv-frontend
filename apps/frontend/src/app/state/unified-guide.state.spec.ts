import { TestBed } from '@angular/core/testing';
import { StorageService } from '../services/storage.service';
import { UnifiedGuideStateService } from './unified-guide.state';

describe('UnifiedGuideStateService', () => {
  let service: UnifiedGuideStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UnifiedGuideStateService,
        {
          provide: StorageService,
          useValue: {
            readJson: (_key: string, fallback: unknown) => fallback,
            writeJson: () => undefined,
          },
        },
      ],
    });

    service = TestBed.inject(UnifiedGuideStateService);
  });

  it('starts with the expected defaults', () => {
    expect(service.activeTab()).toBe('live');
    expect(service.searchQuery()).toBe('');
    expect(service.liveFilters()).toEqual({
      group: 'all',
      category: 'all',
      liveView: 'now',
      date: 'today',
      channel: '',
      channelType: 'all',
      region: 'all',
      flags: [],
    });
    expect(service.discoverFilters().types).toEqual(['program', 'movie', 'series']);
    expect(service.streamingFilters().sort).toBe('popular');
  });

  it('does not inherit stale filters when the URL has no parameters', () => {
    service.updateLiveFilters({
      group: 'autonomico',
      category: 'Series',
      channel: 'punt3_tv',
      region: 'Valencia',
      flags: ['streaming'],
    });

    service.syncFromQueryParams({}, 'live');

    expect(service.liveFilters()).toEqual({
      group: 'all',
      category: 'all',
      liveView: 'now',
      date: 'today',
      channel: '',
      channelType: 'all',
      region: 'all',
      flags: [],
    });
  });

  it('syncs discover filters from query params and serializes only the active slice', () => {
    service.syncFromQueryParams(
      {
        q: 'futbol',
        types: 'program,series',
        availability: 'live,streaming',
        platforms: 'Netflix,Prime Video',
        genres: 'Drama,Acción',
        sort: 'recent',
        date: '20260326',
        page: '3',
      },
      'discover'
    );

    expect(service.activeTab()).toBe('discover');
    expect(service.searchQuery()).toBe('futbol');
    expect(service.discoverFilters()).toEqual({
      types: ['program', 'series'],
      availability: ['live', 'streaming'],
      platforms: ['Netflix', 'Prime Video'],
      genres: ['Drama', 'Acción'],
      intent: '',
      sort: 'recent',
      date: '20260326',
      page: 3,
    });
    expect(service.toQueryParams('discover')).toEqual({
      q: 'futbol',
      types: 'program,series',
      availability: 'live,streaming',
      platforms: 'Netflix,Prime Video',
      genres: 'Drama,Acción',
      intent: null,
      sort: 'recent',
      date: '20260326',
      page: 3,
    });
    expect(service.toQueryParams('live')).toEqual({
      q: 'futbol',
      group: null,
      category: null,
      liveView: null,
      date: null,
      channel: null,
      channelType: null,
      region: null,
      flags: null,
    });
  });

  it('preserves tab-specific state when switching tabs', () => {
    service.updateLiveFilters({ group: 'online', liveView: 'night' });
    service.setSearch('tenis');
    service.selectTab('streaming');
    service.updateStreamingFilters({ platform: 'Netflix', type: 'series', sort: 'rating', page: 2 });
    service.selectTab('live');

    expect(service.liveFilters()).toEqual({
      group: 'online',
      category: 'all',
      liveView: 'night',
      date: 'today',
      channel: '',
      channelType: 'all',
      region: 'all',
      flags: [],
    });
    expect(service.streamingFilters()).toEqual({
      platform: 'Netflix',
      type: 'series',
      availability: [],
      genres: [],
      sort: 'rating',
      page: 2,
    });
    expect(service.searchQuery()).toBe('tenis');
  });
});
