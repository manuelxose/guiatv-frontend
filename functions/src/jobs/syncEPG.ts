/**
 * Job de sincronización de EPG
 * Ejecuta el handler de sincronización de datos EPG
 */
export async function syncEPGJob(): Promise<void> {
  console.log('[Job] 🔄 Iniciando sincronización de EPG...');
  
  try {
    // Importar handler original desde v2/scheduledFunctions
    const { syncEPGDataHandler } = await import('../v2/scheduledFunctions');
    
    // Los handlers de v2 esperan un CloudEvent, crear uno mock
    const mockEvent: any = {
      type: 'google.cloud.scheduler.job.v1.executed',
      data: {},
    };
    
    await syncEPGDataHandler(mockEvent);
    
    console.log('[Job] ✅ Sincronización de EPG completada');
  } catch (error) {
    console.error('[Job] ❌ Error en syncEPG:', error);
    throw error;
  }
}
