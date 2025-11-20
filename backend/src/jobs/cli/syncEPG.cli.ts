#!/usr/bin/env node

/**
 * Script CLI para ejecutar syncEPG desde cron del sistema
 * Uso: node dist/jobs/cli/syncEPG.cli.js
 */

import { syncEPGJob } from '../syncEPG';

async function main() {
  try {
    console.log('Ejecutando syncEPG desde CLI');

    const { createContainer } = await import('../../config/container');
    const container = createContainer();
    await container.initialize();

    await syncEPGJob();

    await container.cleanup();
    console.log('Job completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando job:', error);
    process.exit(1);
  }
}

main();
