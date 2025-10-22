// src/index.ts (actualizado para incluir v2)

import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

// API v1 (legacy)
const apiV1App = express();
apiV1App.use(cors());

// ... [código v1 existente] ...

// Exportar API v1 (mantener retrocompatibilidad)
export const api = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .https.onRequest(apiV1App);

export const app = api; // Alias backward compatible

// Importar y exportar API v2
export { apiv2 } from './v2/index';

// Scheduled functions existentes
export { actualizarProgramacion } from './v1/actualizarProgramacion';

// SSR function existente
// export { ssr } from './v1/ssr'; // removed because './v1/ssr' cannot be found — create functions/src/v1/ssr.ts and export `ssr` from it if needed
