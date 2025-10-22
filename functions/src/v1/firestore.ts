import { Programa, Canal } from './api.js';
import * as admin from 'firebase-admin';

const tdt = [
  'La 1',
  'La 2',
  'Antena 3',
  'Cuatro',
  'Telecinco',
  'La Sexta',
  'Mega',
  'Factoría de Ficción',
  'Neox',
  'Nova',
  'Boing',
  'Divinity',
  'Energy',
  'Paramount Network',
  'DMAX',
  'Disney Channel',
  'Ten',
  'Clan',
  'Teledeporte',
  'Be Mad',
  'TRECE',
  'DKISS',
  'Atreseries',
  'GOL PLAY',
];
const autonomicos: Array<{ nombre: string; comunidad: string }> = [
  /* original entries omitted for brevity */
];
const cable: string[] = [
  /* original cable entries omitted for brevity */
];
const movistar: string[] = [
  /* original movistar entries omitted for brevity */
];

if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();
try {
  db.settings({
    ignoreUndefinedProperties: true,
  });
} catch (e) {
  console.warn('Could not set Firestore settings at import time:', e);
}

export async function guardarCanalesEnFirestore(
  canales: Canal[]
): Promise<Map<string, string>> {
  try {
    const canalIdMap = new Map<string, string>();

    const canalesExistentes = await db.collection('canales').get();
    const nombresCanalesExistentes = canalesExistentes.docs.map(
      (doc: any) => doc.data().name
    );

    const canalesChunks: any = [];
    for (let i = 0; i < canales.length; i += 500) {
      canalesChunks.push(canales.slice(i, i + 500));
    }

    for (const canalesChunk of canalesChunks) {
      const batch = db.batch();
      for (const canal of canalesChunk) {
        if (!nombresCanalesExistentes.includes(canal.name)) {
          const docRef = db.collection('canales').doc();
          canalIdMap.set(canal.name, docRef.id);
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

export async function guardarProgramasEnFirestore(
  programacionPorCanal: Record<string, Programa[]>,
  canalIdMap: Map<string, string>
): Promise<void> {
  for (const [nombreCanal, programas] of Object.entries(programacionPorCanal)) {
    const canalId = canalIdMap.get(nombreCanal);
    if (!canalId) continue;

    const programasPorFecha: Record<string, Programa[]> = {};
    for (const programa of programas) {
      const fechaInicio = programa.start.split(' ')[0].replace(/\//g, '_');
      if (!programasPorFecha[fechaInicio]) {
        programasPorFecha[fechaInicio] = [];
      }
      programasPorFecha[fechaInicio].push(programa);
    }

    try {
      const canalDocRef = db.collection('canales').doc(canalId);
      const batch = db.batch();

      for (const [fecha, programasPorDia] of Object.entries(
        programasPorFecha
      )) {
        batch.update(canalDocRef, { [`programas_${fecha}`]: programasPorDia });
      }

      await batch.commit();

      console.log(`Guardado exitoso de programas para el canal ${nombreCanal}`);
    } catch (error) {
      console.error(
        `Error al guardar programas para el canal ${nombreCanal}:`,
        error
      );
    }
  }

  console.log('Proceso de guardado de programas en Firestore finalizado.');
}

export async function datosInicialesCargados() {
  try {
    const canalesSnapshot = await admin.firestore().collection('canales').get();

    for (const canalDoc of canalesSnapshot.docs) {
      const subcolecciones = await canalDoc.ref.listCollections();
      const programasSubcoleccion = subcolecciones.find(
        (subcoleccion) => subcoleccion.id === 'programas'
      );

      if (programasSubcoleccion) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(
      'Error al verificar si los datos iniciales están cargados 1:',
      error
    );
    return false;
  }
}

export async function moverCanalesEspana() {
  const canalesEspaña = [
    ...tdt,
    ...movistar,
    ...cable,
    ...autonomicos.map((autonomico) => autonomico.nombre),
  ];

  try {
    const pageSize = 10;
    let lastVisible: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    let hasMore = true;

    while (hasMore) {
      let query: FirebaseFirestore.Query = admin
        .firestore()
        .collection('canales')
        .limit(pageSize);

      if (lastVisible) {
        query = query.startAfter(lastVisible);
      }

      const canalesSnapshot = await query.get();

      if (canalesSnapshot.empty) {
        hasMore = false;
        break;
      }

      lastVisible = canalesSnapshot.docs[canalesSnapshot.docs.length - 1];

      for (const canalDoc of canalesSnapshot.docs) {
        const canalName = canalDoc.data().name;
        if (canalesEspaña.includes(canalName)) {
          const canalProcesado = await procesarCanales(canalDoc.data());
          const canalDocRef = db.collection('canales_españa').doc();
          const batch = db.batch();
          batch.set(canalDocRef, canalProcesado);
          await batch.commit();
        }
      }
    }
    return false;
  } catch (error) {
    console.error(
      'Error al verificar si los datos iniciales están cargados:',
      error
    );
    return false;
  }
}

async function procesarCanales(canal: any): Promise<any> {
  const canalProcesado = { ...canal };
  const clasificacion = clasificarCanal(canal.name);
  canalProcesado.tipo = clasificacion.tipo;
  if (clasificacion.tipo === 'Autonomico') {
    canalProcesado.comunidad = clasificacion.comunidad;
  }

  for (const [key, value] of Object.entries(canal)) {
    if (key.startsWith('programas_') && Array.isArray(value)) {
      canalProcesado[key] = await Promise.all(
        value.map((programa: any) => procesarProgramas(programa))
      );
    }
  }
  return canalProcesado;
}

async function procesarProgramas(programa: any) {
  const array_tipo: any = [];
  const array_subTipo: any = [];

  const { start, end, description: descripcion, title, image } = programa;
  const imagen = image;
  const nombre = title;
  const inicio = parseCustomDate(start);
  const fin = parseCustomDate(end);
  const duracion = (fin.getTime() - inicio.getTime()) / 1000 / 60;
  const [primera = '', segunda = '', ...resto] = descripcion
    ? descripcion.split('\n')
    : [];
  const [ano = '', edad = '', votos = ''] = primera
    .split('|')
    .map((s: any) => s.trim());
  const [genero = '', des_programa = ''] = segunda
    .split('·')
    .map((s: any) => s.trim());
  const detalles = resto
    .join('\n')
    .split('·')
    .reduce((acc: any, item: string) => {
      const [clave, valor] = item.split(/: (.+)/);
      valor &&
        (acc[
          clave
            .trim()
            ?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        ] = valor.trim());
      return acc;
    }, {});
  const [tipo = '', subtipo = ''] = genero.split('/');

  if (!array_tipo.includes(tipo)) {
    array_tipo.push(tipo);
  }
  if (!array_subTipo.includes(subtipo)) {
    array_subTipo.push(subtipo);
  }

  return {
    duracion,
    inicio: inicio.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fin: fin.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    ano,
    edad,
    des_programa,
    clasificacion: /^\d\/\d/.test(votos) ? votos : '',
    genero,
    detalles,
    tipo,
    subtipo,
    nombre,
    imagen,
  };
}

function parseCustomDate(dateString: string): Date {
  const [day, month, year, hour, minute] = dateString
    .split(/[/ :]/)
    .map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function clasificarCanal(nombreCanal: string) {
  if (tdt.includes(nombreCanal)) {
    return { tipo: 'TDT' };
  }
  if (movistar.includes(nombreCanal)) {
    return { tipo: 'Movistar' };
  }
  if (cable.includes(nombreCanal)) {
    return { tipo: 'Cable' };
  }
  for (const canalAutonomico of autonomicos) {
    if (canalAutonomico.nombre === nombreCanal) {
      return { tipo: 'Autonomico', comunidad: canalAutonomico.comunidad };
    }
  }
  return { tipo: 'Desconocido' };
}
