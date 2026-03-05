import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // emplear un behavior subject para almacenar el programa seleccionado
  // y poder acceder a el desde cualquier componente
  private programaSource = new BehaviorSubject<any>({});
  programa$ = this.programaSource.asObservable();

  constructor() {}

  public setPrograma(programa: any) {
    this.programaSource.next(programa);
  }

  public getPrograma() {
    return this.programaSource.getValue();
  }

  public clearPrograma() {
    this.programaSource.next({});
  }
}
