import 'zone.js/node';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

/** Known route prefixes — anything not matching these is a 404 */
const KNOWN_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/iniciar-sesion$/,
  /^\/registro$/,
  /^\/mi-cuenta$/,
  /^\/comunidad$/,
  /^\/admin$/,
  /^\/programacion-tv\/(series|peliculas|guia-canales|en-directo|que-ver-hoy)$/,
  /^\/programacion-tv\/ver-canal\/[^/]+$/,
  /^\/plataformas$/,
  /^\/contenido\/[^/]+$/,
  /^\/peliculas\/[^/]+$/,
  /^\/series\/[^/]+$/,
  /^\/programas\/[^/]+$/,
  /^\/blog(\/.*)?$/,
  /^\/program-full-details\/[^/]+$/,
  /^\/avisolegal$/,
  /^\/privacidad$/,
  /^\/cookies$/,
  /^\/terminos$/,
  /^\/accesibilidad$/,
  /^\/sitemap$/,
  // Legacy redirects (handled by Angular router as redirectTo)
  /^\/ver-canal\/[^/]+$/,
  /^\/detalles\/[^/]+$/,
  /^\/pelicula-details\/[^/]+$/,
];

function isKnownRoute(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return KNOWN_ROUTES.some((re) => re.test(path));
}

// La función app exportada es usada por el servidor de desarrollo SSR
export function app(): express.Express {
  const server = express();
  const commonEngine = new CommonEngine();

  const PORT = process.env['PORT'] || 3000;

  // Para Angular 20, el output se divide en dist/guiatv/browser y dist/guiatv/server
  const serverDistPath = dirname(fileURLToPath(import.meta.url));
  const distFolder = resolve(serverDistPath, '..');
  const browserDistPath = resolve(distFolder, 'browser');
  const indexHtml = join(serverDistPath, 'index.server.html');
  const mainServerBundle = join(serverDistPath, 'main.server.mjs');

  // Servir archivos estáticos desde dist/guiatv/browser
  server.get(
    '*.*',
    express.static(browserDistPath, {
      maxAge: '1y',
    })
  );

  // 301 redirect legacy /contenido/:catalogId → slug-based route
  server.get('/contenido/:catalogId', async (req, res) => {
    const catalogId = decodeURIComponent(req.params.catalogId || '');
    if (!catalogId) {
      res.status(404).send('Not found');
      return;
    }
    try {
      const apiRes = await fetch(
        `http://localhost:4000/v2/catalog/${encodeURIComponent(catalogId)}`
      );
      if (apiRes.ok) {
        const json = await apiRes.json();
        const detailPath = json?.data?.detailPath;
        if (detailPath) {
          res.redirect(301, detailPath);
          return;
        }
      }
    } catch {
      // fall through to 404
    }
    res.status(404).send('Not found');
  });

  // Todas las rutas regulares usan el motor Universal
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const serverPort = String(PORT);

    // Evitar construir una URL con un puerto de host que no corresponde al puerto donde corre este servidor
    // Esto previene que el motor SSR haga fetch a http://localhost:4200/ cuando el proceso corre en otro puerto
    let incomingHost = headers.host || `localhost:${serverPort}`;
    const [hostname] = incomingHost.split(':');
    const hostPort = incomingHost.split(':')[1] || serverPort;

    const finalHost =
      hostPort === serverPort ? incomingHost : `${hostname}:${serverPort}`;

    const renderUrl = `${protocol}://${finalHost}${originalUrl}`;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: renderUrl,
        publicPath: browserDistPath,
        providers: [
          // Los providers adicionales van aquí si son necesarios
        ],
      })
      .then((html) => {
        // Detect SSR status code marker set by Angular components (e.g. NotFoundComponent sets 404)
        const statusMatch = html.match(/<meta\s+name="ssr-status"\s+content="(\d+)"/);
        let statusCode = statusMatch ? Number(statusMatch[1]) : 200;

        // Fallback: if no ssr-status marker, check URL against known routes
        if (statusCode === 200 && !isKnownRoute(originalUrl)) {
          statusCode = 404;
        }

        // Remove the ssr-status meta tag from the final HTML sent to clients
        const cleanHtml = html.replace(/<meta\s+name="ssr-status"\s+content="\d+"\s*\/?>/g, '');

        res.status(statusCode).send(cleanHtml);
      })
      .catch((err) => {
        console.error('SSR Error:', err);
        // Serve the static index.html as client-side fallback instead of bare error text
        res.status(500).sendFile(indexHtml, (sendErr) => {
          if (sendErr) {
            res.status(500).send('Error rendering page');
          }
        });
      });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 3000;

  // Iniciar el servidor Express
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Exportar para desarrollo con ng serve
export default app;

// Solo ejecutar si es llamado directamente
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  run();
}
