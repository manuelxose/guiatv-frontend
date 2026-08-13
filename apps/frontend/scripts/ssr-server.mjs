import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
try {
  const dominoUtils = require('domino/lib/utils');
  dominoUtils.nyi = () => null;
} catch {
  // Optional compatibility patch for transitive Domino usage.
}

await import('zone.js/node');
await import('@angular/compiler');

const {
  AngularNodeAppEngine,
} = await import('@angular/ssr/node');
const {
  ɵsetAngularAppEngineManifest,
  ɵsetAngularAppManifest,
} = await import('@angular/ssr');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distFolder = process.env.FRONTEND_RELEASE_DIR
  ? resolve(process.env.FRONTEND_RELEASE_DIR)
  : resolve(__dirname, '../dist/guiatv');
const browserDistPath = join(distFolder, 'browser');
const serverDistPath = join(distFolder, 'server');
const port = Number(process.env.PORT || 3000);
const BASE_SITE_URL = 'https://guiaprogramaciontv.com';
const backendOrigin = process.env.API_ORIGIN || 'http://127.0.0.1:4000';
const backendUrl = new URL(backendOrigin);
const backendClient = backendUrl.protocol === 'https:' ? https : http;
const SSR_TIMEOUT_MS = 20000;
const SSR_CACHE_TTL_MS = 5 * 60 * 1000;
const SSR_CACHE_MAX_ENTRIES = 200;
const proxyPaths = ['/v2', '/storage', '/sitemap.xml'];
const ssrCache = new Map();

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
  /^\/deportes$/,
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

function canonicalHref(pathname) {
  return `${BASE_SITE_URL}${pathname}`;
}

function injectCanonical(html, pathname) {
  const href = canonicalHref(pathname);
  if (html.includes('rel="canonical"')) {
    return html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${href}">`);
  }
  return html.replace('</head>', `<link rel="canonical" href="${href}"></head>`);
}

function stripStatusMarker(html) {
  return html.replace(/<meta\s+name="ssr-status"\s+content="\d+"\s*\/?>/g, '');
}

function getCachedResponse(pathname) {
  const entry = ssrCache.get(pathname);
  if (!entry) return null;
  if (Date.now() - entry.ts > SSR_CACHE_TTL_MS) {
    ssrCache.delete(pathname);
    return null;
  }
  return entry;
}

function setCachedResponse(pathname, statusCode, html) {
  if (ssrCache.size >= SSR_CACHE_MAX_ENTRIES) {
    const oldestKey = ssrCache.keys().next().value;
    if (oldestKey) ssrCache.delete(oldestKey);
  }
  ssrCache.set(pathname, { statusCode, html, ts: Date.now() });
}

function getFallbackIndexPath() {
  const indexHtml = join(browserDistPath, 'index.html');
  if (existsSync(indexHtml)) return indexHtml;
  const csrHtml = join(browserDistPath, 'index.csr.html');
  return existsSync(csrHtml) ? csrHtml : null;
}

function sendCsrFallback(req, res, statusCode, cacheable = false) {
  const fallbackPath = getFallbackIndexPath();
  if (!fallbackPath) {
    res.status(500).send('<h1>500 - Error Interno</h1><p>No se pudo cargar la aplicación.</p>');
    return;
  }

  const html = injectCanonical(readFileSync(fallbackPath, 'utf-8'), req.path);
  if (cacheable) {
    setCachedResponse(req.path, statusCode, html);
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  res.status(statusCode).send(html);
}

function copyResponseHeaders(source, destination) {
  for (const [name, value] of source.headers.entries()) {
    if (name === 'content-length') continue;
    if (name === 'set-cookie') {
      destination.setHeader(name, source.headers.getSetCookie());
      continue;
    }
    destination.setHeader(name, value);
  }
}

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

async function createAngularEngine() {
  const [appManifestModule, appEngineManifestModule] = await Promise.all([
    import(pathToFileURL(join(serverDistPath, 'angular-app-manifest.mjs')).href),
    import(pathToFileURL(join(serverDistPath, 'angular-app-engine-manifest.mjs')).href),
  ]);

  ɵsetAngularAppManifest(appManifestModule.default ?? appManifestModule);
  ɵsetAngularAppEngineManifest(appEngineManifestModule.default ?? appEngineManifestModule);

  return new AngularNodeAppEngine();
}

const angularAppEngine = await createAngularEngine();
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.set('etag', 'strong');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

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

app.get('/.well-known/*', (_req, res) => {
  res.status(204).end();
});

app.get('/programacion-tv/en-directo', (_req, res) => {
  res.redirect(301, '/programacion-tv/guia-canales');
});
app.get('/blog/top10', (_req, res) => res.redirect(301, '/editorial/rankings'));
app.get('/blog/categoria/:slug', (req, res) => res.redirect(301, `/editorial/categoria/${req.params.slug}`));
app.get('/blog/:slug', (req, res) => res.redirect(301, `/editorial/${req.params.slug}`));
app.get('/blog', (_req, res) => res.redirect(301, '/editorial'));
app.get('/mi-cuenta', (_req, res) => res.redirect(301, '/perfil'));
app.get('/comunidad', (_req, res) => res.redirect(301, '/perfil'));

app.get('/contenido/:catalogId', async (req, res) => {
  const catalogId = decodeURIComponent(req.params.catalogId || '');
  if (!catalogId) return res.status(404).send('Not found');
  try {
    const apiResponse = await fetch(`${backendOrigin}/v2/catalog/${encodeURIComponent(catalogId)}`);
    if (apiResponse.ok) {
      const payload = await apiResponse.json();
      const detailPath = payload?.data?.detailPath;
      if (detailPath) return res.redirect(301, detailPath);
    }
  } catch {
    // A legacy URL whose catalog entry cannot be resolved is genuinely gone.
  }
  return res.status(404).send('Not found');
});

app.get(['/programacion-tv/ver-canal/:id', '/ver-canal/:id'], (req, res) => {
  const slug = encodeURIComponent(String(req.params.id || '').trim());
  if (!slug) return res.status(404).send('Not found');
  return res.redirect(301, `/canales/${slug}`);
});

app.get('*.*', express.static(browserDistPath, { maxAge: '1y', immutable: true }));

app.get(/\.(?:js|mjs|css|map|json|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)$/i, (_req, res) => {
  res.status(404).end();
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('*', async (req, res) => {
  const hasAuthCookie = (req.headers.cookie || '').includes('session');
  const cachePath = req.originalUrl.split('?')[0];

  if (!hasAuthCookie) {
    const cached = getCachedResponse(cachePath);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
      res.setHeader('X-SSR-Cache', 'HIT');
      return res.status(cached.statusCode).send(cached.html);
    }
  }

  res.setHeader('X-SSR-Cache', 'MISS');

  try {
    const response = await Promise.race([
      angularAppEngine.handle(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SSR render timeout')), SSR_TIMEOUT_MS)),
    ]);

    if (!response) {
      return sendCsrFallback(req, res, isKnownRoute(req.originalUrl) ? 200 : 404, !hasAuthCookie);
    }

    if (response.status >= 300 && response.status < 400) {
      copyResponseHeaders(response, res);
      return res.status(response.status).end();
    }

    const responseType = response.headers.get('content-type') || '';
    copyResponseHeaders(response, res);

    if (!responseType.includes('text/html')) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    let html = await response.text();
    let statusCode = response.status || 200;
    const statusMatch = html.match(/<meta\s+name="ssr-status"\s+content="(\d+)"/);
    if (statusMatch) {
      statusCode = Number(statusMatch[1]);
    } else if (statusCode === 200 && !isKnownRoute(req.originalUrl)) {
      statusCode = 404;
    }

    if (!html.trim() || html.includes('<app-root></app-root>')) {
      return sendCsrFallback(req, res, statusCode, !hasAuthCookie);
    }

    html = injectCanonical(stripStatusMarker(html), req.path);

    const robotsMatch = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/);
    if (robotsMatch) {
      res.setHeader('X-Robots-Tag', robotsMatch[1]);
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    if (!hasAuthCookie && statusCode < 500) {
      setCachedResponse(cachePath, statusCode, html);
    }

    return res.status(statusCode).send(html);
  } catch (err) {
    console.error('[SSR] ❌ Render Error:', err);
    return sendCsrFallback(req, res, isKnownRoute(req.originalUrl) ? 200 : 404, false);
  }
});

const server = app.listen(port, () => {
  console.log(`[SSR] Server listening on http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`[SSR] Received ${signal}. Shutting down...`);
  server.close(() => {
    console.log('[SSR] Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[SSR] Forced shutdown.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
