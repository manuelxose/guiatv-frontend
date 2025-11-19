#!/usr/bin/env node

/**
 * Script CLI para ejecutar syncEPG desde cron del sistema
 * Uso: node dist/jobs/cli/syncEPG.cli.js
 */

import { syncEPGJob } from '../syncEPG';

async function main() {
  try {
    console.log('═══════════════════════════════════════');
    console.log('  Ejecutando syncEPG desde CLI');
    console.log('═══════════════════════════════════════');
    
    // Inicializar contenedor de dependencias
    const { createContainer } = await import('../../v2/config/container');
    const container = createContainer();
    await container.initialize();
    
    // Ejecutar job
    await syncEPGJob();
    
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
