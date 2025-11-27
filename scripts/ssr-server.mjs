import '@angular/compiler';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve, extname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import 'zone.js/node';
import express from 'express';
import { CommonEngine } from '@angular/ssr/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rutas del build (Asegúrate de haber ejecutado 'npm run build' primero)
const distFolder = resolve(__dirname, '../dist/guiatv');
const serverDistPath = join(distFolder, 'server');
const browserDistPath = join(distFolder, 'browser');
const indexHtmlPath = join(serverDistPath, 'index.server.html');
const browserIndexHtmlPath = join(browserDistPath, 'index.csr.html');

// =============================================================================
// 🛠️ JSDOM SETUP
// =============================================================================

// Validación de archivos
if (!existsSync(indexHtmlPath)) {
  console.error('❌ ERROR FATAL: No se encuentra index.server.html');
  console.error('👉 Ejecuta "npm run build" antes de iniciar el servidor SSR.');
  process.exit(1);
}

const template = readFileSync(indexHtmlPath, 'utf-8');
const dom = new JSDOM(template, {
  url: 'http://localhost:3000',
  runScripts: 'outside-only',
  resources: 'usable',
  pretendToBeVisual: true
});

const win = dom.window;

// =============================================================================
// 🛠️ GLOBALS & POLYFILLS (FIX NODE 22 + JSDOM READ-ONLY)
// =============================================================================

// 1. Mock de Storage seguro
const storagePolyfill = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null
};

// --- FIX CRÍTICO AQUÍ ---
// localStorage es read-only en JSDOM. Usamos defineProperty para forzarlo.
Object.defineProperty(win, 'localStorage', {
  value: storagePolyfill,
  writable: true,
  configurable: true
});

Object.defineProperty(win, 'sessionStorage', {
  value: storagePolyfill,
  writable: true,
  configurable: true
});

// 2. Globals de Node.js (Node 21+ hace navigator read-only)
global.window = win;
global.document = win.document;
global.location = win.location;

Object.defineProperty(global, 'navigator', {
  value: win.navigator,
  writable: true,
  configurable: true
});

// 3. Constructores del DOM (Necesarios para Angular Ivy)
global.Node = win.Node;
global.Element = win.Element;
global.HTMLElement = win.HTMLElement;
global.HTMLAnchorElement = win.HTMLAnchorElement;
global.Event = win.Event;
global.KeyboardEvent = win.KeyboardEvent;
global.MouseEvent = win.MouseEvent;
global.DOMTokenList = win.DOMTokenList;
global.Comment = win.Comment;
global.Text = win.Text;

// 4. Polyfills visuales mínimos
win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener: ()=>{}, removeListener: ()=>{} }));
win.requestAnimationFrame = (cb) => setTimeout(cb, 0);
win.cancelAnimationFrame = (id) => clearTimeout(id);


// =============================================================================
// 🚀 SERVER SETUP
// =============================================================================

// Importación dinámica del módulo de servidor
const bootstrap = (await import(pathToFileURL(join(serverDistPath, 'main.server.mjs')).href)).default;

const app = express();
const engine = new CommonEngine();
const PORT = process.env.PORT || 3000;

// 1. Servir estáticos (JS, CSS, Imágenes del cliente)
app.get('*.*', express.static(browserDistPath, { maxAge: '1y' }));

// 2. Handler Principal con Fallback CSR
app.get('*', async (req, res) => {
  const absoluteUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Sincronizar URL en JSDOM para este request
  if (global.window) {
    try {
      global.window.history.replaceState(null, '', req.originalUrl);
    } catch(e) {}
  }

  try {
    console.log(`🔄 SSR Rendering: ${req.originalUrl}`);
    
    const html = await engine.render({
      bootstrap,
      documentFilePath: indexHtmlPath,
      url: absoluteUrl,
      publicPath: browserDistPath,
      providers: [
        { provide: 'APP_BASE_HREF', useValue: absoluteUrl }
      ]
    });

    res.send(html);
    console.log(`✅ SSR Success`);

  } catch (err) {
    console.error(`❌ SSR Falló (Activando Fallback CSR): ${err.message}`);
    
    // FALLBACK: Servir index.html del cliente para que el navegador renderice
    if (existsSync(browserIndexHtmlPath)) {
      try {
        const fallbackHtml = readFileSync(browserIndexHtmlPath, 'utf-8');
        res.send(fallbackHtml);
        console.log(`⚠️ Fallback CSR enviado.`);
      } catch (e) {
        res.status(500).send('Error crítico: No se pudo leer el fallback.');
      }
    } else {
      res.status(500).send('Error crítico: SSR falló y no existe versión compilada de cliente (browser/index.html). Ejecuta "npm run build".');
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SSR Server escuchando en http://localhost:${PORT}`);
});