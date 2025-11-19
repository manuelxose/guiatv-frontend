#!/usr/bin/env node

/**
 * Script CLI para ejecutar cleanOldPrograms desde cron del sistema
 * Uso: node dist/jobs/cli/cleanOldPrograms.cli.js
 */

import { cleanOldProgramsJob } from '../cleanOldPrograms';

async function main() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('  Ejecutando cleanOldPrograms desde CLI');
    console.log('═══════════════════════════════════════');
    
    // Inicializar contenedor de dependencias
    const { createContainer } = await import('../../v2/config/container');
    const container = createContainer();
    await container.initialize();
    
    // Ejecutar job
    await cleanOldProgramsJob();
    
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
