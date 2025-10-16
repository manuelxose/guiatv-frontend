export function diffHour(start_string: string, stop_string: string) {
  const start = new Date(start_string);
  const stop = new Date(stop_string);

  const diffMs = stop.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / 1000 / 60 / 60);
  const diffMins = Math.floor((diffMs / 1000 / 60) % 60);

  let diff = `${diffHrs}h ${diffMins}min`;
  if (diffHrs === 0) {
    diff = `${diffMins}min`;
  }

  return diff;
}

export function getHoraInicio(inicio: string) {
  //la salida de la funcion es un string con la hora de inicio del programa
  //ejemplo: 21:15 (formato 24 horas)
  //CORREGIDO: Los datos vienen con 2 horas de más, aplicamos corrección centralizada

  // Usar la utilidad centralizada para consistencia
  return formatCorrectTime(inicio);
}

export function isLive(dateIni: string, dateFin: string): boolean {
  // Obtiene la hora actual, la hora de inicio y la hora de fin

  let horaActual = new Date(); // Suma 1 hora en milisegundos (3600000 ms)
  horaActual.setHours(horaActual.getHours() + 1);
  const horaInicio = new Date(dateIni);
  const horaFin = new Date(dateFin);

  // Obtén las horas y minutos de la hora actual y las horas de inicio y fin
  if (horaActual >= horaInicio && horaActual <= horaFin) {
    return true;
  }
  return false;
}

export function truncateTitle(title: string, limit: number ): string {
  return title?.length > limit ? title.slice(0, limit) + '...' : title;
}

/**
 * Utilidad centralizada para manejo de fechas con corrección de zona horaria
 * CORREGIDO: Aplicar corrección de 2 horas para alinear con hora local española
 */
export function getCorrectTime(dateString: string): Date {
  const date = new Date(dateString);
  // Aplicar corrección de zona horaria (restar 2 horas)
  // Los datos parecen venir en UTC+2 y necesitamos mostrar hora local española
  date.setHours(date.getHours() - 2);
  return date;
}

export function getCorrectHour(dateString: string): number {
  return getCorrectTime(dateString).getHours();
}

export function formatCorrectTime(dateString: string): string {
  return getCorrectTime(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Función de debug para analizar problemas de zona horaria
 */
export function debugTimeZone(dateString: string, context: string = ''): void {
  const originalDate = new Date(dateString);
  const correctedDate = getCorrectTime(dateString);
  
  console.log(`🕐 DEBUG TIMEZONE ${context}:`);
  console.log(`   Raw string: ${dateString}`);
  console.log(`   Original UTC: ${originalDate.toISOString()}`);
  console.log(`   Original local: ${originalDate.toLocaleString('es-ES')}`);
  console.log(`   Corrected: ${correctedDate.toLocaleString('es-ES')}`);
  console.log(`   Raw hour: ${originalDate.getHours()} -> Corrected hour: ${correctedDate.getHours()}`);
  console.log('---');
}
