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
        return nuevoEstado;
      default:
        return estadoActual;
    }
  }
}
