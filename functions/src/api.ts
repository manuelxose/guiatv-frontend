import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as xml2js from 'xml2js';
import { format } from 'date-fns';
import { parseStringPromise as xml2jsParseStringPromise } from 'xml2js';
import { Storage } from '@google-cloud/storage';

const bucketName = 'guia-tv-8fe3c.appspot.com';

export interface Programacion {
  // Define la estructura de los datos de programación aquí
  id?: string;
  channel: Array<Canal>;
  programme: Array<Programa>;
}

export interface Canal {
  // Define la estructura de los datos de canales aquí
  id?: string;
  name: string;
  image: string | null;
}

export async function obtenerProgramacionDeApi(): Promise<Programacion[]> {
  // Reemplaza esta URL con la URL de la API externa
  const url =
    'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guia.xml';

  const response = await axios.get(url);
  const xml = response.data;
  const json = await xml2js.parseStringPromise(xml);
  // Extrae y devuelve la programación de TV de la respuesta
  return json.tv;
}

const app = express();
app.use(cors({ origin: true }));

export interface Programa {
  channelName: string;
  channelId: string;
  start: string;
  end: string;
  title: string;
  description: string;
  image: string;
  programImage: string;
  chanelImage: string;
  programName: string;
}

function parseXMLDate(dateStr: string): Date {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  const hour = parseInt(dateStr.slice(8, 10), 10);
  const minute = parseInt(dateStr.slice(10, 12), 10);
  const second = parseInt(dateStr.slice(12, 14), 10);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

export async function obtenerProgramacion(
  fecha?: string
): Promise<Record<string, Programa[]>> {
  // Interpretar el parámetro `fecha`: 'today' => fecha actual, else yyyyMMdd.
  const isTodayAlias = !fecha || fecha === 'today';
  let fechaValida: string;
  if (isTodayAlias) {
    fechaValida = format(new Date(), 'yyyyMMdd');
  } else {
    // Simple validación de formato yyyyMMdd
    const match = /^[0-9]{8}$/.test(fecha);
    fechaValida = match ? fecha! : format(new Date(), 'yyyyMMdd');
  }

  const nombreArchivo = `archivo_xml/${fechaValida}_archivo.xml`;

  // Leer el archivo XML desde Firebase Storage. Si no existe, intentar
  // obtenerlo desde la fuente pública y subirlo al bucket (fallback).
  const storage = new Storage();
  let xml: string;
  try {
    // download() returns [Buffer] in some client versions; destructure to be safe
    const archivoBufferArr = await storage
      .bucket(bucketName)
      .file(nombreArchivo)
      .download();
    const archivoBuffer = Array.isArray(archivoBufferArr)
      ? archivoBufferArr[0]
      : (archivoBufferArr as any);
    xml = archivoBuffer.toString();
  } catch (err: any) {
    // Si no se encuentra en Storage, intentar descargar la fuente pública
    console.warn(
      `Storage file not found (${nombreArchivo}), attempting fallback:`,
      err && err.message
    );
    const publicUrl =
      'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guia.xml';
    try {
      console.log('Attempting to download public XML from', publicUrl);
      const response = await axios.get(publicUrl, {
        responseType: 'text',
        timeout: 20000,
      });
      xml = response.data;
      console.log('Downloaded public XML, length=', xml ? xml.length : 0);
      if (!xml || typeof xml !== 'string' || xml.length < 50) {
        console.warn('Downloaded XML appears empty or too small');
      } else {
        console.log('XML sample:', String(xml).substring(0, 200));
      }

      // Intentar subir al bucket para futuros requests (best-effort)
      try {
        await storage
          .bucket(bucketName)
          .file(nombreArchivo)
          .save(Buffer.from(xml), { contentType: 'application/xml' });
        console.log(`Uploaded fallback XML to ${nombreArchivo}`);
      } catch (uploadErr: any) {
        console.warn(
          'Failed to upload fallback XML to Storage:',
          uploadErr && uploadErr.message
        );
      }
    } catch (publicErr: any) {
      console.error(
        'Failed to fetch fallback XML from public URL:',
        publicErr && publicErr.message
      );
      // Re-throw original storage error so caller can handle it
      throw err;
    }
  }

  // Parse XML into JSON with logging
  let json: any;
  try {
    json = await xml2jsParseStringPromise(xml);
    console.log('Parsed XML to JSON keys:', Object.keys(json || {}));
  } catch (parseErr: any) {
    console.error('Error parsing XML to JSON:', parseErr && parseErr.message);
    throw parseErr;
  }

  if (!json || !json.tv) {
    throw new Error('La respuesta de la API es inválida');
  }

  const canales = json.tv.channel;
  const programas = json.tv.programme;
  if (!canales || !programas) {
    console.error('Parsed JSON missing canales or programme keys', {
      keys: Object.keys(json.tv || {}),
    });
    throw new Error('La respuesta de la API no contiene canales o programas');
  }

  console.log(
    `Parsed canales count=${
      (canales && canales.length) || 0
    }, programas count=${(programas && programas.length) || 0}`
  );

  const programacion: Programa[] = [];
  console.log(programas[44]);
  programas.forEach((programa: any, index: number) => {
    // Only include programs that start on the requested date (YYYYMMDD at the
    // beginning of the `start` attribute) to avoid returning the full multi-day
    // feed which is huge.
    const startAttr = String(programa?.$.start || '');
    const startDateStr = startAttr.slice(0, 8);
    if (startDateStr !== fechaValida) {
      return; // skip programs not for the requested date
    }

    const canal = canales.find((ch: any) => ch.$.id === programa.$.channel);
    if (!canal) {
      // If channel mapping is missing, skip silently to keep payload small
      return;
    }

    const inicio = parseXMLDate(programa.$.start);
    const fin = parseXMLDate(programa.$.stop);

    const rawDesc = programa?.desc?.[0]?._ || '';
    const trimmedDesc =
      typeof rawDesc === 'string' ? rawDesc.substring(0, 500) : rawDesc;

    const programaObj: Programa = {
      channelName: canal?.['display-name']?.[0]?.['_'] || canal?.$.id,
      channelId: canal?.$.id,
      start: format(inicio, 'dd/MM/yyyy HH:mm'),
      end: format(fin, 'dd/MM/yyyy HH:mm'),
      title: programa?.title?.[0]?._,
      description: trimmedDesc,
      image: programa?.icon?.[0]?.$.src,
      programImage: programa?.['programme-image']?.[0]?.$.src,
      chanelImage: canal?.icon?.[0]?.$.src,
      programName: programa?.['title']?.[0]?._,
    };

    programacion.push(programaObj);
  });

  const programacionPorCanal = programacion.reduce(
    (acc: Record<string, Programa[]>, programa) => {
      if (!acc[programa.channelName]) {
        acc[programa.channelName] = [];
      }
      acc[programa.channelName].push(programa);
      return acc;
    },
    {}
  );

  // Log totals before returning to help diagnostics
  const totalChannels = Object.keys(programacionPorCanal).length;
  const totalPrograms = Object.values(programacionPorCanal).reduce(
    (s, arr) => s + (arr?.length || 0),
    0
  );
  console.log(
    `Returning programacion: channels=${totalChannels}, programs=${totalPrograms}`
  );

  return programacionPorCanal;
}
