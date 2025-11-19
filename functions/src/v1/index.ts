import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { Storage } from '@google-cloud/storage';
import { existsSync } from 'fs';

const apiApp = express();
apiApp.use(cors());

// API endpoints

apiApp.get('/inicializarDatos', async (req: any, res: any) => {
  try {
    const { inicializarDatos } = await import('./inicializarDatos');
    await (inicializarDatos
      ? inicializarDatos()
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
    const { moverCanalesEspana } = await import('./firestore');
    await (moverCanalesEspana
      ? moverCanalesEspana()
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
    const { downloadData } = await import('./downloadData');
    await (downloadData
      ? downloadData()
      : Promise.reject(new Error('downloadData not found')));
    res.status(200).json({ message: 'Se descargo el fichero Correctamente' });
  } catch (error) {
    console.error('Error al actualizar la programación: ', error);
    res.status(500).json({ message: 'Error al actualizar la programacion.' });
  }
});

apiApp.get('/programas/date/:day', async (req: any, res: any) => {
  try {
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

    const apiModule = await import('./api');
    const programacion = await (apiModule.obtenerProgramacion
      ? apiModule.obtenerProgramacion(fechaParam)
      : Promise.reject(new Error('obtenerProgramacion not found')));

    let channelDataArray: any[] = [];
    if (Array.isArray(programacion)) {
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

    try {
      const storage = new Storage();
      const bucketName =
        process.env.FUNCTIONS_BUCKET || 'guia-tv-8fe3c.appspot.com';
      const filePath = `archivo_json/${fechaParam}.json`;
      const file = storage.bucket(bucketName).file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        console.log(`Precomputing and uploading ${filePath} to ${bucketName}`);
        await file.save(Buffer.from(JSON.stringify(filtered)), {
          contentType: 'application/json',
        });
      }

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
    const apiModule = await import('./api');
    const programacion = await (apiModule.obtenerProgramacion
      ? apiModule.obtenerProgramacion()
      : Promise.reject(new Error('obtenerProgramacion not found')));

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
      return res.status(200).json([]);
    }
    res.status(500).json({ error: 'Error fetching canales' });
  }
});

apiApp.get('/canales/:id', async (req: any, res: any) => {
  try {
    const requestedDay = req.query.day ? String(req.query.day) : 'today';
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

    const apiModule = await import('./api');
    const programacion = await (apiModule.obtenerProgramacion
      ? apiModule.obtenerProgramacion(fechaParam)
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
    const { actualizarProgramacion: actualizarProgramacionHandler } = await import('./actualizarProgramacion');
    await (actualizarProgramacionHandler
      ? actualizarProgramacionHandler()
      : Promise.reject(new Error('actualizarProgramacion not found')));
    res
      .status(200)
      .json({ message: 'Programación actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la programación:', error);
    res.status(500).json({ message: 'Error al actualizar la programación.' });
  }
});

// Export the Express app directly
export const api = apiApp;

// SSR function
const distFolder = join(process.cwd(), 'dist', 'guiatv');
const serverBundleJs = join(distFolder, 'server', 'main.js');
const serverBundleMjs = join(distFolder, 'server', 'server.mjs');

async function loadSsrHandler(req: any, res: any) {
  try {
    // Firebase Functions v7: No longer using runtimeConfigShim

    const jsExists = existsSync(serverBundleJs);
    const mjsExists = existsSync(serverBundleMjs);
    if (!jsExists && !mjsExists) {
      console.warn('SSR bundle not found at', serverBundleJs, 'or', serverBundleMjs);
      return res.status(503).send('SSR bundle not built. Run the build step (e.g. `npm run build`) and ensure files exist in dist/guiatv/server/');
    }

    let mod;
    try {
      if (jsExists) {
        mod = await import(serverBundleJs as any);
      } else {
        mod = await import(serverBundleMjs as any);
      }
    } catch (e) {
      throw e;
    }

    const exportedReqHandler =
      mod.reqHandler ||
      (mod.default &&
        (mod.default.reqHandler || mod.default.reqHandler?.reqHandler)) ||
      null;

    if (exportedReqHandler && typeof exportedReqHandler === 'function') {
      return exportedReqHandler(req, res);
    }

    const serverApp = mod.app || mod.default || mod.AppServerModule || mod;
    const expressApp = typeof serverApp === 'function' ? serverApp() : serverApp;
    return expressApp(req, res);

  } catch (err) {
    console.error('Error loading SSR bundle:', err);
    res.status(500).send('SSR server error');
  }
}

export const ssr = loadSsrHandler;
