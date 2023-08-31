import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Estado } from './estado.interface';

@Injectable({
  providedIn: 'root',
})
export class ReductorService {
  private state = new BehaviorSubject<Estado>({
    programas: [],
  });

  getState() {
    return this.state.asObservable();
  }

  dispatch(action: any) {
    const estadoActual = this.state.getValue();
    const nuevoEstado = this.reducer(estadoActual, action);
    console.log('Nuevo estado:', nuevoEstado); // Agrega este log para verificar el nuevo estado
    this.state.next(nuevoEstado);
  }

  reducer(estadoActual: Estado, action: any): Estado {
    switch (action.type) {
      case 'SET_PROGRAMAS':
        const programas = [...action.payload]; // Clonar el arreglo para evitar mutaciones directas

        const nuevoEstado = {
          ...estadoActual,
          programas,
        };
        console.log('Programas guardados:', nuevoEstado.programas); // Agrega este log para verificar los programas guardados
        return nuevoEstado;
      default:
        return estadoActual;
    }
  }
}
