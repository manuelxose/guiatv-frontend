import * as functions from 'firebase-functions';
import { actualizarProgramacion } from './actualizarProgramacion.js';
//cambiar a import
import express from 'express';
import cors from 'cors';
import { moverCanalesEspana } from './firestore.js';
import { inicializarDatos } from './inicializarDatos.js';
import { downloadData } from './downloadData.js';

const app = express();


exports.actualizarProgramacion = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .pubsub
  .schedule('0 0 */5 * *')
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    console.log('Actualizando la programación...');
    await actualizarProgramacion();
    console.log('Programación actualizada');
  });


app.get('/inicializarDatos', async (req:any, res:any) => {
  try {
    await inicializarDatos();
    res.status(200).json({ message: 'Datos iniciales cargados correctamente.' });
  } catch (error) {
    console.error('Error al cargar los datos iniciales:', error);
    res.status(500).json({ message: 'Error al cargar los datos iniciales.' });
  }
});

app.get('/actualizarProgramacion', async (req:any, res:any) => {
  try {
    await moverCanalesEspana();
    res.status(200).json({ message: 'Programación actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la programación:', error);
    res.status(500).json({ message: 'Error al actualizar la programación.' });
  }
});


app.get('/downloadData',async(req:any,res:any) =>{
  try{
    console.log("Esto tira o no")
    await downloadData();
    res.status(200).json({message:"Se descargo el fichero Correctamente"})
  }catch(error){
    console.error("Error al actualizar la programación: ", error);
    res.status(500).json({message:"Error al actualizar la programacion."})
  }
})

app.get('/actualizarProgramacion1', async (req:any, res:any) => {
  try {
    await actualizarProgramacion();
    res.status(200).json({ message: 'Programación actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la programación:', error);
    res.status(500).json({ message: 'Error al actualizar la programación.' });
  }
});


app.use(cors());


exports.api = functions
.runWith({ memory: '2GB', timeoutSeconds: 540 })
.https.onRequest(app);
