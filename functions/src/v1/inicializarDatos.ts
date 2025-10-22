import axios from 'axios';
import { Programa, obtenerProgramacion } from './api.js';
import {
  guardarProgramasEnFirestore,
  datosInicialesCargados,
  guardarCanalesEnFirestore,
} from './firestore.js';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface ProgramaPorCanal {
  [key: string]: Programa[];
}

async function verificarDisponibilidad(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw error;
  }
}

async function downloadImage(url: string, path: string): Promise<void> {
  if (fs.existsSync(path)) {
    console.log('La imagen ya está descargada:', path);
    return;
  }
  if (await verificarDisponibilidad(url)) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(path, Buffer.from(response.data));
  } else {
    throw new Error(`Error 404: La URL ${url} no está disponible.`);
  }
}

async function uploadImageToStorage(
  storage: any,
  localPath: string,
  remotePath: string
): Promise<string> {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(remotePath);

    const [exists] = await file.exists();
    if (exists) {
      return file.publicUrl();
    }

    await bucket.upload(localPath, {
      destination: remotePath,
      public: true,
    });

    return file.publicUrl();
  } catch (error) {
    console.error('Error al subir la imagen a Firebase Storage:', error);
    return '';
  }
}

export async function inicializarDatos() {
  try {
    if (await datosInicialesCargados()) {
      console.log('Los datos iniciales ya han sido cargados previamente.');
      return;
    }

    const programacion = await obtenerProgramacion();

    if (!programacion || Object.keys(programacion).length === 0) {
      console.log('No hay datos de programación para cargar.');
      return;
    }

    const canales = Object.entries(programacion).map(
      ([nombreCanal, programas]) => ({
        name: nombreCanal,
        image: programas[0]?.chanelImage || null,
      })
    );

    const storage = admin.storage();
    for (const canal of canales) {
      if (!canal.image) continue;

      const imagePath = path.join(os.tmpdir(), `${canal.name}.png`);
      const storagePath = `canales/${canal.name}/icono.png`;

      try {
        await downloadImage(canal.image, imagePath);
        canal.image = await uploadImageToStorage(
          storage,
          imagePath,
          storagePath
        );
      } catch (error: any) {
        console.warn(
          `Error al descargar y subir la imagen del canal ${canal.name}:`,
          error.message
        );
        canal.image = null;
      }
    }

    const canalIdMap = await guardarCanalesEnFirestore(canales);
    const programacionPorCanal: ProgramaPorCanal = {};

    for (const [nombreCanal, programas] of Object.entries(programacion)) {
      const channelId = canalIdMap.get(nombreCanal);
      if (!channelId) continue;

      programacionPorCanal[nombreCanal] = programas.map((programa: any) => ({
        channelId,
        channelName: programa.channelName,
        start: programa.start,
        end: programa.end,
        title: programa.title,
        description: programa.description,
        image: programa.image,
        chanelImage: programa.chanelImage,
        programName: programa.programName,
        programImage: programa.programImage,
      }));
    }

    await guardarProgramasEnFirestore(programacionPorCanal, canalIdMap);
  } catch (error) {
    console.error(error);
  }
}
