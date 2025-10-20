import { Programa, Canal } from './api.js';
import * as admin from 'firebase-admin';

// ... Configuración e inicialización de Firebase ...
//añadir  settings: {
//   ignoreUndefinedProperties: true,
// },
// en el archivo firebase.json
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
const autonomicos: any[] = [
  {
    nombre: 'Canal Sur Andalucía',
    comunidad: 'Andalucía',
  },
  {
    nombre: '7TV Andalucia',
    comunidad: 'Andalucía',
  },
  {
    nombre: 'Andalucía TV',
    comunidad: 'Andalucía',
  },
  {
    nombre: 'Aragón TV',
    comunidad: 'Aragón',
  },
  {
    nombre: 'IB3 RTV Illes Balears',
    comunidad: 'Baleares',
  },
  {
    nombre: 'TV Canaria',
    comunidad: 'Canarias',
  },
  {
    nombre: 'Castilla la Mancha TV',
    comunidad: 'Castilla-La Mancha',
  },
  {
    nombre: 'CYLTV',
    comunidad: 'Castilla y León',
  },
  {
    nombre: 'La 8',
    comunidad: 'Castilla y León',
  },
  {
    nombre: 'TV3',
    comunidad: 'Cataluña',
  },
  {
    nombre: 'Telemadrid',
    comunidad: 'Madrid',
  },
  {
    nombre: 'La Otra',
    comunidad: 'Madrid',
  },
  {
    nombre: 'À Punt',
    comunidad: 'Comunidad Valenciana',
  },
  {
    nombre: '8 Mediterráneo',
    comunidad: 'Comunidad Valenciana',
  },
  {
    nombre: 'Canal Extremadura',
    comunidad: 'Extremadura',
  },
  {
    nombre: 'TVG - TV Galicia',
    comunidad: 'Galicia',
  },
  {
    nombre: 'TVG 2',
    comunidad: 'Galicia',
  },
  {
    nombre: 'TVR',
    comunidad: 'La Rioja',
  },
  {
    nombre: 'La 7 Rioja',
    comunidad: 'La Rioja',
  },
  {
    nombre: '7RM',
    comunidad: 'Murcia',
  },
  {
    nombre: 'TV Murciana',
    comunidad: 'Murcia',
  },
  {
    nombre: 'Navarra Televisión',
    comunidad: 'Navarra',
  },
  {
    nombre: 'Navarra 2 TV',
    comunidad: 'Navarra',
  },
  {
    nombre: 'ETB1',
    comunidad: 'País Vasco',
  },
];
const cable = [
  'FOX',
  'FOX Life',
  'FOX Crime',
  'AXN',
  'AXN White',
  'TNT',
  'Syfy',
  'AMC',
  'HBO',
  'DARK',
  'TCM',
  'Comedy Central',
  'Calle 13',
  'Cosmo',
  'Canal Hollywood',
  'Sundance TV',
  'XTRM',
  'Somos',
];
const movistar = [
  'M+ #0',
  'M+ #Vamos',
  'M+ Estrenos',
  'M+ Estrenos 2',
  'M+ Clásicos',
  'M+ Acción',
  'M+ Comedia',
  'M+ Drama',
  'M+ Cine Español',
  'M+ Fest',
  'M+ Series',
  'M+ Series 2',
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
  // some environments may not allow settings on import-time; swallow safely
  console.warn('Could not set Firestore settings at import time:', e);
}

export async function guardarCanalesEnFirestore(
  canales: Canal[]
): Promise<Map<string, string>> {
  try {
    const canalIdMap = new Map<string, string>();

    // Comprobar si los canales ya existen
    const canalesExistentes = await db.collection('canales').get();
    const nombresCanalesExistentes = canalesExistentes.docs.map(
      (doc: any) => doc.data().name
    );

    // Dividir el array de canales en grupos de 500
    const canalesChunks: any = [];
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
    if (!canalId) {
      console.warn(
        `No se encontró el canal ${nombreCanal} en el mapa de ID de canales. No se guardarán los programas de este canal.`
      );
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
    // Obtén todos los canales
    const canalesSnapshot = await admin.firestore().collection('canales').get();

    // Verifica si existe la subcolección 'programas' en al menos un canal
    for (const canalDoc of canalesSnapshot.docs) {
      const subcolecciones = await canalDoc.ref.listCollections();
      const programasSubcoleccion = subcolecciones.find(
        (subcoleccion) => subcoleccion.id === 'programas'
      );

      if (programasSubcoleccion) {
        return true; // Si al menos un canal tiene la subcolección 'programas', retorna verdadero
      }
    }

    // Si ningún canal tiene la subcolección 'programas', retorna falso
    return false;
  } catch (error) {
    console.error(
      'Error al verificar si los datos iniciales están cargados 1:',
      error
    );
    return false;
  }
}

//una vez guardados los canales y programas, mover los que se correspondan a la coleccion canales_españa

export async function moverCanalesEspana() {
  const canalesEspaña = [
    ...tdt,
    ...movistar,
    ...cable,
    ...autonomicos.map((autonomico) => autonomico.nombre),
  ];

  try {
    const pageSize = 10; // Define el tamaño de la página
    let lastVisible: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    let hasMore = true;

    while (hasMore) {
      // Obtén los canales con paginación
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

      // Mueve los canales que contengan el nombre del array a la colección canales_españa
      for (const canalDoc of canalesSnapshot.docs) {
        // Obtener la variable name del canal
        const canalName = canalDoc.data().name;
        // Comprobar si el nombre del canal está en el array canalesEspaña
        if (canalesEspaña.includes(canalName)) {
          // Si está en el array, procesar los programas del documento
          const canalProcesado = await procesarCanales(canalDoc.data());
          // Copiar el documento procesado a la colección canales_españa
          const canalDocRef = db.collection('canales_españa').doc();
          const batch = db.batch();
          batch.set(canalDocRef, canalProcesado);
          await batch.commit();
        }
      }
    }
    // Si ningún canal tiene la subcolección 'programas', retorna falso
    return false;
  } catch (error) {
    console.error(
      'Error al verificar si los datos iniciales están cargados:',
      error
    );
    return false;
  }
}

//una vez copiado los canales en canales_españa, formatear el contenido de cada programa

async function procesarCanales(canal: any): Promise<any> {
  const canalProcesado = { ...canal };
  const clasificacion = clasificarCanal(canal.name);
  canalProcesado.tipo = clasificacion.tipo;
  if (clasificacion.tipo === 'Autonomico') {
    canalProcesado.comunidad = clasificacion.comunidad;
  }

  // Incluir el nombre del canal

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
  //el formato de fechas es de 24h la diferencia entre
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
