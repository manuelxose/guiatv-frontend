// src/v2/scheduledFunctions.ts (exportar todas las scheduled functions)

export {
  syncEPGDataHandler,
  precomputeSchedulesHandler,
  cleanOldProgramsHandler,
} from './infrastructure/scheduled/syncScheduledFunction';
