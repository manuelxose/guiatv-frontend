import { Programa, Canal } from './api.js';
import * as admin from 'firebase-admin';

// ... Configuración e inicialización de Firebase ...
//añadir  settings: {
  //   ignoreUndefinedProperties: true,
  // },
// en el archivo firebase.json


admin.initializeApp();
const db = admin.firestore();
db.settings({
  ignoreUndefinedProperties: true,
});


export async function guardarCanalesEnFirestore(canales: Canal[]): Promise<Map<string, string>> {
  try {
    const canalIdMap = new Map<string, string>();

    // Comprobar si los canales ya existen
    const canalesExistentes = await db.collection('canales').get();
    const nombresCanalesExistentes = canalesExistentes.docs.map((doc: any) => doc.data().name);

    // Dividir el array de canales en grupos de 500
    const canalesChunks = [];
    for (let i = 0; i < canales.length; i += 500) {
      canalesChunks.push(canales.slice(i, i + 500));
    }

    // Guardar los canales por lotes
    for (const canalesChunk of canalesChunks) {
      const batch = db.batch();
      for (const canal of canalesChunk) {

        if (!nombresCanalesExistentes.includes(canal.name)) {
          const docRef = db.collection('canales').doc();
          canalIdMap.set(canal.name, docRef.id);
          console.log(`Guardando el canal ${canal.name} con el ID: ${docRef.id}`);
          batch.set(docRef, canal);
        }
      }
      await batch.commit();
    }

    console.log('Canales guardados en Firestore exitosamente.');
    return canalIdMap;
  } catch (error) {
    console.error('Error al guardar los canales en Firestore:', error);
    return new Map();
  }
}


// Función para guardar los programas en Firestore asociándolos a los canales por ID
// function eliminarPropiedadesUndefined(obj: any) {
//   Object.keys(obj).forEach((key) => {
//     if (obj[key] === undefined) {
//       delete obj[key];
//     }
//   });
//   return obj;
// }

// async function guardarLoteDeProgramas(programas: Programa[], canalId: string): Promise<void> {
//   try {
//     console.log(`Inicio del guardado de ${programas.length} programas para el canal con ID: ${canalId}`);
//     const lote = db.batch();
//     const programasRef = db.collection('canales').doc(canalId).collection('programas');

//     for (const programa of programas) {
//       const programaDocRef = programasRef.doc();
//       lote.set(programaDocRef, programa, { merge: true });
//     }

//     await lote.commit();
//     console.log(`Guardado exitoso de ${programas.length} programas para el canal con ID: ${canalId}`);
//   } catch (error) {
//     console.error(`Error al guardar programas para el canal con ID: ${canalId}`, error);
//   }
// }




export async function guardarProgramasEnFirestore(programacionPorCanal: Record<string, Programa[]>, canalIdMap: Map<string, string>): Promise<void> {
  for (const [nombreCanal, programas] of Object.entries(programacionPorCanal)) {
    const canalId = canalIdMap.get(nombreCanal);
    if (!canalId) {
      console.warn(`No se encontró el canal ${nombreCanal} en el mapa de ID de canales. No se guardarán los programas de este canal.`);
      continue;
    }

    // Agrupar los programas por fecha
    const programasPorFecha: Record<string, Programa[]> = {};
    for (const programa of programas) {
      const fechaInicio = programa.start.split(' ')[0].replace(/\//g, '_'); // Extraer la fecha sin la hora y reemplazar '/' con '_'
      if (!programasPorFecha[fechaInicio]) {
        programasPorFecha[fechaInicio] = [];
      }
      programasPorFecha[fechaInicio].push(programa);
    }

    // Guardar los programas agrupados por fecha en el documento del canal
    try {
      console.log(`Guardando programas para el canal ${nombreCanal} (ID: ${canalId})`);

      const canalDocRef = db.collection('canales').doc(canalId);
      const batch = db.batch();

      for (const [fecha, programasPorDia] of Object.entries(programasPorFecha)) {
        batch.update(canalDocRef, { [`programas_${fecha}`]: programasPorDia });
      }

      await batch.commit();

      console.log(`Guardado exitoso de programas para el canal ${nombreCanal}`);
    } catch (error) {
      console.error(`Error al guardar programas para el canal ${nombreCanal}:`, error);
    }
  }

  console.log('Proceso de guardado de programas en Firestore finalizado.');
}





export async function datosInicialesCargados() {
  try {
    // Obtén todos los canales
    const canalesSnapshot = await admin.firestore().collection('canales').get();

    // Verifica si existe la subcolección 'programas' en al menos un canal
    for (const canalDoc of canalesSnapshot.docs) {
      const subcolecciones = await canalDoc.ref.listCollections();
      const programasSubcoleccion = subcolecciones.find((subcoleccion) => subcoleccion.id === 'programas');

      if (programasSubcoleccion) {
        return true; // Si al menos un canal tiene la subcolección 'programas', retorna verdadero
      }
    }

    // Si ningún canal tiene la subcolección 'programas', retorna falso
    return false;
  } catch (error) {
    console.error('Error al verificar si los datos iniciales están cargados:', error);
    return false;
  }
}
