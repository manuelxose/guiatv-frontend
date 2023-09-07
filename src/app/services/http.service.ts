import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AngularFirestoreCollection,
  AngularFirestore,
} from '@angular/fire/compat/firestore';
import { Programme } from '../models/programa.interface';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private _cachedData: { [key: string]: any } = {};
  private _cacheExpiry: { [key: string]: number } = {};
  private programasSource = new BehaviorSubject<any[]>([]);
  programas$ = this.programasSource.asObservable();

  ///variable temporal para no consumir recursos de la api

  // BehaviorSubject es un tipo de observable que siempre devuelve el último valor emitido

  constructor(private http: HttpClient) {
    console.log('HttpService constructor');
  }

  public async getProgramacion(dia: string) {
    const response = this.http.get<any[]>(
      `https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app/programas/date/${dia}`
    );

    return response;
  }

  // GUARDAR LA RESPUESTA EN CACHE

  public getProgramaById(id: string): any {
    const cacheKey = `${id}`;
    console.log('Cache key: ', cacheKey);
    console.log('Cache data: ', this._cachedData[cacheKey]);
    console.log('Cache expiry: ', this._cacheExpiry[cacheKey]);
    if (
      this._cachedData[cacheKey] &&
      this._cacheExpiry[cacheKey] > Date.now()
    ) {
      console.log('Cache hit');
      return of(this._cachedData[cacheKey]);
    }

    const localData = localStorage.getItem(cacheKey);
    if (localData) {
      const parsedData = JSON.parse(localData);
      this._cachedData[cacheKey] = parsedData;
      this._cacheExpiry[cacheKey] = parseInt(
        localStorage.getItem(`${cacheKey}-expiry`) || '0',
        10
      );
      return of(parsedData);
    }

    const response = this.http.get<Programme>(
      `https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app/programas/${id}`
    );

    response.subscribe((data) => {
      this._cachedData[cacheKey] = data;
      const maxCacheAge = 1000 * 60 * 60 * 24 * 1; // 1 día
      this._cacheExpiry[cacheKey] = Date.now() + maxCacheAge;
      this.setToLocalStorage(cacheKey, data);
    });

    return response;
  }

  public setToLocalStorage(key: string, value: any): void {
    const maxCacheAge = 1000 * 60 * 60 * 24 * 1; // 1 días
    localStorage.setItem(key, JSON.stringify(value));
    const currentTime = new Date().getTime();
    localStorage.setItem(`${key}-time`, currentTime.toString());
    localStorage.setItem(
      `${key}-expiry`,
      (currentTime + maxCacheAge).toString()
    );
  }

  public async setProgramas(programas: Programme[]) {
    // ESPERA A QUE SE CARGUEN LOS DATOS
    this.programasSource.next(programas);
    console.log('Los putisimos programas: ', this.programasSource);
  }
  public async getProgramas() {
    return this.programas$;
  }

  public setSesionStorage(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}
