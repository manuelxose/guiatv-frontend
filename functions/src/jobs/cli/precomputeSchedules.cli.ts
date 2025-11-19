#!/usr/bin/env node

/**
 * Script CLI para ejecutar precomputeSchedules desde cron del sistema
 * Uso: node dist/jobs/cli/precomputeSchedules.cli.js
 */

import { precomputeSchedulesJob } from '../precomputeSchedules';

async function main() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('  Ejecutando precomputeSchedules desde CLI');
    console.log('═══════════════════════════════════════');
    
    // Inicializar contenedor de dependencias
    const { createContainer } = await import('../../v2/config/container');
    const container = createContainer();
    await container.initialize();
    
    // Ejecutar job
    await precomputeSchedulesJob();
    
    console.log('═══════════════════════════════════════');
    console.log('  ✅ Job completado exitosamente');
    console.log('═══════════════════════════════════════');
    
    process.exit(0);
  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('  ❌ Error ejecutando job:', error);
    console.error('═══════════════════════════════════════');
    process.exit(1);
  }
}

main();
