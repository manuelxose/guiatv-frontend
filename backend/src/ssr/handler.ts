import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../server/config';

/**
 * Handler para Server-Side Rendering (SSR)
 * Carga el bundle generado por `ng build --ssr`
 */
export async function ssrHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  void next;
  try {
    const distFolder = config.paths.distFolder;
    const serverBundleMjs = join(distFolder, 'server', 'server.mjs');
    const serverBundleMainMjs = join(distFolder, 'server', 'main.server.mjs');
    const serverBundleJs = join(distFolder, 'server', 'main.server.js');

    const jsExists = existsSync(serverBundleJs);
    const mjsExists = existsSync(serverBundleMjs);
    const mainMjsExists = existsSync(serverBundleMainMjs);

    if (!jsExists && !mjsExists && !mainMjsExists) {
      console.warn('SSR bundle not found at', serverBundleJs, serverBundleMjs, 'or', serverBundleMainMjs);
      res
        .status(503)
        .send(
          'SSR bundle not built. Run `npm run build:ssr` in frontend and set DIST_FOLDER to dist/guiatv'
        );
      return;
    }

    // Cargar el bundle SSR
    let mod;
    try {
      if (jsExists) {
        mod = await import(serverBundleJs);
      } else if (mainMjsExists) {
        mod = await import(serverBundleMainMjs);
      } else {
        mod = await import(serverBundleMjs);
      }
    } catch (e) {
      throw e;
    }

    // Buscar el handler exportado
    const exportedReqHandler =
      mod.reqHandler ||
      (mod.default && (mod.default.reqHandler || mod.default.reqHandler?.reqHandler)) ||
      null;

    if (exportedReqHandler && typeof exportedReqHandler === 'function') {
      exportedReqHandler(req, res);
      return;
    }

    // Fallback: buscar app exportada
    const serverApp = mod.app || mod.default || mod.AppServerModule || mod;
    const expressApp = typeof serverApp === 'function' ? serverApp() : serverApp;

    if (expressApp) {
      expressApp(req, res);
      return;
    }

    // Si no encontramos nada, error
    throw new Error('No se encontró un handler SSR válido en el bundle');
  } catch (err) {
    console.error('Error loading SSR bundle:', err);
    res.status(500).send('SSR server error');
  }
}
