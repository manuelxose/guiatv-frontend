import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Programme } from '../models/programa.interface';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private today_programs: any[] = [];
  private tomorrow_programs: any[] = [];
  private after_tomorrow_programs: any[] = [];
  private headers = new HttpHeaders({
    Accept: 'application/json',
    Authorization: 'Bearer your-token',
  });
  
  // Contador de llamadas a la base de datos
  private static databaseCallCounter = 0;

  // Flag para evitar múltiples llamadas simultáneas
  private static isLoadingData: { [key: string]: boolean } = {};

  // NUEVA PROTECCIÓN GLOBAL: Evitar múltiples inicializaciones desde diferentes componentes
  private static globalDataLoaded = false;
  private static globalDataLoading = false;

  // Hacer público para acceso directo si es necesario
  public programasSource = new BehaviorSubject<any[]>([]);
  programas$ = this.programasSource.asObservable();

  // Flag para evitar emisiones múltiples
  private isUpdating = false;

  constructor(private http: HttpClient) {}

  // metodos para conectarse a la api de guia de programacion tv

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(url, { headers: this.headers });
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body, { headers: this.headers });
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body, { headers: this.headers });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url, { headers: this.headers });
  }

  public setProgramasByDay(programas: any[], dia: string) {    switch (dia) {
      case 'today':
        this.today_programs = programas;
        break;
      case 'tomorrow':
        this.tomorrow_programs = programas;
        break;
      case 'after_tomorrow':
        this.after_tomorrow_programs = programas;
        break;
      default:
        break;
    }
  }

  public getProgramasByDay(dia: string) {
    switch (dia) {
      case 'today':
        return this.today_programs;
      case 'tomorrow':
        return this.tomorrow_programs;
      case 'after_tomorrow':
        return this.after_tomorrow_programs;
      default:
        break;
    }
    return [];
  }

  public getProgramacion(dia: string): Observable<any[]> {
    // Comprueba si estan los datos en las variables temporales
    const programas = this.getProgramasByDay(dia);
    
    if (programas && programas.length > 0) {
      console.log(`💾 CACHE - Usando datos en cache para ${dia} (NO se llama a la base de datos)`);
      return of(programas);
    }

    // Verificar si ya hay una llamada en progreso para este día
    if (HttpService.isLoadingData[dia]) {
      console.log(`⏳ ESPERANDO - Ya hay una llamada en progreso para ${dia}, esperando resultado...`);
      // Retornar un observable que espere hasta que la llamada termine
      return new Observable(subscriber => {
        const checkInterval = setInterval(() => {
          const cachedData = this.getProgramasByDay(dia);
          if (cachedData && cachedData.length > 0) {
            clearInterval(checkInterval);
            subscriber.next(cachedData);
            subscriber.complete();
          }
        }, 100);
        
        // Timeout después de 10 segundos
        setTimeout(() => {
          clearInterval(checkInterval);
          subscriber.error(new Error(`Timeout esperando datos para ${dia}`));
        }, 10000);
      });
    }

    // Marcar como cargando
    HttpService.isLoadingData[dia] = true;

    // Incrementar contador de llamadas a la base de datos
    HttpService.databaseCallCounter++;
    
    return this.http
      .get<any[]>(
        `https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app/programas/date/${dia}`
      )
      .pipe(
        tap((data) => {
          console.log(`✅ DATABASE RESPONSE #${HttpService.databaseCallCounter} - Recibidos ${data.length} programas para ${dia}`);
          this.setProgramasByDay(data, dia);
          // Limpiar el flag de carga
          HttpService.isLoadingData[dia] = false;
        }),
        catchError((error) => {
          // Limpiar el flag de carga en caso de error
          HttpService.isLoadingData[dia] = false;
          throw error;
        })
      );
  }

  public getChannel(id: string) {
    return this.http.get<any[]>(
      `https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app/canales/${id}`
    );
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
  public async setProgramas(programas: Programme[], date: string) {
    console.log('🔄 HTTP SERVICE - setProgramas llamado');
    console.log('🔍 HTTP SERVICE - Programas recibidos:', programas?.length || 0);
    console.log('🔍 HTTP SERVICE - Fecha:', date);
    console.log('🔍 HTTP SERVICE - isUpdating actual:', this.isUpdating);
    console.log('🔍 HTTP SERVICE - Estado actual del observable:', this.programasSource.value?.length || 0);
    
    // Evitar emisiones múltiples
    if (this.isUpdating) {
      console.log('⚠️ Ya se está actualizando, evitando emisión duplicada');
      return;
    }
    
    this.isUpdating = true;
    
    // Verificar si los datos son diferentes antes de emitir
    const currentValue = this.programasSource.getValue();
    const isDataDifferent = JSON.stringify(currentValue) !== JSON.stringify(programas);
    
    console.log('🔍 HTTP SERVICE - Datos son diferentes:', isDataDifferent);
    console.log('🔍 HTTP SERVICE - Valor actual:', currentValue?.length || 0);
    console.log('🔍 HTTP SERVICE - Nuevo valor:', programas?.length || 0);
    
    if (isDataDifferent) {
      console.log('✅ HTTP SERVICE - Emitiendo nuevos datos al observable');
      this.programasSource.next(programas);
      console.log('📡 HTTP SERVICE - Datos emitidos. Nuevos suscriptores recibirán:', programas?.length || 0, 'programas');
    } else {
      console.log('🔄 HTTP SERVICE - Datos idénticos, no se emite');
    }
    
    // Resetear flag después de un pequeño delay
    setTimeout(() => {
      this.isUpdating = false;
      console.log('🔓 HTTP SERVICE - Flag isUpdating reseteado');
    }, 100);
  }

  public async getProgramas() {
    return this.programas$;
  }

  public setSesionStorage(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  // metodos para conectarse a la api de tmdb

  public getPerson(person: string): Observable<any[]> {
    const url = `https://api.themoviedb.org/3/search/person?language=es-ES&query=${person}&page=1&include_adult=false`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options);
  }
  public getMovieId(movie: string): Observable<any[]> {
    const url = `https://api.themoviedb.org/3/search/movie?language=es-ES&query=${movie}&page=1&include_adult=false`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options).pipe(
      catchError((error) => {
        console.error(`🚨 SSL/HTTPS Error al obtener película "${movie}":`, error.message);
        console.warn(`⚠️ Devolviendo respuesta vacía para evitar bloqueo de la aplicación`);
        // Devolver respuesta vacía en caso de error SSL para evitar bloquear la app
        return of({ results: [] });
      })
    );
  }
  public getSeriesId(serie: string): Observable<any[]> {
    const url = `https://api.themoviedb.org/3/search/tv?language=es-ES&query=${serie}&page=1&include_adult=false`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options).pipe(
      catchError((error) => {
        console.error(`🚨 SSL/HTTPS Error al obtener serie "${serie}":`, error.message);
        console.warn(`⚠️ Devolviendo respuesta vacía para evitar bloqueo de la aplicación`);
        return of({ results: [] });
      })
    );
  }

  public getSeriesDetails(id: string) {
    const url = `https://api.themoviedb.org/3/tv/${id}?language=es-ES&page=1`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options);
  }

  public getSimilarSeries(id: string): Observable<any[]> {
    const url = `https://api.themoviedb.org/3/tv/${id}/similar?language=es-ES&page=1`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options);
  }
  public getPopularSeries(): Observable<any[]> {
    const url = `https://api.themoviedb.org/3/tv/popular?language=es-ES&page=1`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options).pipe(
      catchError((error) => {
        console.error(`🚨 SSL/HTTPS Error al obtener series populares:`, error.message);
        console.warn(`⚠️ Devolviendo respuesta vacía para evitar bloqueo de la aplicación`);
        return of({ results: [] });
      })
    );
  }

  getMovieDetails(id: string) {
    const url = `https://api.themoviedb.org/3/movie/${id}?language=es-ES&page=1`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options);
  }

  public getSimilarMovie(id: string): Observable<any[]> {
    const url = `https://api.themoviedb.org/3/movie/${id}/similar?language=es-ES&page=1`;
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options);
  }  public getPopularMovies(): Observable<any[]> {
    const url =
      'https://api.themoviedb.org/3/movie/popular?language=es-ES&page=1';
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options).pipe(
      catchError((error) => {
        console.error(`🚨 SSL/HTTPS Error al obtener películas populares:`, error.message);
        console.warn(`⚠️ Devolviendo respuesta vacía para evitar bloqueo de la aplicación`);
        return of({ results: [] });
      })
    );
  }

  /**
   * Obtiene el resumen de todas las llamadas a la base de datos
   */
  public getDatabaseCallSummary(): void {
    console.log(`📊 RESUMEN DE LLAMADAS A LA BASE DE DATOS:`);
    console.log(`🔥 Total de llamadas a la base de datos (Firebase): ${HttpService.databaseCallCounter}`);
  }

  /**
   * Reinicia el contador de llamadas a la base de datos
   */
  public resetDatabaseCallCounter(): void {
    HttpService.databaseCallCounter = 0;
    console.log(`🔄 Contador de llamadas a la base de datos reiniciado`);
  }
}