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
  //ejemplo: 12:00
  //la hora de entrada es "Tue Jan 09 2024 00:00:00 GMT+0000 (Coordinated Universal Time)" hay que sumarle 1 hora

  const horaInicio = new Date(inicio);
  horaInicio.setHours(horaInicio.getHours() - 1); // Restar 1 hora
  const horaInicioString = horaInicio.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return horaInicioString;
}
