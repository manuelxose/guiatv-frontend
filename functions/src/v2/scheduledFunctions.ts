// src/v2/scheduledFunctions.ts (exportar todas las scheduled functions)

export {
  syncEPGDataScheduled,
  precomputeSchedulesScheduled,
  cleanOldProgramsScheduled,
} from './infrastructure/scheduled/syncScheduledFunction';
