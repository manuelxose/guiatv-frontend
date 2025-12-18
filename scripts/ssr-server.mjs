import '@angular/platform-server/init';
import '@angular/compiler';
import 'zone.js/node';

import domino from 'domino';
import express from 'express';
import { readFileSync, existsSync } from 'node:fs'; // 👈 Añadido existsSync
import { CommonEngine } from '@angular/ssr/node';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_BASE_HREF } from '@angular/common'; // 👈 Importante

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CONFIGURACIÓN DE RUTAS
// Asegúrate de que estas carpetas existen tras el 'ng build'
const distFolder = resolve(__dirname, '../dist/guiatv');
const browserDistPath = join(distFolder, 'browser');
const serverDistPath = join(distFolder, 'server');
const indexHtml = join(serverDistPath, 'index.server.html');
const port = process.env['PORT'] || 3000;

// =============================================================================
// 1. DOM SHIMS (DOMINO) - CORREGIDO
// =============================================================================
let template;
try {
  template = readFileSync(indexHtml, 'utf-8');
} catch (err) {
  console.error('❌ CRITICAL: No se encuentra index.server.html en:', indexHtml);
  process.exit(1);
}

// 🔧 FIX: Inyectar <base href="/"> si no existe para calmar a Domino/Angular
if (!template.includes('<base href')) {
  template = template.replace('<head>', '<head><base href="/">');
}

// Crear Window con url simulada
const win = domino.createWindow(template, 'http://localhost:3000');

globalThis.window = win;
globalThis.document = win.document;
globalThis.self = win;
globalThis.Node = win.Node;
globalThis.HTMLElement = win.HTMLElement;
globalThis.getComputedStyle = win.getComputedStyle;

// Polyfills básicos
if (!globalThis.navigator) {
  Object.defineProperty(globalThis, 'navigator', {
    value: win.navigator,
    configurable: true,
  });
}
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// Polyfill de Storage
if (!globalThis.localStorage) {
  globalThis.localStorage = {
      getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}
  };
}

// =============================================================================
// 2. API FAILSAFE (MOCKS)
// =============================================================================
const enableApiFailsafe = process.env['SSR_API_FAILSAFE'] !== 'false';

if (enableApiFailsafe && typeof fetch === 'function') {
  const originalFetch = fetch;
  globalThis.fetch = async (input, init) => {
    try {
      return await originalFetch(input, init);
    } catch (err) {
      const url = typeof input === 'string' ? input : input?.url || '';
      const isApiCall = url.includes('localhost:4000') || url.includes('127.0.0.1:4000') || url.includes('/v2/');

      if (!isApiCall) throw err;

      console.warn(`[SSR] ⚠️ Backend unreachable. Serving MOCK for: ${url}`);
      return Promise.resolve(buildMockResponse(url));
    }
  };
}

function buildMockResponse(url) {
  const json = mockPayloadFor(url);
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockPayloadFor(url) {
  const today = new Date().toISOString().slice(0, 10);
  const empty = { date: today, timeSlots: [], channels: [], programs: [], categories: [] };
  
  if (url.includes('/programs')) return { success: true, data: { ...empty, total: 0 } };
  if (url.includes('/channels')) return { success: true, data: { channels: [] } };
  return { success: true, data: null };
}

// =============================================================================
// 3. SERVER SETUP
// =============================================================================
let bootstrap;
async function getBootstrap() {
  if (!bootstrap) {
    const module = await import('../dist/guiatv/server/main.server.mjs');
    bootstrap = module.default || module.bootstrap || module.app || module;
  }
  return bootstrap;
}

const app = express();
const commonEngine = new CommonEngine();

app.get('*.*', express.static(browserDistPath, { maxAge: '1y' }));

app.get('*', async (req, res) => {
  const { protocol, originalUrl, headers } = req;
  const host = headers.host || `localhost:${port}`;
  const renderUrl = `${protocol}://${host}${originalUrl}`;

  try {
    const bootstrapFn = await getBootstrap();
    const html = await commonEngine.render({
      bootstrap: bootstrapFn,
      documentFilePath: indexHtml,
      url: renderUrl,
      publicPath: browserDistPath,
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' } // Refuerzo para Angular
      ]
    });
    res.send(html);
  } catch (err) {
    console.error('[SSR] ❌ Render Error:', err);
    
    // 🔧 FIX: Manejo robusto del Fallback (CSR)
    // Buscamos index.html o index.csr.html
    const fallbackFile = join(browserDistPath, 'index.html');
    const fallbackCsr = join(browserDistPath, 'index.csr.html');
    
    if (existsSync(fallbackFile)) {
        return res.sendFile(fallbackFile);
    } else if (existsSync(fallbackCsr)) {
        return res.sendFile(fallbackCsr);
    } else {
        console.error(`❌ CRITICAL: No se encuentra index.html en ${browserDistPath}`);
        return res.status(500).send('<h1>500 - Error Interno</h1><p>No se pudo cargar la aplicación (SSR Failed & CSR missing).</p>');
    }
  }
});

app.listen(port, () => {
  console.log(`🚀 SSR Server listening on http://localhost:${port}`);
});

export default app;