/**
 * Job de pre-calculo de schedules
 */
export async function precomputeSchedulesJob(): Promise<void> {
  console.log('[Job] Iniciando pre-calculo de schedules...');
  
  try {
    const { precomputeSchedulesHandler } = await import('../infrastructure/scheduled/syncScheduledFunction');

    const mockEvent: any = {
      type: 'scheduler.precomputeSchedules',
      data: {},
    };

    await precomputeSchedulesHandler(mockEvent);

    console.log('[Job] Pre-cálculo de schedules completado');
  } catch (error) {
    console.error('[Job] Error en precomputeSchedules:', error);
    throw error;
  }
}
