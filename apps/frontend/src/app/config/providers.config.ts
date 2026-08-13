/**
 * Providers mínimos apoyados en la capa nueva de API/estado.
 * Si prefieres providedIn:'root' en todos, puedes omitir este archivo y usar sólo app.config.ts.
 */
import { Provider, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ApiClientService } from '../api/api-client.service';
import { ApiConfigService } from '../api/api-config.service';
import { ApiCacheService } from '../api/cache.service';
import { TvApiService } from '../api/tv-api.service';
import { TvDataService } from '../state/tv-data.service';
import { ContentService } from '../state/content.service';
import { ProgramListService } from '../state/program-list.service';
import { ProgramListFacadeService } from '../services/program-list/program-list-facade.service';
import { TimeManagerService } from '../services/program-list/time-manager.service';
import { DimensionCalculatorService } from '../services/program-list/dimension-calculator.service';
import { CategoryStyleManagerService } from '../services/program-list/category-style-manager.service';

export const coreProviders: Provider[] = [
  ApiConfigService,
  ApiCacheService,
  ApiClientService,
  TvApiService,
  TvDataService,
  DeviceDetectorService,
];

export const stateProviders: Provider[] = [
  ContentService,
  ProgramListService,
];

export const programListProviders: Provider[] = [
  TimeManagerService,
  CategoryStyleManagerService,
  {
    provide: DimensionCalculatorService,
    useFactory: (platformId: object, timeManager: TimeManagerService) =>
      new DimensionCalculatorService(platformId, timeManager),
    deps: [PLATFORM_ID, TimeManagerService],
  },
  ProgramListFacadeService,
];

export const allProviders: Provider[] = [
  ...coreProviders,
  ...stateProviders,
  ...programListProviders,
];
