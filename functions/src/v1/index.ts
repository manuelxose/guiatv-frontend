import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
// Avoid importing heavy modules at top-level in functions: lazy-load inside handlers
// (actualizarProgramacion, moverCanalesEspana, inicializarDatos, downloadData)
import { join } from 'path';
import { Storage } from '@google-cloud/storage';

const apiApp = express();
apiApp.use(cors());

// Scheduled function for updating programacion
exports.actualizarProgramacion = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .pubsub.schedule('0 0 */5 * *')
  .timeZone('Europe/Madrid')
  .onRun(async () => {
    console.log('Actualizando la programación... (lazy import)');
    try {
      const mod = await import('./actualizarProgramacion');
      if (mod && typeof mod.actualizarProgramacion === 'function') {
        await mod.actualizarProgramacion();
      } else {
        console.warn('actualizarProgramacion implementation not found');
      }
      console.log('Programación actualizada');
    } catch (err) {
      console.error('Error in scheduled actualizarProgramacion:', err);
      throw err;
    }
  });

// API endpoints preserved
apiApp.get('/inicializarDatos', async (req: any, res: any) => {
  try {
    const mod = await import('./inicializarDatos');
    await (mod.inicializarDatos
      ? mod.inicializarDatos()
      : Promise.reject(new Error('inicializarDatos not found')));
    res
      .status(200)
      .json({ message: 'Datos iniciales cargados correctamente.' });
  } catch (error) {
    console.error('Error al cargar los datos iniciales:', error);
    res.status(500).json({ message: 'Error al cargar los datos iniciales.' });
  }
});

apiApp.get('/actualizarProgramacion', async (req: any, res: any) => {
  try {
    const mod = await import('./firestore');
    await (mod.moverCanalesEspana
      ? mod.moverCanalesEspana()
      : Promise.reject(new Error('moverCanalesEspana not found')));
    res
      .status(200)
      .json({ message: 'Programación actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la programación:', error);
    res.status(500).json({ message: 'Error al actualizar la programación.' });
  }
});

apiApp.get('/downloadData', async (req: any, res: any) => {
  try {
    console.log('Descargando datos...');
    const mod = await import('./downloadData');
    await (mod.downloadData
      ? mod.downloadData()
      : Promise.reject(new Error('downloadData not found')));
    res.status(200).json({ message: 'Se descargo el fichero Correctamente' });
  } catch (error) {
    console.error('Error al actualizar la programación: ', error);
    res.status(500).json({ message: 'Error al actualizar la programacion.' });
  }
});

// API endpoints expected by the frontend
// Return programacion grouped by channel for a given day (e.g. 'today')
apiApp.get('/programas/date/:day', async (req: any, res: any) => {
  try {
    const api = await import('./api');

    // Map friendly aliases to yyyyMMdd. Support: 'today', 'tomorrow', 'after_tomorrow', or explicit yyyyMMdd
    const requestedDay =
      req.params && req.params.day ? String(req.params.day) : 'today';
    function toYyyyMmDd(offsetDays = 0) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}${m}${dd}`;
    }

    let fechaParam: string;
    if (requestedDay === 'today') fechaParam = toYyyyMmDd(0);
    else if (requestedDay === 'tomorrow') fechaParam = toYyyyMmDd(1);
    else if (requestedDay === 'after_tomorrow') fechaParam = toYyyyMmDd(2);
    else if (/^[0-9]{8}$/.test(requestedDay)) fechaParam = requestedDay;
    else fechaParam = toYyyyMmDd(0);

    const programacion = await (api.obtenerProgramacion
      ? api.obtenerProgramacion(fechaParam)
      : Promise.reject(new Error('obtenerProgramacion not found')));

    // The frontend (FirebaseProgramProvider) expects an array of channel
    // entries of the shape: { channel: { id, name, icon }, programs: [...] }
    // Our obtenerProgramacion currently returns a Record<channelName, Programa[]>
    // so convert that map into the expected array shape.
    let channelDataArray: any[] = [];
    if (Array.isArray(programacion)) {
      // If for some reason obtenerProgramacion returned an array of programs,
      // group them by channelName into the expected structure.
      const grouped: Record<string, any[]> = {};
      (programacion as any[]).forEach((p: any) => {
        const name = p?.channelName || p?.channel?.name || 'unknown';
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(p);
      });
      channelDataArray = Object.keys(grouped).map((name) => {
        const items = grouped[name];
        const sample = items[0] || {};
        return {
          channel: {
            id: sample.channelId || name,
            name,
            icon: sample.chanelImage || sample.image || '',
          },
          programs: items.map((it: any, i: number) => ({
            id: it.id || undefined,
            title: it.title || it.programName || '',
            start: it.start,
            end: it.end || it.stop,
            stop: it.end || it.stop,
            desc: it.description || '',
            category: it.category,
          })),
        };
      });
    } else {
      channelDataArray = Object.keys(programacion || {}).map((channelName) => {
        const items = programacion[channelName] || [];
        const sample = items[0] || {};
        return {
          channel: {
            id: sample.channelId || channelName,
            name: channelName,
            icon: sample.chanelImage || sample.image || null,
          },
          programs: items.map((it: any) => ({
            id: (it as any).id || undefined,
            title: it.title || it.programName || '',
            start: it.start,
            end: it.end || it.stop,
            stop: it.end || it.stop,
            desc: it.description || '',
            category: it.category,
          })),
        };
      });
    }

    // Remove any malformed entries that would break the frontend (missing
    // channel.id or missing programs array). Log counts for diagnostics.
    const beforeCount = channelDataArray.length;
    const filtered = channelDataArray.filter((ch) => {
      try {
        return (
          ch &&
          ch.channel &&
          (typeof ch.channel.id === 'string' || ch.channel.id != null) &&
          Array.isArray(ch.programs)
        );
      } catch (e) {
        return false;
      }
    });
    const afterCount = filtered.length;
    console.log(
      `/programas/date/:day - channels before=${beforeCount}, after=${afterCount}`
    );

    // Attempt to precompute JSON in Cloud Storage and return a small manifest
    // with a signed URL. If anything fails, fall back to returning the inline
    // filtered array for backward compatibility.
    try {
      const storage = new Storage();
      const bucketName =
        process.env.FUNCTIONS_BUCKET || 'guia-tv-8fe3c.appspot.com';
      const filePath = `archivo_json/${fechaParam}.json`;
      const file = storage.bucket(bucketName).file(filePath);

      // If file doesn't exist, write it (best-effort)
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`Precomputing and uploading ${filePath} to ${bucketName}`);
        await file.save(Buffer.from(JSON.stringify(filtered)), {
          contentType: 'application/json',
        });
      }

      // Generate a signed URL valid for 6 hours
      const expires = Date.now() + 1000 * 60 * 60 * 6;
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires });

      const channelsSummary = filtered.map((ch) => ({
        id: ch.channel.id,
        name: ch.channel.name,
        image: ch.channel.icon || ch.channel.image || null,
      }));

      return res.status(200).json({
        jsonUrl: signedUrl,
        channels: channelsSummary,
        cached: exists,
      });
    } catch (e) {
      console.warn(
        'Failed to precompute or sign URL, falling back to inline response',
        (e as any)?.message || String(e)
      );
      return res.status(200).json(filtered);
    }
  } catch (err: any) {
    console.error('Error in /programas/date/:day', err);
    const message = err && (err.message || String(err));
    const isNotFound =
      err &&
      (err.code === 404 ||
        /not found|No such object|No such file/i.test(message));
    if (isNotFound) {
      return res.status(200).json([]);
    }
    res.status(500).json({ error: 'Error fetching programacion' });
  }
});

apiApp.get('/canales', async (req: any, res: any) => {
  try {
    const api = await import('./api');
    const programacion = await (api.obtenerProgramacion
      ? api.obtenerProgramacion()
      : Promise.reject(new Error('obtenerProgramacion not found')));

    // derive canales list from programacion keys and first-item metadata
    const canales = Object.keys(programacion).map((channelName) => {
      const items = programacion[channelName] || [];
      const sample = items[0] || {};
      return {
        id: sample.channelId || channelName,
        name: channelName,
        image: sample.chanelImage || null,
      };
    });

    res.status(200).json(canales);
  } catch (err: any) {
    console.error('Error in /canales', err);
    const message = err && (err.message || String(err));
    const isNotFound =
      err &&
      (err.code === 404 ||
        /not found|No such object|No such file/i.test(message));
    if (isNotFound) {
      // Same as above: respond 200 with empty array for channels when missing.
      return res.status(200).json([]);
    }
    res.status(500).json({ error: 'Error fetching canales' });
  }
});

// Return programs for a specific channel id or normalized name
apiApp.get('/canales/:id', async (req: any, res: any) => {
  try {
    const api = await import('./api');
    const requestedDay = req.query.day ? String(req.query.day) : 'today';
    // convert same aliases as above
    function toYyyyMmDd(offsetDays = 0) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}${m}${dd}`;
    }
    let fechaParam: string;
    if (requestedDay === 'today') fechaParam = toYyyyMmDd(0);
    else if (requestedDay === 'tomorrow') fechaParam = toYyyyMmDd(1);
    else if (requestedDay === 'after_tomorrow') fechaParam = toYyyyMmDd(2);
    else if (/^[0-9]{8}$/.test(requestedDay)) fechaParam = requestedDay;
    else fechaParam = toYyyyMmDd(0);

    const programacion = await (api.obtenerProgramacion
      ? api.obtenerProgramacion(fechaParam)
      : Promise.reject(new Error('obtenerProgramacion not found')));

    const id = String(req.params.id || '').toLowerCase();
    const allPrograms: any[] = Array.isArray(programacion)
      ? programacion
      : Object.values(programacion || {}).flat();

    const normalize = (s: any) =>
      String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const byId = allPrograms.filter((p: any) => {
      if (!p) return false;
      if (String(p.channelId || '').toLowerCase() === id) return true;
      if (normalize(p.channelName) === id) return true;
      if (normalize(p.channel?.name) === id) return true;
      return false;
    });

    res.status(200).json(byId);
  } catch (err: any) {
    console.error('Error in /canales/:id', err);
    const message = err && (err.message || String(err));
    const isNotFound =
      err &&
      (err.code === 404 ||
        /not found|No such object|No such file/i.test(message));
    if (isNotFound) {
      return res.status(200).json([]);
    }
    res.status(500).json({ error: 'Error fetching canales' });
  }
});

apiApp.get('/actualizarProgramacion1', async (req: any, res: any) => {
  try {
    const mod = await import('./actualizarProgramacion');
    await (mod.actualizarProgramacion
      ? mod.actualizarProgramacion()
      : Promise.reject(new Error('actualizarProgramacion not found')));
    res
      .status(200)
      .json({ message: 'Programación actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la programación:', error);
    res.status(500).json({ message: 'Error al actualizar la programación.' });
  }
});

exports.api = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .https.onRequest(apiApp);

// Backwards-compatibility: some clients expect a function named `app`.
// Provide an alias so requests to /app/... (existing deployed clients) are
// handled by the same Express app (and therefore the same CORS middleware).
// This keeps the deployed surface backward-compatible without changing routes.
// Note: the compiled output will include `exports.app = exports.api`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(exports as any).app = (exports as any).api;

// SSR function: delegate to the server bundle placed at functions/dist/guiatv
const distFolder = join(process.cwd(), 'dist', 'guiatv');
const serverBundleJs = join(distFolder, 'server', 'main.js');
const serverBundleMjs = join(distFolder, 'server', 'server.mjs');

let ssrFunction: any = null;

async function loadSsr() {
  if (ssrFunction) return ssrFunction;
  try {
    let mod;
    try {
      mod = await import(serverBundleJs as any);
    } catch (e) {
      mod = await import(serverBundleMjs as any);
    }

    // Preferred: the server bundle may export a request handler (e.g. `reqHandler`) created
    // with `createNodeRequestHandler(app)` from @angular/ssr/node. Use it when available.
    const exportedReqHandler =
      mod.reqHandler ||
      // sometimes default export wraps the handler
      (mod.default &&
        (mod.default.reqHandler || mod.default.reqHandler?.reqHandler)) ||
      null;

    if (exportedReqHandler && typeof exportedReqHandler === 'function') {
      ssrFunction = functions
        .runWith({ memory: '1GB', timeoutSeconds: 540 })
        .https.onRequest(exportedReqHandler as any);
      return ssrFunction;
    }

    // Fallbacks: the bundle might export an express `app`, a factory that returns an app,
    // or the module might itself be the express handler.
    const serverApp = mod.app || mod.default || mod.AppServerModule || mod;

    // If serverApp is a function returning an express app or an express handler
    const expressApp =
      typeof serverApp === 'function' ? serverApp() : serverApp;

    ssrFunction = functions
      .runWith({ memory: '1GB', timeoutSeconds: 540 })
      .https.onRequest(expressApp as any);

    return ssrFunction;
  } catch (err) {
    console.error('Error loading SSR bundle:', err);
    throw err;
  }
}

exports.ssr = functions.https.onRequest(async (req: any, res: any) => {
  try {
    const fn = await loadSsr();
    return fn(req, res);
  } catch (err) {
    console.error('SSR invocation error:', err);
    res.status(500).send('SSR server error');
  }
});
