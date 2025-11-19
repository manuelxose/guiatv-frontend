/**
 * Job de precómputo de horarios
 * Ejecuta el handler de precómputo de schedules
 */
export async function precomputeSchedulesJob(): Promise<void> {
  console.log('[Job] 🔄 Iniciando precómputo de horarios...');
  
  try {
    // Importar handler original desde v2/scheduledFunctions
    const { precomputeSchedulesHandler } = await import('../v2/scheduledFunctions');
    
    // Los handlers de v2 esperan un CloudEvent, crear uno mock
    const mockEvent: any = {
      type: 'google.cloud.scheduler.job.v1.executed',
      data: {},
    };
    
    await precomputeSchedulesHandler(mockEvent);
    
    console.log('[Job] ✅ Precómputo de horarios completado');
  } catch (error) {
    console.error('[Job] ❌ Error en precomputeSchedules:', error);
    throw error;
  }
}
