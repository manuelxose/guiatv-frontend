import { downloadData } from './downloadData';
import { moverCanalesEspana } from './firestore';
import { inicializarDatos } from './inicializarDatos';
const admin = require('firebase-admin');

async function borrarDocumentos(coleccion: string) {
  const db = admin.firestore();
  const documentosSnapshot = await db.collection(coleccion).get();

  const batchSize = 100;
  let batchArray: any = [];
  let batchIndex = 0;

  for (const doc of documentosSnapshot.docs) {
    if (!batchArray[batchIndex]) {
      batchArray[batchIndex] = db.batch();
    }
    batchArray[batchIndex].delete(doc.ref);

    if (batchArray[batchIndex]._ops.length >= batchSize) {
      batchIndex++;
    }
  }

  for (const batch of batchArray) {
    await batch.commit();
  }
}

export async function actualizarProgramacion() {
  // Borrar todos los documentos de la colección canales
  await borrarDocumentos('canales');

  // Borrar todos los documentos de la colección canales_espana
  await borrarDocumentos('canales_españa');

  //Descarga el fichero de la web
  await downloadData();

  // Llama a la función inicializarDatos()
  await inicializarDatos();

  // Llama a la función moverCanalesEspana()
  await moverCanalesEspana();
}
