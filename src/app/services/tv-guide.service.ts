import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { getHoraInicio } from '../utils/utils';
import { BehaviorSubject, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TvGuideService {
  private listaCanales: any[] = [];
  private listaProgramas: any[] = [];
  private isSerires: boolean = false;
  private isMovies: boolean = false;

  //suscriber para peliculas destacadas

  private peliculasDestacadasSource = new BehaviorSubject<any[]>([]);
  peliculasDestacadas$ = this.peliculasDestacadasSource.asObservable();

  //sucriber para series destacadas
  private seriesDestacadasSource = new BehaviorSubject<any[]>([]);
  seriesDestacadas$ = this.seriesDestacadasSource.asObservable();

  //suscriber para detalles de progrmas

  private detallesProgramaSource = new BehaviorSubject<any[]>([]);
  detallesPrograma$ = this.detallesProgramaSource.asObservable();

  constructor(private http: HttpService) {}

  // GESTION DE LOS DETALLES DE LOS PROGRMAS

  public async setDetallesPrograma(programa: any) {
    console.log('Metodo setDetallesPrograma');
    this.detallesProgramaSource.next(programa);
  }

  public getDetallesPrograma() {
    return this.detallesPrograma$;
  }

  // GESTION DE LAS PELICULAS DESTACADAS

  public async setPeliculasDestacadas() {
    console.log('Metodo setPeliculasDestacadas');
    const peliculas = await this.getBestRatedMovies();
    this.peliculasDestacadasSource.next(peliculas);
  }

  public getPeliculasDestacadas() {
    return this.peliculasDestacadas$;
  }

  public setIsMovies() {
    this.isMovies = true;
    this.isSerires = false;
  }

  public getIsMovies() {
    return this.isMovies;
  }

  // GESTION DE LAS SERIES DESTACADAS

  public async setSeriesDestacadas() {
    console.log('Metodo setSeriesDestacadas');
    const series = await this.getBestRatedSeries();
    this.seriesDestacadasSource.next(series);
  }

  public getSeriesDestacadas() {
    return this.seriesDestacadas$;
  }

  public setIsSeries() {
    this.isSerires = true;
    this.isMovies = false;
  }

  public getIsSeries() {
    return this.isSerires;
  }

  // GESTION DE LOS CANALES EN EL BEHAVIOR SUBJECT

  private setProgramsAndChannels(programs: any[]) {
    this.listaCanales = this.extractChannels(programs);
    this.listaProgramas = this.extractPrograms(programs);
  }

  public setData(programs: any[]) {
    this.setProgramsAndChannels(programs);
  }

  public getProgramsAndChannels() {
    return this.http.programas$;
  }

  private extractChannels(programs: any[]): any[] {
    return programs.flatMap((data) => data.channel);
  }

  private extractPrograms(programs: any[]): any[] {
    return programs.flatMap((data) => data.programs);
  }

  public getListaCanales() {
    return this.listaCanales;
  }

  private getListaProgramas() {
    return this.listaProgramas;
  }

  // Obtener los programas de la API

  public getFromApi() {
    return this.http.getProgramacion('today');
  }

  // GESTION DE LAS PELICULAS

  getAllMovies() {
    console.log('Metodo getAllMovies');
    const peliculas = this.programsByCategory('Cine').filter(
      (programa: any) => programa?.desc?.details !== 'Emisión de una película.'
    );
    return peliculas;
  }

  getMoviesByChannel(channelId: string) {
    return this.programsByChannel(channelId, 'Cine').filter(
      (programa: any) => programa?.title?.value !== 'Cine'
    );
  }

  getMoviesByDate(date: string) {
    return this.programsByDate(date, 'Cine').filter(
      (programa: any) => programa?.title?.value !== 'Cine'
    );
  }

  getMoviesByCategory(category: string) {
    return this.getMoviesByCategories('Cine', category);
  }

  getMoviesCategories() {
    return this.getUniqueCategories('Cine');
  }
  getProgramsByCategory(category: string, channel?: string) {
    //loa progrmas en lista de programas ya estan flatMap asi que no hace falta hacerlo aqui
    return this.getAllProgramsByCategory(category, channel);
  }

  async getBestRatedMovies() {
    console.log('Metodo getBestRatedMovies');
    const movies = this.getAllMovies();
    console.log('Peliculas: ', movies);
    // filtrar las películas que empiezan después de las 22:00 y no son de cine
    const moviesAfter22 = movies.filter(
      (movie) =>
        getHoraInicio(movie.start) > '22:00' &&
        movie.starRating !== null &&
        movie.title.value !== 'Cine' &&
        //no puede ser una serie el titulo no puede tener T seguido de un numero ejemplo T1 o T2 o T3 emplea expresiones regulares
        !movie.title.value.match(/T\d/)
    );

    // obtener las calificaciones de las películas de la API
    const ratings = (await Promise.all(
      moviesAfter22.map(async (movie) => {
        const response = (await lastValueFrom(
          this.http.getMovieId(movie.title.value)
        )) as any;
        return response.results[0];
      })
    )) as any[];

    // crear un nuevo array con las películas y sus calificaciones
    const moviesWithRatings = moviesAfter22.map((movie) => {
      // encontrar la calificación que corresponde a esta película
      const ratingData = ratings.find((rating) => {
        if (!rating) {
          return false;
        }
        return rating.title.toLowerCase() === movie.title.value.toLowerCase();
      });
      const rating = ratingData?.vote_average ?? null;
      return { ...movie, starRating: rating };
    });

    // ordenar el array por calificación de mayor a menor
    const moviesOrdered = [...moviesWithRatings].sort(
      (a, b) => b.starRating - a.starRating
    );

    // devolver las 5 primeras películas
    return moviesOrdered;
  }

  // GESTION DE LAS SERIES

  async getBestRatedSeries() {
    console.log('Metodo getBestRatedSeries');
    const series = this.getAllSeries();
    console.log('Series: ', series);
    // filtrar las películas que empiezan después de las 22:00 y no son de cine
    let seriesAfter22 = series.filter((serie: any) => {
      return (
        getHoraInicio(serie.start) > '22:00' &&
        serie.starRating !== null &&
        serie.title.value !== 'Cine'
      );
    });

    // Filtrar las series duplicadas
    seriesAfter22 = seriesAfter22.filter(
      (serie: any, index: number, self: any[]) => {
        const title = serie.title.value.replace(/T\d+.*/, '');
        return (
          index ===
          self.findIndex(
            (s: any) => s.title.value.replace(/T\d+.*/, '') === title
          )
        );
      }
    );

    // obtener las calificaciones de las películas de la API
    const ratings = (await Promise.all(
      seriesAfter22.map(async (serie) => {
        const response = (await lastValueFrom(
          this.http.getSeriesId(serie.title.value.replace(/T\d+.*/, ''))
        )) as any;
        return response.results[0];
      })
    )) as any[];

    // crear un nuevo array con las películas y sus calificaciones
    const seriesWithRatings = seriesAfter22.map((serie) => {
      // encontrar la calificación que corresponde a esta película
      const ratingData = ratings.find((rating) => {
        if (!rating) {
          return false;
        }
        return (
          rating.name.toLowerCase() ===
          serie.title.value.replace(/T\d+.*/, '').toLowerCase()
        );
      });
      const rating = ratingData?.vote_average ?? null;
      return { ...serie, starRating: rating };
    });

    // ordenar el array por calificación de mayor a menor
    const seriesOrdered = [...seriesWithRatings].sort(
      (a, b) => b.starRating - a.starRating
    );

    // devolver las 5 primeras películas
    return seriesOrdered;
  }

  getAllSeries() {
    return this.programsByCategory('Series');
  }

  getSeriesByChannel(channelId: string) {
    return this.programsByChannel(channelId, 'Series');
  }

  getSeriesByDate(date: string) {
    return this.programsByDate(date, 'Series');
  }

  getSeriesByCategory(category: string) {
    return this.getSeriesByCategories('Series', category);
  }

  getSeriesCategories() {
    return this.getUniqueCategories('Series');
  }

  getProgramsByChannel(channelName: string) {
    return this.getProgramsByChannelName(channelName);
  }

  getAllCategories() {
    return this.getMainCategories();
  }

  // Métodos genéricos para filtrar y obtener categorías únicas

  private programsByCategory(categoryType: string, category?: string) {
    //loa progrmas en lista de programas ya estan flatMap asi que no hace falta hacerlo aqui
    console.log('Metodo programsByCategory');
    const peliculas = this.getListaProgramas().filter((program: any) => {
      if (
        program?.category?.value?.split(',')[0] === categoryType &&
        program?.desc?.details !== 'Emisión de una película.'
      )
        return program;
    });

    return peliculas;
  }

  private programsByChannel(channelId: string, categoryType: string) {
    console.log('Metodo programsByChannel');
    return this.getListaCanales().filter(
      (programa: any) =>
        programa?.category?.value?.split(',')[0] === categoryType &&
        programa.channel.id === channelId
    );
  }

  private programsByDate(date: string, categoryType: string) {
    console.log('Metodo programsByDate');
    return this.getListaCanales()
      .flatMap((canal: any) => canal.programs)
      .filter(
        (programa: any) =>
          programa?.category?.value?.split(',')[0] === categoryType &&
          programa.start.split('T')[0] === date
      );
  }

  private getUniqueCategories(categoryType: string) {
    return this.getListaProgramas()
      .filter(
        (programa: any) =>
          programa?.category?.value?.split(',')[0] === categoryType &&
          programa?.desc?.details !== 'Emisión de una película.'
      )
      .map((programa: any) => programa?.category?.value?.split(',')[1])
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  private getMoviesByCategories(maincat: string, categoryType: string) {
    return this.getListaProgramas().filter((programa: any) => {
      if (
        programa?.category?.value?.split(',')[0] === maincat &&
        programa?.category?.value?.split(',')[1] === categoryType &&
        programa?.desc?.details !== 'Emisión de una película.'
      )
        return programa;
    });
    // .map((programa: any) => programa?.category?.value?.split(',')[1])
    // .filter((value, index, self) => self.indexOf(value) === index);
  }
  private getSeriesByCategories(maincat: string, categoryType: string) {
    return this.getListaProgramas().filter((programa: any) => {
      if (
        programa?.category?.value?.split(',')[0] === maincat &&
        programa?.category?.value?.split(',')[1] === categoryType
      )
        return programa;
    });
  }

  private getMainCategories() {
    return this.getListaProgramas()
      .filter((programa: any) => programa?.category?.value?.split(',')[0])
      .map((programa: any) => programa?.category?.value?.split(',')[0])
      .filter((value, index, self) => self.indexOf(value) === index);
  }
  // Obtener los programas del canal por canal name

  private getProgramsByChannelName(channelName: string) {
    return this.getListaProgramas().filter(
      (program: any) => program.channel === channelName
    );
  }

  private getAllProgramsByCategory(category: string, channel?: string) {
    //loa progrmas en lista de programas ya estan flatMap asi que no hace falta hacerlo aqui
    return this.getListaProgramas().filter((program: any) => {
      if (
        program?.category?.value?.split(',')[0] === category &&
        program.channel === channel
      )
        return program;
    });
  }

  // Otros métodos para obtener canales según el tipo (tdt, movistar, autonomico)
  getTDTCanales() {
    return this.listaCanales.filter((canal: any) => canal.type === 'tdt');
  }

  getMovistarCanales() {
    return this.listaCanales.filter((canal: any) => canal.type === 'movistar');
  }

  getAutonomicoCanales() {
    return this.listaCanales.filter(
      (canal: any) => canal.type === 'autonomico'
    );
  }
  getDeportesCanales() {
    return this.listaCanales.slice(93, 103);
  }
  getCableCanales() {
    return this.listaCanales.filter((canal: any) => canal.type === 'cable');
  }
}
