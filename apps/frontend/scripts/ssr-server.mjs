import express from 'express';
import { readFileSync, existsSync } from 'node:fs'; // ?? A¤adido existsSync
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import http from 'node:http';
import https from 'node:https';

// Patch Domino's NYI to avoid SSR crashes on unimplemented features.
const require = createRequire(import.meta.url);
try {
  const dominoUtils = require('domino/lib/utils');
  dominoUtils.nyi = () => null;
} catch {
  // Ignore if internal path changes; SSR can still work without this patch.
}

await import('zone.js/node');
await import('@angular/compiler');
await import('@angular/platform-server/init');

const dominoModule = await import('domino');
const domino = dominoModule.default ?? dominoModule;
const { CommonEngine } = await import('@angular/ssr/node');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CONFIGURACIÓN DE RUTAS
// Asegúrate de que estas carpetas existen tras el 'ng build'
const distFolder = process.env.FRONTEND_RELEASE_DIR
  ? resolve(process.env.FRONTEND_RELEASE_DIR)
  : resolve(__dirname, '../dist/guiatv');
const browserDistPath = join(distFolder, 'browser');
const serverDistPath = join(distFolder, 'server');
const indexHtml = join(serverDistPath, 'index.server.html');
const port = process.env['PORT'] || 3000;
const DEFAULT_SSR_ORIGIN = process.env['SSR_ORIGIN'] || `http://localhost:${port}`;
const backendOrigin = process.env['API_ORIGIN'] || 'http://127.0.0.1:4000';
const backendUrl = new URL(backendOrigin);
const backendClient = backendUrl.protocol === 'https:' ? https : http;

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

const { Renderer2, REQUEST } = await import('@angular/core');
const noopRenderer = {
  data: Object.create(null),
  destroyNode: null,
  createElement: (name) => win?.document?.createElement?.(name) || {},
  createComment: (value) => win?.document?.createComment?.(value) || {},
  createText: (value) => win?.document?.createTextNode?.(value) || {},
  appendChild: (parent, child) => parent?.appendChild?.(child),
  insertBefore: (parent, child, ref) => parent?.insertBefore?.(child, ref),
  removeChild: (parent, child) => parent?.removeChild?.(child),
  selectRootElement: (selectorOrNode) => (selectorOrNode?.nodeType ? selectorOrNode : win?.document?.querySelector?.(selectorOrNode)),
  parentNode: (node) => node?.parentNode || null,
  nextSibling: (node) => node?.nextSibling || null,
  setAttribute: (el, name, value) => el?.setAttribute?.(name, value),
  removeAttribute: (el, name) => el?.removeAttribute?.(name),
  addClass: (el, name) => el?.classList?.add?.(name),
  removeClass: (el, name) => el?.classList?.remove?.(name),
  setStyle: (el, style, value) => { if (el?.style) el.style[style] = value; },
  removeStyle: (el, style) => { if (el?.style) el.style[style] = ''; },
  setProperty: (el, name, value) => { if (el) el[name] = value; },
  setValue: (node, value) => { if (node) node.nodeValue = value; },
  listen: () => () => {},
};
if (Renderer2 && Renderer2.__NG_ELEMENT_ID__) {
  const originalRendererId = Renderer2.__NG_ELEMENT_ID__;
  Renderer2.__NG_ELEMENT_ID__ = () => {
    try {
      return originalRendererId();
    } catch {
      return noopRenderer;
    }
  };
}
Object.defineProperty(win.document, 'baseURI', {
  configurable: true,
  get() {
    return win.location?.href || DEFAULT_SSR_ORIGIN;
  },
});

globalThis.window = win;
globalThis.document = win.document;
globalThis.self = win;
globalThis.Node = win.Node;
globalThis.HTMLElement = win.HTMLElement;
globalThis.getComputedStyle = win.getComputedStyle;
globalThis.location = win.location;

// Ensure history APIs exist for router usage during SSR.
if (win.history) {
  win.history.replaceState = win.history.replaceState || (() => {});
  win.history.pushState = win.history.pushState || (() => {});
  win.history.back = win.history.back || (() => {});
  win.history.forward = win.history.forward || (() => {});
  win.history.go = win.history.go || (() => {});
} else {
  win.history = {
    replaceState: () => {},
    pushState: () => {},
    back: () => {},
    forward: () => {},
    go: () => {},
  };
}
globalThis.history = win.history;

const defaultRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
const patchLayoutProps = (proto) => {
  if (!proto) return;
  if (!proto.getBoundingClientRect) proto.getBoundingClientRect = defaultRect;
  if (!proto.getClientRects) proto.getClientRects = () => [];
  if (!('clientWidth' in proto)) Object.defineProperty(proto, 'clientWidth', { get: () => 0 });
  if (!('clientHeight' in proto)) Object.defineProperty(proto, 'clientHeight', { get: () => 0 });
  if (!('scrollWidth' in proto)) Object.defineProperty(proto, 'scrollWidth', { get: () => 0 });
  if (!('scrollHeight' in proto)) Object.defineProperty(proto, 'scrollHeight', { get: () => 0 });
  if (!('offsetWidth' in proto)) Object.defineProperty(proto, 'offsetWidth', { get: () => 0 });
  if (!('offsetHeight' in proto)) Object.defineProperty(proto, 'offsetHeight', { get: () => 0 });
};
patchLayoutProps(win.Element?.prototype);
patchLayoutProps(win.HTMLElement?.prototype);
if (typeof win.innerWidth !== 'number') win.innerWidth = 1024;
if (typeof win.innerHeight !== 'number') win.innerHeight = 768;
if (typeof win.pageXOffset !== 'number') win.pageXOffset = 0;
if (typeof win.pageYOffset !== 'number') win.pageYOffset = 0;
if (typeof win.scrollX !== 'number') win.scrollX = 0;
if (typeof win.scrollY !== 'number') win.scrollY = 0;
if (typeof win.scrollTo !== 'function') win.scrollTo = () => {};
// Domino quirk: avoid NotYetImplemented for mozGetInputMutationHandler
if (domino.impl?.DOMImplementation?.prototype) {
  domino.impl.DOMImplementation.prototype.mozGetInputMutationHandler = () => null;
}
if (win.document?.implementation) {
  win.document.implementation.mozGetInputMutationHandler = () => null;
}

// Domino lacks a fully implemented HTMLBaseElement.href; patch to avoid NYI errors.
if (win.HTMLBaseElement) {
  Object.defineProperty(win.HTMLBaseElement.prototype, 'href', {
    configurable: true,
    get() {
      return this.getAttribute('href') || '';
    },
    set(value) {
      this.setAttribute('href', value);
    },
  });
}

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
// 2. SERVER SETUP
// =============================================================================
let bootstrap;
async function getBootstrap() {
  if (!bootstrap) {
    const mainServerBundle = pathToFileURL(join(serverDistPath, 'main.server.mjs')).href;
    const module = await import(mainServerBundle);
    bootstrap = module.default || module.bootstrap || module.app || module;
  }
  return bootstrap;
}

const app = express();
const commonEngine = new CommonEngine();
const proxyPaths = ['/v2', '/storage', '/sitemap.xml'];
function proxyToBackend(req, res) {
  const targetUrl = new URL(req.originalUrl, backendOrigin);
  const headers = { ...req.headers, host: backendUrl.host };
  const options = {
    protocol: backendUrl.protocol,
    hostname: backendUrl.hostname,
    port: backendUrl.port || (backendUrl.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: `${targetUrl.pathname}${targetUrl.search}`,
    headers,
  };
  const proxyReq = backendClient.request(options, (proxyRes) => {
    res.statusCode = proxyRes.statusCode || 502;
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (value !== undefined) res.setHeader(key, value);
    });
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', (err) => {
    console.error('[SSR] Proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad Gateway' });
      return;
    }
    res.end();
  });
  req.pipe(proxyReq, { end: true });
}


app.disable('x-powered-by');
app.set('trust proxy', true);
app.set('etag', 'strong');

// Security-focused headers with minimal risk of breaking existing behavior
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  next();
});

// Optional compression if the dependency is installed
try {
  const { default: compression } = await import('compression');
  app.use(compression());
  console.log('[SSR] Compression enabled');
} catch {
  console.log('[SSR] Compression not enabled (optional dependency missing)');
}

proxyPaths.forEach((path) => {
  app.use(path, (req, res) => proxyToBackend(req, res));
});

app.get('/.well-known/*', (req, res) => {
  res.status(204).end();
});

app.get('*.*', express.static(browserDistPath, { maxAge: '1y', immutable: true }));

// If a static asset is missing, return 404 instead of falling through to SSR HTML.
app.get(/\.(?:js|mjs|css|map|json|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)$/i, (req, res) => {
  res.status(404).end();
});

// Lightweight healthcheck for production orchestration
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// =============================================================================
// SSR RESPONSE CACHE (in-memory, TTL-based)
// =============================================================================
const SSR_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SSR_CACHE_MAX_ENTRIES = 200;
const ssrCache = new Map();

function getCachedResponse(urlPath) {
  const entry = ssrCache.get(urlPath);
  if (!entry) return null;
  if (Date.now() - entry.ts > SSR_CACHE_TTL_MS) {
    ssrCache.delete(urlPath);
    return null;
  }
  return entry;
}

function setCachedResponse(urlPath, statusCode, html) {
  // Evict oldest entries when cache is full
  if (ssrCache.size >= SSR_CACHE_MAX_ENTRIES) {
    const oldestKey = ssrCache.keys().next().value;
    ssrCache.delete(oldestKey);
  }
  ssrCache.set(urlPath, { statusCode, html, ts: Date.now() });
}

/** Known route prefixes — anything not matching these is a 404 */
const KNOWN_ROUTES = [
  /^\/$/,
  /^\/iniciar-sesion$/,
  /^\/registro$/,
  /^\/perfil$/,
  /^\/mi-cuenta$/,
  /^\/comunidad$/,
  /^\/para-ti$/,
  /^\/admin$/,
  /^\/programacion-tv\/(series|peliculas|guia-canales|en-directo|que-ver-hoy)$/,
  /^\/programacion-tv\/ver-canal\/[^/]+$/,
  /^\/canales\/[^/]+$/,
  /^\/plataformas$/,
  /^\/contenido\/[^/]+$/,
  /^\/peliculas\/[^/]+$/,
  /^\/series\/[^/]+$/,
  /^\/programas\/[^/]+$/,
  /^\/editorial(\/.*)?$/,
  /^\/blog(\/.*)?$/,
  /^\/comparador-streaming$/,
  /^\/developers$/,
  /^\/embed$/,
  /^\/embed\/programacion$/,
  /^\/tendencias$/,
  /^\/sobre-nosotros$/,
  /^\/prensa$/,
  /^\/program-full-details\/[^/]+$/,
  /^\/avisolegal$/,
  /^\/privacidad$/,
  /^\/cookies$/,
  /^\/terminos$/,
  /^\/accesibilidad$/,
  /^\/sitemap$/,
  /^\/ver-canal\/[^/]+$/,
  /^\/detalles\/[^/]+$/,
  /^\/pelicula-details\/[^/]+$/,
];

function isKnownRoute(url) {
  const path = url.split('?')[0].split('#')[0];
  return KNOWN_ROUTES.some((re) => re.test(path));
}

app.get('*', async (req, res) => {
  const { protocol, originalUrl, headers } = req;
  const host = headers.host || `localhost:${port}`;
  const renderUrl = `${protocol}://${host}${originalUrl}`;

  // Skip cache for authenticated users (cookie-based)
  const hasAuthCookie = (req.headers.cookie || '').includes('session');
  const cachePath = originalUrl.split('?')[0];

  if (!hasAuthCookie) {
    const cached = getCachedResponse(cachePath);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
      res.setHeader('X-SSR-Cache', 'HIT');
      return res.status(cached.statusCode).send(cached.html);
    }
  }
  res.setHeader('X-SSR-Cache', 'MISS');

  if (win?.location) {
    try {
      win.location.href = renderUrl;
      if (win.document) {
        win.document._address = renderUrl;
      }
    } catch {}
  }

  try {
    const bootstrapFn = await getBootstrap();
    const SSR_TIMEOUT_MS = 5000;
    const renderStart = Date.now();
    let html = await Promise.race([
      commonEngine.render({
        bootstrap: bootstrapFn,
        documentFilePath: indexHtml,
        url: renderUrl,
        publicPath: browserDistPath,
        providers: [{ provide: REQUEST, useValue: req }],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SSR render timeout')), SSR_TIMEOUT_MS)
      ),
    ]);
    const renderMs = Date.now() - renderStart;

    if (html.includes('<app-root></app-root>')) {
      // SSR produced an empty root — serve CSR fallback.
      const fallbackFile = join(browserDistPath, 'index.html');
      const fallbackCsr = join(browserDistPath, 'index.csr.html');
      // Unknown routes get 404 status even on CSR fallback
      const statusCode = isKnownRoute(originalUrl) ? 200 : 404;
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
      const csrPath = existsSync(fallbackFile) ? fallbackFile : existsSync(fallbackCsr) ? fallbackCsr : null;
      if (csrPath) {
        const csrHtml = readFileSync(csrPath, 'utf-8');
        if (!hasAuthCookie) {
          setCachedResponse(cachePath, statusCode, csrHtml);
        }
        return res.status(statusCode).send(csrHtml);
      }
    }

    // Check for ssr-status meta marker from Angular components
    const statusMatch = html.match(/<meta\s+name="ssr-status"\s+content="(\d+)"/);
    let statusCode = statusMatch ? Number(statusMatch[1]) : 200;
    if (statusCode === 200 && !isKnownRoute(originalUrl)) {
      statusCode = 404;
    }
    // Strip the marker from final HTML
    html = html.replace(/<meta\s+name="ssr-status"\s+content="\d+"\s*\/?>/g, '');

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    if (!hasAuthCookie) {
      setCachedResponse(cachePath, statusCode, html);
    }
    res.status(statusCode).send(html);
  } catch (err) {
    console.error('[SSR] ❌ Render Error:', err);
    // Do NOT set X-Robots-Tag: noindex — CSR fallback is still indexable by Google.
    
    // 🔧 FIX: Manejo robusto del Fallback (CSR)
    // Buscamos index.html o index.csr.html
    const fallbackFile = join(browserDistPath, 'index.html');
    const fallbackCsr = join(browserDistPath, 'index.csr.html');
    
    if (existsSync(fallbackFile)) {
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(fallbackFile);
    } else if (existsSync(fallbackCsr)) {
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(fallbackCsr);
    } else {
        console.error(`❌ CRITICAL: No se encuentra index.html en ${browserDistPath}`);
        return res.status(500).send('<h1>500 - Error Interno</h1><p>No se pudo cargar la aplicación (SSR Failed & CSR missing).</p>');
    }
  }
});

const server = app.listen(port, () => {
  console.log(`🚀 SSR Server listening on http://localhost:${port}`);
});

const shutdown = (signal) => {
  console.log(`[SSR] Received ${signal}. Shutting down...`);
  server.close(() => {
    console.log('[SSR] Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[SSR] Forced shutdown.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
