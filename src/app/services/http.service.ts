import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Programme } from '../models/programa.interface';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private today_programs: any[] = [];
  private tomorrow_programs: any[] = [];
  private after_tomorrow_programs: any[] = [];

  private programasSource = new BehaviorSubject<any[]>([]);
  programas$ = this.programasSource.asObservable();

  ///variable temporal para no consumir recursos de la api

  // BehaviorSubject es un tipo de observable que siempre devuelve el último valor emitido

  constructor(private http: HttpClient) {
    console.log('HttpService constructor');
  }

  public setProgramasByDay(programas: any[], dia: string) {
    switch (dia) {
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
    console.log('getProgramacion', dia);
    const programas = this.getProgramasByDay(dia);
    if (programas.length > 0) {
      return of(programas);
    } else {
      return this.http
        .get<any[]>(
          `https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app/programas/date/${dia}`
        )
        .pipe(
          tap((data) => {
            console.log('getProgramacion tap datos: ', data);
            console.log('getProgramacion tap dia: ', dia);
            this.setProgramasByDay(data, dia);
          })
        );
    }
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
    // ESPERA A QUE SE CARGUEN LOS DATOS
    this.programasSource.next(programas);
    console.log('Los putisimos programas: ', this.programasSource);
    // añadir a localstorage
  }
  public async getProgramas() {
    return this.programas$;
  }

  public setSesionStorage(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  //metodos para conectarse a la api de tmdb

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
    return this.http.get<any>(url, options);
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
    return this.http.get<any>(url, options);
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
    return this.http.get<any>(url, options);
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
  }

  public getPopularMovies(): Observable<any[]> {
    const url =
      'https://api.themoviedb.org/3/movie/popular?language=es-ES&page=1';
    const options = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8',
      }),
    };
    return this.http.get<any>(url, options);
  }
}
