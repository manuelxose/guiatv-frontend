/**
 * Job de limpieza de programas antiguos
 * Ejecuta el handler de limpieza de programas viejos
 */
export async function cleanOldProgramsJob(): Promise<void> {
  console.log('[Job] 🔄 Iniciando limpieza de programas antiguos...');
  
  try {
    // Importar handler original desde v2/scheduledFunctions
    const { cleanOldProgramsHandler } = await import('../v2/scheduledFunctions');
    
    // Los handlers de v2 esperan un CloudEvent, crear uno mock
    const mockEvent: any = {
      type: 'google.cloud.scheduler.job.v1.executed',
      data: {},
    };
    
    await cleanOldProgramsHandler(mockEvent);
    
    console.log('[Job] ✅ Limpieza de programas antiguos completada');
  } catch (error) {
    console.error('[Job] ❌ Error en cleanOldPrograms:', error);
    throw error;
  }
}
