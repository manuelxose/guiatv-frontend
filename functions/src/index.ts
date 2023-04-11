import * as functions from 'firebase-functions';
import { actualizarProgramacion } from './actualizarProgramacion.js';
import { inicializarDatos } from './inicializarDatos.js';
//cambiar a import
import * as express from 'express';
import * as cors from 'cors';

const app = express();


exports.actualizarProgramacion = functions.pubsub.schedule('0 0 */5 * *')
.timeZone('Europe/Madrid')
.onRun(async (context) => {
  console.log('Actualizando la programación...');
  await actualizarProgramacion();
  console.log('Programación actualizada');
});

app.use(cors());

app.get('/inicializarDatos', async (req:any, res:any) => {
  try {
    await inicializarDatos();
    res.status(200).json({ message: 'Datos iniciales cargados correctamente.' });
  } catch (error) {
    console.error('Error al cargar los datos iniciales:', error);
    res.status(500).json({ message: 'Error al cargar los datos iniciales.' });
  }
});

exports.api = functions
.runWith({ memory: '2GB', timeoutSeconds: 540 })
.https.onRequest(app);
