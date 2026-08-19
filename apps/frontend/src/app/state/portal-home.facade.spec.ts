import { PLATFORM_ID } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';
import { EditorialService } from '../blog/services/editorial.service';
import { DiscoveryService } from '../services/discovery.service';
import { TvDataFacade } from './tv-data.facade';
import { PortalHomeFacade } from './portal-home.facade';

describe('PortalHomeFacade', () => {
  it('emits a terminal home state when editorial requests do not settle', fakeAsync(() => {
    const discovery = jasmine.createSpyObj<DiscoveryService>('DiscoveryService', ['getHome']);
    discovery.getHome.and.returnValue(
      of({
        personalized: [],
        platformItems: [],
        freeItems: [],
        liveItems: [],
        tonightItems: [],
        trendingItems: [],
        platforms: [],
        generatedAt: '2026-08-13T00:00:00.000Z',
      })
    );

    const tvData = jasmine.createSpyObj<TvDataFacade>('TvDataFacade', [
      'getLivePrograms',
      'getTonightPrograms',
      'getPlatforms',
    ]);
    tvData.getLivePrograms.and.returnValue(of([]));
    tvData.getTonightPrograms.and.returnValue(of([]));
    tvData.getPlatforms.and.returnValue(of([]));

    const editorial = jasmine.createSpyObj<EditorialService>('EditorialService', [
      'getHubState',
      'getRankingsPageState',
    ]);
    editorial.getHubState.and.returnValue(NEVER);
    editorial.getRankingsPageState.and.returnValue(NEVER);

    TestBed.configureTestingModule({
      providers: [
        PortalHomeFacade,
        { provide: DiscoveryService, useValue: discovery },
        { provide: TvDataFacade, useValue: tvData },
        { provide: EditorialService, useValue: editorial },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    let emitted = false;
    TestBed.inject(PortalHomeFacade).getHomeState().subscribe((state) => {
      emitted = true;
      expect(state.editorialHub.guidePosts).toEqual([]);
      expect(state.rankingHighlights).toEqual([]);
    });

    tick(4_999);
    expect(emitted).toBeFalse();
    tick(1);
    expect(emitted).toBeTrue();
  }));
});
