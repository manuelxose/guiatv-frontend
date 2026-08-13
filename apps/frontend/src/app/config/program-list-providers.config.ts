/**
 * Providers específicos para ProgramList
 * Ubicación: src/app/config/program-list-providers.config.ts
 */

import { Provider, PLATFORM_ID } from '@angular/core';
import { TimeManagerService } from '../services/program-list/time-manager.service';
import { DimensionCalculatorService } from '../services/program-list/dimension-calculator.service';
import { CategoryStyleManagerService } from '../services/program-list/category-style-manager.service';
import { ProgramListFacadeService } from '../services/program-list/program-list-facade.service';

/**
 * Todos los providers necesarios para ProgramListComponent
 */
export const allProgramListProviders: Provider[] = [
  TimeManagerService,
  CategoryStyleManagerService,
  {
    provide: DimensionCalculatorService,
    useFactory: (platformId: object, timeManager: TimeManagerService) =>
      new DimensionCalculatorService(platformId, timeManager),
    deps: [PLATFORM_ID, TimeManagerService],
  },
  {
    provide: ProgramListFacadeService,
    useClass: ProgramListFacadeService,
  },
];
