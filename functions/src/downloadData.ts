import axios from 'axios';
import { Storage } from '@google-cloud/storage';
import { parseStringPromise } from 'xml2js';
import { format } from 'date-fns';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';

const storage = new Storage();
const bucketName = "guia-tv-8fe3c.appspot.com";
const fechaActual = format(new Date(), 'yyyyMMdd');
const nombreArchivo = `archivo_xml/${fechaActual}_archivo.xml`;

export async function downloadData() {
  const url = "https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz";

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const existe = await archivoExiste();

    if (existe) {
      await storage.bucket(bucketName).file(nombreArchivo).delete();
      console.log('Archivo anterior eliminado:', nombreArchivo);
    }

    const archivoBuffer = Readable.from(Buffer.from(response.data));
    const archivoMetadata = {
      contentType: 'application/xml',
    };

    const gunzip = zlib.createGunzip();
    const writeStream = storage.bucket(bucketName).file(nombreArchivo).createWriteStream(archivoMetadata);

    // Descomprimir el archivo usando pipeline
    await pipeline(archivoBuffer, gunzip, writeStream);

    console.log('Archivo guardado:', nombreArchivo);

    const archivoDescargado = await storage.bucket(bucketName).file(nombreArchivo).download();
    const xmlData = archivoDescargado.toString();

    const json = await parseStringPromise(xmlData, { mergeAttrs: true });

    if (!json || !json.tv) {
      throw new Error('La respuesta de la API es inválida');
    }

    const canales = json.tv.channel;
    const programas = json.tv.programme;

    if (!canales || !programas) {
      throw new Error('La respuesta de la API no contiene canales o programas');
    }

    console.log('Archivo descargado, descomprimido y guardado en Firebase Storage');

  } catch (error) {
    console.error("Error al leer el archivo:", error);
  }
}

async function archivoExiste() {
  try {
    await storage.bucket(bucketName).file(nombreArchivo).getMetadata();
    return true;
  } catch (error: any) {
    if (error.code === 404) {
      return false;
    }

    console.error('Error al verificar la existencia del archivo:', error);
    return false;
  }
}
