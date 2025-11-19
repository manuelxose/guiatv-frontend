import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../server/config';

/**
 * Handler para Server-Side Rendering (SSR)
 * Migrado desde src/v1/index.ts (función loadSsrHandler)
 */
export async function ssrHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const distFolder = config.paths.distFolder;
    const serverBundleJs = join(distFolder, 'server', 'main.js');
    const serverBundleMjs = join(distFolder, 'server', 'server.mjs');

    const jsExists = existsSync(serverBundleJs);
    const mjsExists = existsSync(serverBundleMjs);

    if (!jsExists && !mjsExists) {
      console.warn('⚠️  SSR bundle not found at', serverBundleJs, 'or', serverBundleMjs);
      res.status(503).send(
        'SSR bundle not built. Run the build step (e.g. `npm run build`) and ensure files exist in dist/guiatv/server/'
      );
      return;
    }

    // Cargar el bundle SSR
    let mod;
    try {
      if (jsExists) {
        mod = await import(serverBundleJs);
      } else {
        mod = await import(serverBundleMjs);
      }
    } catch (e) {
      throw e;
    }

    // Buscar el handler exportado
    const exportedReqHandler =
      mod.reqHandler ||
      (mod.default &&
        (mod.default.reqHandler || mod.default.reqHandler?.reqHandler)) ||
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
    console.error('❌ Error loading SSR bundle:', err);
    res.status(500).send('SSR server error');
  }
}
