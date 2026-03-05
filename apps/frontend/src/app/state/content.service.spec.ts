import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiConfigService } from '../api/api-config.service';
import { TvDataService } from './tv-data.service';
import { ContentService } from './content.service';

describe('ContentService featured selection', () => {
  let service: ContentService;
  let tvDataSpy: jasmine.SpyObj<TvDataService>;

  beforeEach(() => {
    tvDataSpy = jasmine.createSpyObj<TvDataService>('TvDataService', [
      'loadLayouts',
      'getCachedChannelMeta',
    ]);
    tvDataSpy.getCachedChannelMeta.and.returnValue(undefined as any);

    TestBed.configureTestingModule({
      providers: [
        ContentService,
        { provide: TvDataService, useValue: tvDataSpy },
        {
          provide: ApiConfigService,
          useValue: {
            getAssetBaseUrl: () => '',
          },
        },
      ],
    });

    service = TestBed.inject(ContentService);
  });

  it('selects featured only from main channels with valid image', (done) => {
    tvDataSpy.loadLayouts.and.returnValue(
      of({
        date: '20260305',
        timeSlots: [],
        channels: [
          {
            channel: { id: 'ptv_malaga', name: 'PTV Málaga', type: 'TDT' },
            programs: [
              makeProgram('p1', 'Málaga TeVé', '2026-03-05T08:00:00.000Z', {
                category: 'Entertainment, Movies',
                image: 'https://example.com/ptv.jpg',
              }),
            ],
          },
          {
            channel: { id: 'la_1', name: 'La 1', type: 'TDT' },
            programs: [
              makeProgram('p2', 'Película principal', '2026-03-05T09:00:00.000Z', {
                category: 'Cine, Drama',
                image: 'https://image.tmdb.org/t/p/w500/movie.jpg',
              }),
            ],
          },
        ],
      } as any)
    );

    service.loadContent('movies', 'today').subscribe((snapshot) => {
      expect(snapshot.featured).toBeTruthy();
      expect(snapshot.featured?.id).toBe('p2');
      expect(snapshot.featured?.channel.id).toBe('la_1');
      done();
    });
  });

  it('returns null when no main-channel movie has valid image', (done) => {
    tvDataSpy.loadLayouts.and.returnValue(
      of({
        date: '20260305',
        timeSlots: [],
        channels: [
          {
            channel: { id: 'la_1', name: 'La 1', type: 'TDT' },
            programs: [
              makeProgram('p1', 'Sin imagen en principal', '2026-03-05T08:00:00.000Z', {
                category: 'Cine, Drama',
              }),
            ],
          },
          {
            channel: { id: 'ptv_malaga', name: 'PTV Málaga', type: 'TDT' },
            programs: [
              makeProgram('p2', 'Con imagen pero no principal', '2026-03-05T08:30:00.000Z', {
                category: 'Movies',
                image: 'https://example.com/local.jpg',
              }),
            ],
          },
        ],
      } as any)
    );

    service.loadContent('movies', 'today').subscribe((snapshot) => {
      expect(snapshot.featured).toBeNull();
      done();
    });
  });

  it('accepts canonicalization by channel name for main channels', (done) => {
    tvDataSpy.loadLayouts.and.returnValue(
      of({
        date: '20260305',
        timeSlots: [],
        channels: [
          {
            channel: { id: 'canal_custom', name: 'laSexta', type: 'TDT' },
            programs: [
              makeProgram('p1', 'Pelicula laSexta', '2026-03-05T07:00:00.000Z', {
                category: 'Cine',
                image: '/storage/posters/lasexta.webp',
              }),
            ],
          },
        ],
      } as any)
    );

    service.loadContent('movies', 'today').subscribe((snapshot) => {
      expect(snapshot.featured).toBeTruthy();
      expect(snapshot.featured?.id).toBe('p1');
      done();
    });
  });
});

function makeProgram(
  id: string,
  title: string,
  start: string,
  opts?: { category?: string; image?: string; end?: string }
): any {
  return {
    id,
    channelId: 'x',
    title,
    start,
    end: opts?.end || addMinutes(start, 90),
    durationMinutes: 90,
    category: opts?.category,
    image: opts?.image,
    timeSlotIndex: 0,
    gridColumnStart: 1,
    gridColumnEnd: 2,
    layerIndex: 0,
    isCutAtStart: false,
    isCutAtEnd: false,
    visibleStartTime: '08:00',
    visibleEndTime: '09:30',
    crossesMidnight: false,
  };
}

function addMinutes(startIso: string, minutes: number): string {
  return new Date(Date.parse(startIso) + minutes * 60_000).toISOString();
}
