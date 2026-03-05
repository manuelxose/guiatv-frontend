/**
 * Legacy migration placeholder.
 *
 * Firestore ya no es la fuente operativa de datos para este despliegue.
 * Este comando se mantiene para compatibilidad y para evitar scripts rotos.
 */

import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main(): Promise<void> {
  console.log('migrate:firestore-to-mongo -> no-op (legacy)');
  console.log('La estrategia actual usa MongoDB local + sync EPG como fuente de datos.');
}

main().catch((err) => {
  console.error('Legacy migration script failed:', err?.message || err);
  process.exit(1);
});
