import { Injectable } from '@angular/core';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class TvGuideService {
  private listaCanales: any[] = [];
  private listaProgramas: any[] = [];

  constructor(private http: HttpService) {}

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

  // GESTION DE LAS SERIES

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
  // Obtener todos los canales si es necesario

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
}
