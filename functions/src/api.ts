import * as express from 'express';
import * as cors from 'cors';
import axios from 'axios';
import * as xml2js from 'xml2js';
import {  format } from 'date-fns';


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
  image: string |null;
}

export async function obtenerProgramacionDeApi(): Promise<Programacion[]> {
  // Reemplaza esta URL con la URL de la API externa
  const url = 'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guia.xml';

  const response = await axios.get(url);
  const xml = response.data;
  const json = await xml2js.parseStringPromise(xml);
  // Extrae y devuelve la programación de TV de la respuesta
  return json.tv;
}

const app = express();
app.use(cors({ origin: true}));

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

export async function obtenerProgramacion(url: string, pais: string): Promise<Record<string, Programa[]>> {
  const response = await axios.get(url);
  const xml = response.data;
  const json = await xml2js.parseStringPromise(xml);

  if (!json || !json.tv) {
    throw new Error('La respuesta de la API es inválida');
  }

  const canales = json.tv.channel;
  const programas = json.tv.programme;

  if (!canales || !programas) {
    throw new Error('La respuesta de la API no contiene canales o programas');
  }

  // const hoy = new Date();
  // const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);

  const programacion: Programa[] = [];

  programas.forEach((programa: any, index: number) => {
    const canal = canales.find((ch: any) => ch.$.id === programa.$.channel);
    if (!canal) {
      console.log(`No se encontró el canal para el programa ${index}`);
      return;
    }

    const inicio = parseXMLDate(programa.$.start);
    const fin = parseXMLDate(programa.$.stop);

    const programaObj: Programa = {
      channelName: canal['display-name']?.[0]?._ || canal.$.id,
      channelId: canal.$.id,
      start: format(inicio, 'dd/MM/yyyy HH:mm'),
      end: format(fin, 'dd/MM/yyyy HH:mm'),
      title: programa.title?.[0]?._,
      description: programa.desc?.[0]?._,
      image: programa.icon?.[0]?.$.src,
      programImage: programa['programme-image']?.[0]?.$.src,
      chanelImage: canal.icon?.[0]?.$.src,
      programName: programa['title']?.[0]?._,
    };

    // Add the program to the array only if it starts on today or tomorrow

    programacion.push(programaObj);

  });

  const programacionPorCanal = programacion.reduce((acc: Record<string, Programa[]>, programa) => {
    if (!acc[programa.channelName]) {
      acc[programa.channelName] = [];
    }
    acc[programa.channelName].push(programa);
    return acc;
  }, {});

  return programacionPorCanal;
}









