/**
 * One-shot initializer to leave the API ready for use (compiled TS, no ts-node).
 *
 * Steps:
 * 1) Assumes main build already ran (npm run build).
 * 2) Run create-indexes.
 * 3) Run job:syncEPG (skip with SKIP_EPG=1).
 * 4) Run job:precompute (skip with SKIP_PRECOMPUTE=1).
 * 5) Optionally start server if START_AFTER_INIT=1.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const cwd = path.resolve(__dirname, '..');

const shouldSkip = (envVar: string): boolean => {
  const v = process.env[envVar];
  return v === '1' || v === 'true';
};

const run = (cmd: string, label?: string): Promise<void> =>
  new Promise((resolve, reject) => {
    console.log(`\n▶ ${label || cmd}`);
    const child = spawn(cmd, {
      cwd,
      env: process.env,
      shell: true,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${label || cmd} exited with code ${code}`));
    });
  });

async function main(): Promise<void> {
  const steps: Array<() => Promise<void>> = [];

  // Build is expected to be done before this script runs (init handles it).
  steps.push(() => run('npm run create-indexes', 'Create Mongo indexes'));

  if (!shouldSkip('SKIP_EPG')) {
    steps.push(() => run('npm run job:syncEPG', 'Sync EPG data'));
  } else {
    console.log('⏭  Skipping EPG sync (SKIP_EPG=1)');
  }

  if (!shouldSkip('SKIP_PRECOMPUTE')) {
    steps.push(() => run('npm run job:precompute', 'Precompute schedules'));
  } else {
    console.log('⏭  Skipping precompute (SKIP_PRECOMPUTE=1)');
  }

  for (const step of steps) {
    await step();
  }

  console.log('\n✅ API initialized (indexes + data).');

  if (process.env.START_AFTER_INIT === '1' || process.env.START_AFTER_INIT === 'true') {
    await run('npm start', 'Start server');
  }
}

main().catch((err) => {
  console.error('\n❌ Initialization failed:', err?.message || err);
  process.exit(1);
});
