/**
 * Servicio para filtrado de contenido
 * Ubicación: src/app/services/providers/content-filter.service.ts
 */

import { Injectable } from '@angular/core';
import { IContentFilter, ITvProgram, ILogger, ContentType } from '../../interfaces';
import { getCorrectTime, formatCorrectTime, debugTimeZone } from '../../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class ContentFilterService implements IContentFilter {
  
  constructor(private logger: ILogger) {}

  filterMovies(programs: ITvProgram[]): ITvProgram[] {
    if (!Array.isArray(programs)) {
      this.logger.warn('Invalid programs array provided to filterMovies');
      return [];
    }
    //Mostrar la estructura del primer programa para depuración
    if (programs.length > 0) {
      this.logger.debug('First program structure:', JSON.stringify(programs[5], null, 2));
    }


    const filtered = programs.filter(program => {
      const category = this.extractCategoryValue(program.category?.value);
      const title = this.extractTitle(program.title);
      
      const isMovieCategory = this.isMovieCategory(category);
      const hasValidTitle = this.hasValidMovieTitle(title);
      const isNotGeneric = this.isNotGenericMovieBlock(program);
      
      const isValid = isMovieCategory && hasValidTitle && isNotGeneric;
      
      if (isValid) {
        this.logger.debug(`Movie found: "${title}" on ${program.channel?.name}`);
      }
      
      return isValid;
    });

    this.logger.info(`Filtered ${filtered.length} movies from ${programs.length} programs`);
    return filtered;
  }

  /**
   * Filtra películas para destacadas con criterios más estrictos (horario prime time)
   */
  filterFeaturedMovies(programs: ITvProgram[]): ITvProgram[] {
    if (!Array.isArray(programs)) {
      this.logger.warn('Invalid programs array provided to filterFeaturedMovies');
      return [];
    }

    const filtered = programs.filter(program => {
      const category = this.extractCategoryValue(program.category?.value);
      const title = this.extractTitle(program.title);
      
      const isMovieCategory = this.isMovieCategory(category);
      const hasValidTitle = this.hasValidMovieTitle(title);
      const isNotGeneric = this.isNotGenericMovieBlock(program);
      const isPrimeTime = this.isPrimeTimeMovie(program);
      
      const isValid = isMovieCategory && hasValidTitle && isNotGeneric && isPrimeTime;
      
      if (isValid) {
        this.logger.debug(`Featured movie found: "${title}" on ${program.channel?.name} at ${this.formatTime(program.start)}`);
      } else if (isMovieCategory && hasValidTitle && isNotGeneric && !isPrimeTime) {
        this.logger.debug(`Movie "${title}" excluded: not in prime time (${this.formatTime(program.start)})`);
      }
      
      return isValid;
    });

    this.logger.info(`Filtered ${filtered.length} featured movies from ${programs.length} programs (prime time: 21:00-23:59)`);
    return filtered;
  }

  filterSeries(programs: ITvProgram[]): ITvProgram[] {
    if (!Array.isArray(programs)) {
      this.logger.warn('Invalid programs array provided to filterSeries');
      return [];
    }

    const filtered = programs.filter(program => {
      const category = this.extractCategoryValue(program.category?.value);
      const title = this.extractTitle(program.title);
      
      const isSeriesCategory = category === ContentType.SERIES;
      const hasValidTitle = title && title.length > 0;
      
      return isSeriesCategory && hasValidTitle;
    });

    this.logger.info(`Filtered ${filtered.length} series from ${programs.length} programs`);
    return filtered;
  }

  filterByCategory(programs: ITvProgram[], category: string): ITvProgram[] {
    if (!Array.isArray(programs)) {
      this.logger.warn('Invalid programs array provided to filterByCategory');
      return [];
    }

    if (!category?.trim()) {
      this.logger.warn('Empty category provided to filterByCategory');
      return [];
    }

    const filtered = programs.filter(program => {
      const programCategory = this.extractCategoryValue(program.category?.value);
      return programCategory === category.trim();
    });

    this.logger.info(`Filtered ${filtered.length} programs for category: ${category}`);
    return filtered;
  }

  private extractCategoryValue(categoryValue?: string): string {
    if (!categoryValue) return '';
    
    // Las categorías pueden venir como "Cine,Acción" - tomamos la primera parte
    return categoryValue.split(',')[0]?.trim() || '';
  }

  private extractTitle(title: string | { lang?: string; value: string }): string {
    if (typeof title === 'string') {
      return title;
    }
    
    return title?.value || '';
  }

  private isMovieCategory(category: string): boolean {
    const movieKeywords = ['cine', 'movie', 'película', 'film'];
    const lowerCategory = category.toLowerCase();
    
    return movieKeywords.some(keyword => lowerCategory.includes(keyword)) ||
           category === ContentType.MOVIE;
  }

  private hasValidMovieTitle(title: string): boolean {
    if (!title || title.length === 0) {
      return false;
    }

    const lowerTitle = title.toLowerCase();
    const invalidTitles = ['cine', 'película', 'movies', 'film'];
    
    return !invalidTitles.includes(lowerTitle);
  }

  private isNotGenericMovieBlock(program: ITvProgram): boolean {
    const description = program.desc?.details || program.desc?.value || '';
    const genericDescriptions = [
      'emisión de una película',
      'cine genérico',
      'programación de películas'
    ];
    
    const lowerDescription = description.toLowerCase();
    return !genericDescriptions.some(generic => lowerDescription.includes(generic));
  }

  /**
   * Verifica si la película se emite en horario prime time (21:00 a 23:59)
   */
  private isPrimeTimeMovie(program: ITvProgram): boolean {
    if (!program.start) {
      return false;
    }

    try {
      // Usar la utilidad centralizada para consistencia en el manejo de fechas
      const correctedDate = getCorrectTime(program.start);
      const rawDate = new Date(program.start);
      
      const hour = correctedDate.getHours();
      const minute = correctedDate.getMinutes();
      
      // Prime time: solo de 21:00 (9 PM) a 23:59 (11:59 PM)
      // No incluimos madrugada (00:00-05:59) ya que no es horario de máxima audiencia
      const isPrimeTime = hour >= 21 && hour <= 23;
      
      const title = this.extractTitle(program.title);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const rawTimeStr = `${rawDate.getHours().toString().padStart(2, '0')}:${rawDate.getMinutes().toString().padStart(2, '0')}`;
      
      if (title.toLowerCase().includes('ghost') || title.toLowerCase().includes('equalizer')) {
        this.logger.info(`DEBUG: Movie "${title}" - Raw time: ${rawTimeStr} -> Corrected: ${timeStr} (hour: ${hour}) - Prime time: ${isPrimeTime}`);
        this.logger.info(`DEBUG: Raw start string: ${program.start}`);
        debugTimeZone(program.start, `Movie: ${title}`);
      } else {
        this.logger.debug(`Movie "${title}" starts at ${timeStr} - Prime time: ${isPrimeTime}`);
      }
      
      return isPrimeTime;
    } catch (error) {
      this.logger.warn(`Invalid start date for program: ${program.start}`);
      return false;
    }
  }

  /**
   * Formatea la hora para logging usando corrección centralizada
   */
  private formatTime(dateString: string): string {
    try {
      return formatCorrectTime(dateString);
    } catch (error) {
      return 'hora desconocida';
    }
  }
}