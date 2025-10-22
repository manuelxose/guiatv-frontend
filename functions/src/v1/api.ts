import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as xml2js from 'xml2js';
import { format } from 'date-fns';
import { parseStringPromise as xml2jsParseStringPromise } from 'xml2js';
import { Storage } from '@google-cloud/storage';

const bucketName = 'guia-tv-8fe3c.appspot.com';

export interface Programacion {
  id?: string;
  channel: Array<Canal>;
  programme: Array<Programa>;
}

export interface Canal {
  id?: string;
  name: string;
  image: string | null;
}

export async function obtenerProgramacionDeApi(): Promise<Programacion[]> {
  const url =
    'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guia.xml';

  const response = await axios.get(url);
  const xml = response.data;
  const json = await xml2js.parseStringPromise(xml);
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
  const isTodayAlias = !fecha || fecha === 'today';
  let fechaValida: string;
  if (isTodayAlias) {
    fechaValida = format(new Date(), 'yyyyMMdd');
  } else {
    const match = /^[0-9]{8}$/.test(fecha);
    fechaValida = match ? fecha! : format(new Date(), 'yyyyMMdd');
  }

  const nombreArchivo = `archivo_xml/${fechaValida}_archivo.xml`;

  const storage = new Storage();
  let xml: string;
  try {
    const archivoBufferArr = await storage
      .bucket(bucketName)
      .file(nombreArchivo)
      .download();
    const archivoBuffer = Array.isArray(archivoBufferArr)
      ? archivoBufferArr[0]
      : (archivoBufferArr as any);
    xml = archivoBuffer.toString();
  } catch (err: any) {
    const publicUrl =
      'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guia.xml';
    try {
      const response = await axios.get(publicUrl, {
        responseType: 'text',
        timeout: 20000,
      });
      xml = response.data;
      if (xml && typeof xml === 'string' && xml.length > 50) {
        try {
          await storage
            .bucket(bucketName)
            .file(nombreArchivo)
            .save(Buffer.from(xml), { contentType: 'application/xml' });
        } catch (uploadErr: any) {
          console.warn(
            'Failed to upload fallback XML to Storage:',
            uploadErr?.message
          );
        }
      }
    } catch (publicErr: any) {
      throw err;
    }
  }

  let json: any;
  try {
    json = await xml2jsParseStringPromise(xml);
  } catch (parseErr: any) {
    throw parseErr;
  }

  if (!json || !json.tv) {
    throw new Error('La respuesta de la API es inválida');
  }

  const canales = json.tv.channel;
  const programas = json.tv.programme;
  if (!canales || !programas) {
    throw new Error('La respuesta de la API no contiene canales o programas');
  }

  const programacion: Programa[] = [];
  programas.forEach((programa: any) => {
    const startAttr = String(programa?.$.start || '');
    const startDateStr = startAttr.slice(0, 8);
    if (startDateStr !== fechaValida) {
      return;
    }

    const canal = canales.find((ch: any) => ch.$.id === programa.$.channel);
    if (!canal) return;

    const inicio = parseXMLDate(programa.$.start);
    const fin = parseXMLDate(programa.$.stop);

    const rawDesc = programa?.desc?.[0]?._ || '';
    const trimmedDesc =
      typeof rawDesc === 'string' ? rawDesc.substring(0, 500) : rawDesc;

    const programaObj: Programa = {
      channelName: canal?.['display-name']?.[0]?._ || canal?.$.id,
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

  return programacionPorCanal;
}
