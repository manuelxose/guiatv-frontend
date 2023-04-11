import { obtenerProgramacionDeApi, Canal } from './api.js';
import { guardarCanalesEnFirestore, guardarProgramasEnFirestore } from './firestore.js';

export async function actualizarProgramacion() {
  try {
    // Obtiene la programación de TV de la API
    const programacion: any = await obtenerProgramacionDeApi();

    // Extrae la información de los canales
    const canales: Canal[] = programacion.channel.map((item:any) => {
      return {
        name: item,
        image: item,
      };
    });

    // Guarda la información de los canales en Firestore y obtiene el mapa de IDs
    const canalIdMap = await guardarCanalesEnFirestore(canales);

    // Guarda la programación en Firestore asociándola a los canales por ID
    await guardarProgramasEnFirestore(programacion, canalIdMap);

    console.log('La programación ha sido actualizada exitosamente.');
  } catch (error) {
    console.error('Error al actualizar la programación:', error);
  }
}
