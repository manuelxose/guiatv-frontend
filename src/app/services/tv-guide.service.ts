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
  
  // Contador de llamadas a APIs externas (TMDb)
  private static externalApiCallCounter = 0;

  // Cache flags y datos para evitar llamadas múltiples
  private static moviesCacheLoaded = false;
  private static seriesCacheLoaded = false;
  private static moviesCache: any[] = [];
  private static seriesCache: any[] = [];
  
  // Flags para prevenir ejecuciones concurrentes
  private static isLoadingMovies = false;
  private static isLoadingSeries = false;

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
    this.detallesProgramaSource.next(programa);
  }

  public getDetallesPrograma() {
    return this.detallesPrograma$;
  }
  // GESTION DE LAS PELICULAS DESTACADAS
  public async setPeliculasDestacadas() {
    // Si ya tenemos las películas en caché, usarlas
    if (TvGuideService.moviesCacheLoaded && TvGuideService.moviesCache.length > 0) {
      console.log(`💾 CACHE (Movies) - Usando datos en cache de películas destacadas (NO se llama a TMDb API)`);
      this.peliculasDestacadasSource.next(TvGuideService.moviesCache);
      return;
    }

    // Si ya se está cargando, esperar
    if (TvGuideService.isLoadingMovies) {
      console.log(`⏳ WAITING (Movies) - Ya hay una carga de películas en progreso, esperando...`);
      return;
    }

    // Marcar como cargando
    TvGuideService.isLoadingMovies = true;
    console.log(`🎬 LOADING (Movies) - Iniciando carga de películas destacadas`);

    try {
      const peliculas = await this.getBestRatedMovies();
      TvGuideService.moviesCache = peliculas;
      TvGuideService.moviesCacheLoaded = true;
      this.peliculasDestacadasSource.next(peliculas);
      console.log(`✅ CACHE SAVED (Movies) - ${peliculas.length} películas guardadas en cache`);
    } catch (error) {
      console.error(`❌ ERROR (Movies) - Error cargando películas:`, error);
    } finally {
      TvGuideService.isLoadingMovies = false;
    }
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
    // Si ya tenemos las series en caché, usarlas
    if (TvGuideService.seriesCacheLoaded && TvGuideService.seriesCache.length > 0) {
      console.log(`💾 CACHE (Series) - Usando datos en cache de series destacadas (NO se llama a TMDb API)`);
      this.seriesDestacadasSource.next(TvGuideService.seriesCache);
      return;
    }

    // Si ya se está cargando, esperar
    if (TvGuideService.isLoadingSeries) {
      console.log(`⏳ WAITING (Series) - Ya hay una carga de series en progreso, esperando...`);
      return;
    }

    // Marcar como cargando
    TvGuideService.isLoadingSeries = true;
    console.log(`📺 LOADING (Series) - Iniciando carga de series destacadas`);

    try {
      const series = await this.getBestRatedSeries();
      TvGuideService.seriesCache = series;
      TvGuideService.seriesCacheLoaded = true;
      this.seriesDestacadasSource.next(series);
      console.log(`✅ CACHE SAVED (Series) - ${series.length} series guardadas en cache`);
    } catch (error) {
      console.error(`❌ ERROR (Series) - Error cargando series:`, error);
    } finally {
      TvGuideService.isLoadingSeries = false;
    }
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
    const peliculas = this.programsByCategory('Cine')
      .filter(
        (programa: any) =>
          programa?.desc?.details !== 'Emisión de una película.'
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
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
    const movies = this.getAllMovies();
    // filtrar las películas que empiezan después de las 22:00 y no son de cine
    const moviesAfter22 = movies.filter(
      (movie) =>
        getHoraInicio(movie.start) > '22:00' &&
        movie.starRating !== null &&
        movie.title.value !== 'Cine' &&
        //no puede ser una serie el titulo no puede tener T seguido de un numero ejemplo T1 o T2 o T3 emplea expresiones regulares
        !movie.title.value.match(/T\d/)
    );

    console.log(`🎬 TMDb API - Preparando ${moviesAfter22.length} llamadas para obtener ratings de películas`);

    // obtener las calificaciones de las películas de la API
    const ratings = (await Promise.all(
      moviesAfter22.map(async (movie, index) => {
        TvGuideService.externalApiCallCounter++;
        console.log(`🔥 TMDb API CALL #${TvGuideService.externalApiCallCounter} - Obteniendo rating para: ${movie.title.value}`);
        
        const response = (await lastValueFrom(
          this.http.getMovieId(movie.title.value)
        )) as any;
        
        console.log(`✅ TMDb API RESPONSE #${TvGuideService.externalApiCallCounter} - Rating obtenido para: ${movie.title.value}`);
        return response.results[0];
      })
    )) as any[];

    console.log(`📊 TMDb API - TOTAL de llamadas realizadas hasta ahora: ${TvGuideService.externalApiCallCounter}`);

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
    const series = this.getAllSeries();
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

    console.log(`📺 TMDb API (Series) - Preparando ${seriesAfter22.length} llamadas para obtener ratings de series`);

    // obtener las calificaciones de las películas de la API
    const ratings = (await Promise.all(
      seriesAfter22.map(async (serie) => {
        TvGuideService.externalApiCallCounter++;
        const serieTitle = serie.title.value.replace(/T\d+.*/, '');
        console.log(`🔥 TMDb API CALL #${TvGuideService.externalApiCallCounter} - Obteniendo rating para serie: ${serieTitle}`);
        
        const response = (await lastValueFrom(
          this.http.getSeriesId(serieTitle)
        )) as any;
        
        console.log(`✅ TMDb API RESPONSE #${TvGuideService.externalApiCallCounter} - Rating obtenido para serie: ${serieTitle}`);
        return response.results[0];
      })
    )) as any[];

    console.log(`📊 TMDb API (Series) - TOTAL de llamadas realizadas hasta ahora: ${TvGuideService.externalApiCallCounter}`);

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

  getChannelCategories(progrmas: any[]) {
    return this.getCategoriesFromChannel(progrmas);
  }

  // Métodos genéricos para filtrar y obtener categorías únicas

  private programsByCategory(categoryType: string, category?: string) {
    //loa progrmas en lista de programas ya estan flatMap asi que no hace falta hacerlo aqui
    const peliculas = this.getListaProgramas()
      .filter((program: any) => {
        if (
          program?.category?.value?.split(',')[0] === categoryType &&
          program?.desc?.details !== 'Emisión de una película.'
        )
          return program;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
      );

    return peliculas;
  }

  private programsByChannel(channelId: string, categoryType: string) {
    return this.getListaCanales().filter(
      (programa: any) =>
        programa?.category?.value?.split(',')[0] === categoryType &&
        programa.channel.id === channelId
    );
  }

  private programsByDate(date: string, categoryType: string) {
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
  private getCategoriesFromChannel(programs: any[]) {
    return programs
      .map((programa: any) => programa?.category?.value?.split(',')[1])
      .filter((value, index, self) => self.indexOf(value) === index);
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
  }  getCableCanales() {
    return this.listaCanales.filter((canal: any) => canal.type === 'cable');
  }
  /**
   * Obtiene el resumen de todas las llamadas a APIs externas
   */
  public getExternalApiCallSummary(): void {
    console.log(`📊 RESUMEN DE LLAMADAS A APIs EXTERNAS:`);
    console.log(`🔥 Total de llamadas a TMDb API (películas y series): ${TvGuideService.externalApiCallCounter}`);
    console.log(`💾 Cache de películas cargado: ${TvGuideService.moviesCacheLoaded ? 'Sí' : 'No'} (${TvGuideService.moviesCache.length} elementos)`);
    console.log(`💾 Cache de series cargado: ${TvGuideService.seriesCacheLoaded ? 'Sí' : 'No'} (${TvGuideService.seriesCache.length} elementos)`);
  }
  /**
   * Reinicia el contador de llamadas a APIs externas (TMDb)
   */
  public resetExternalApiCallCounter(): void {
    TvGuideService.externalApiCallCounter = 0;
    // También limpiar el cache cuando se reinicia
    TvGuideService.moviesCacheLoaded = false;
    TvGuideService.seriesCacheLoaded = false;
    TvGuideService.moviesCache = [];
    TvGuideService.seriesCache = [];
    console.log(`🔄 Contador de llamadas a APIs externas reiniciado y cache limpiado`);
  }

  /**
   * Obtiene el resumen completo de todas las llamadas de red
   */
  public getCompleteCallSummary(): void {
    console.log(`\n📊 ====== RESUMEN COMPLETO DE LLAMADAS DE RED ======`);
    this.http.getDatabaseCallSummary();
    this.getExternalApiCallSummary();
    console.log(`📊 ================================================\n`);
  }
}
