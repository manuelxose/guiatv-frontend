/**
 * Job de sincronizacion de EPG
 * Ejecuta el handler de sincronizacion de datos EPG
 */
export async function syncEPGJob(): Promise<void> {
  console.log('[Job] Iniciando sincronizacion de EPG...');
  
  try {
    const { syncEPGDataHandler } = await import('../infrastructure/scheduled/syncScheduledFunction');

    const mockEvent: any = {
      type: 'scheduler.syncEPG',
      data: {},
    };
    
    await syncEPGDataHandler(mockEvent);
    
    console.log('[Job] Sincronización de EPG completada');
  } catch (error) {
    console.error('[Job] Error en syncEPG:', error);
    throw error;
  }
}
