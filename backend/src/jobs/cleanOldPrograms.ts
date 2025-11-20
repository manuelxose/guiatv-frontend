/**
 * Job de limpieza de programas antiguos
 */
export async function cleanOldProgramsJob(): Promise<void> {
  console.log('[Job] Iniciando limpieza de programas...');

  try {
    const { cleanOldProgramsHandler } = await import('../infrastructure/scheduled/syncScheduledFunction');

    const mockEvent: any = {
      type: 'scheduler.cleanOldPrograms',
      data: {},
    };

    await cleanOldProgramsHandler(mockEvent);

    console.log('[Job] Limpieza de programas completada');
  } catch (error) {
    console.error('[Job] Error en cleanOldPrograms:', error);
    throw error;
  }
}
