/**
 * Shared environment bootstrap.
 * Sets timezone and loads env vars from the production env file or a local .env.
 * Must be imported BEFORE any other module that reads process.env or creates Dates.
 */

// 1. Force Spain timezone for all Date operations.
process.env.TZ = 'Europe/Madrid';

// 2. Load environment variables via dotenv.
//    Priority: /etc/guiatv/api.env (production) → apps/backend/.env (development)
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const prodEnvPath = '/etc/guiatv/api.env';
const localEnvPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
