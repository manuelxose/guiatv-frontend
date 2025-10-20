import 'zone.js/node';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// La función app exportada es usada por el servidor de desarrollo SSR
export function app(): express.Express {
  const server = express();
  const commonEngine = new CommonEngine();

  const PORT = process.env['PORT'] || 4000;

  // Para Angular 20, los archivos están directamente en dist/guiatv
  const serverDistPath = dirname(fileURLToPath(import.meta.url));
  const distFolder = resolve(serverDistPath, '..');
  const indexHtml = join(distFolder, 'index.html');

  // Servir archivos estáticos desde dist/guiatv
  server.get(
    '*.*',
    express.static(distFolder, {
      maxAge: '1y',
    })
  );

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
        publicPath: distFolder,
        providers: [
          // Los providers adicionales van aquí si son necesarios
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => {
        console.error('SSR Error:', err);
        res.status(500).send('Error rendering page');
      });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

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
