#!/usr/bin/env node

import { precomputeSchedulesJob } from '../precomputeSchedules';

async function main() {
  try {
    console.log('Ejecutando precomputeSchedules desde CLI');

    const { createContainer } = await import('../../config/container');
    const container = createContainer();
    await container.initialize();

    await precomputeSchedulesJob();

    await container.cleanup();
    console.log('Job completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando job:', error);
    process.exit(1);
  }
}

main();
