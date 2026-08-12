import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, combineLatest, map, Observable, of } from 'rxjs';
import { TvReadItemDTO } from '../api/models';
import { EditorialHubState, EditorialPost } from '../blog/models/editorial.models';
import { EditorialService } from '../blog/services/editorial.service';
import { DiscoveryHomeResponse, DiscoveryService } from '../services/discovery.service';
import { CatalogPlatform } from '../services/catalog.service';
import { TvDataFacade } from './tv-data.facade';

export interface PortalHomeState {
  liveNow: TvReadItemDTO[];
  tonight: TvReadItemDTO[];
  streamingHighlights: DiscoveryHomeResponse['platformItems'];
  sportsNow: TvReadItemDTO[];
  editorialHub: EditorialHubState;
  rankingHighlights: EditorialPost[];
  featuredPlatforms: CatalogPlatform[];
  trendingItems: DiscoveryHomeResponse['trendingItems'];
  freeItems: DiscoveryHomeResponse['freeItems'];
}

@Injectable({ providedIn: 'root' })
export class PortalHomeFacade {
  private readonly isBrowser: boolean;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly tvDataFacade: TvDataFacade,
    private readonly editorialService: EditorialService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getHomeState(): Observable<PortalHomeState> {
    return combineLatest({
      discovery: this.discoveryService.getHome().pipe(
        catchError(() =>
          of({
            personalized: [],
            platformItems: [],
            freeItems: [],
            liveItems: [],
            tonightItems: [],
            trendingItems: [],
            platforms: [],
            generatedAt: new Date().toISOString(),
          })
        )
      ),
      liveNow: this.tvDataFacade.getLivePrograms({ date: 'today', limit: 8 }),
      tonight: this.tvDataFacade.getTonightPrograms({ date: 'today', limit: 12 }),
      sportsNow: this.tvDataFacade.getLiveSports({ date: 'today' }),
      platforms: this.tvDataFacade.getPlatforms(),
      editorialHub: this.editorialService.getHubState().pipe(
        catchError(() =>
          of({
            hero: null,
            guidePosts: [],
            rankingPosts: [],
            trendPosts: [],
            categorySections: [],
            categories: [],
          })
        )
      ),
      rankings: this.editorialService.getRankingsPageState().pipe(
        catchError(() =>
          of({
            featured: null,
            posts: [],
            categories: [],
            sections: [],
          })
        )
      ),
    }).pipe(
      map(({ discovery, liveNow, tonight, sportsNow, platforms, editorialHub, rankings }) => ({
        liveNow,
        tonight,
        streamingHighlights: discovery.platformItems || [],
        sportsNow,
        editorialHub,
        rankingHighlights: rankings.posts.slice(0, 6),
        featuredPlatforms: (discovery.platforms?.length ? discovery.platforms : platforms).slice(0, 8),
        trendingItems: discovery.trendingItems || [],
        freeItems: discovery.freeItems || [],
      }))
    );
  }
}
