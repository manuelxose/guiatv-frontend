/**
 * Servicio para manejo de estilos y categorías
 * Ubicación: src/app/services/program-list/category-style-manager.service.ts
 */

import { Injectable } from '@angular/core';
import { CATEGORY_COLORS, CATEGORY_DISPLAY_NAMES } from 'src/app/constants/program-list.constants';
import { ICategoryStyleManager } from 'src/app/interfaces/program-list.interface';


@Injectable({
  providedIn: 'root'
})
export class CategoryStyleManagerService implements ICategoryStyleManager {

  getCategoryBadgeClasses(categoryValue: string): string {
    if (!categoryValue) {
      return `border ${CATEGORY_COLORS.default}`;
    }
    
    // Extraer la categoría principal (primera parte antes de la coma)
    const mainCategory = this.extractMainCategory(categoryValue);
    const normalizedCategory = this.normalizeCategory(mainCategory);
    
    const colorClass = CATEGORY_COLORS[normalizedCategory as keyof typeof CATEGORY_COLORS] 
      || CATEGORY_COLORS.default;
    
    return `border ${colorClass}`;
  }

  getCategoryDisplayName(categoryValue: string): string {
    if (!categoryValue) return 'General';
    
    const mainCategory = this.extractMainCategory(categoryValue);
    const normalizedCategory = this.normalizeCategory(mainCategory);
    
    return CATEGORY_DISPLAY_NAMES[normalizedCategory as keyof typeof CATEGORY_DISPLAY_NAMES] 
      || mainCategory || 'General';
  }

  getDayButtonClasses(dayIndex: number, activeIndex: number): string {
    const baseClasses = 'px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg';
    
    if (dayIndex === activeIndex) {
      return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/50`;
    }
    
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  }

  getTimeSlotButtonClasses(timeSlot: string, activeSlot: string): string {
    const baseClasses = 'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg';
    
    if (timeSlot === activeSlot) {
      return `${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/50`;
    }
    
    return `${baseClasses} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  }

  /**
   * Genera clases para el contenedor del programa según su estado
   */
  getProgramContainerClasses(isSelected: boolean, isLive?: boolean): string {
    let classes = 'relative border-r border-gray-600/30 last:border-r-0 cursor-pointer transition-all duration-200 group overflow-hidden';
    
    if (isSelected) {
      classes += ' bg-red-600/30 border-red-500';
    } else {
      classes += ' hover:bg-red-600/20';
    }
    
    if (isLive) {
      classes += ' ring-2 ring-red-500 ring-opacity-50';
    }
    
    return classes;
  }

  /**
   * Genera clases para el indicador de tiempo actual
   */
  getCurrentTimeIndicatorClasses(): string {
    return 'absolute w-0.5 bg-gradient-to-b from-red-400 via-red-500 to-red-600 z-50 shadow-2xl shadow-red-500/50';
  }

  /**
   * Extrae la categoría principal de una string de categoría
   */
  private extractMainCategory(categoryValue: string): string {
    if (!categoryValue) return '';
    
    // Las categorías pueden venir como "Cine,Acción" o "Series,Drama"
    const parts = categoryValue.split(',');
    return parts[0]?.trim() || '';
  }

  /**
   * Normaliza una categoría para buscar en el mapping
   */
  private normalizeCategory(category: string): string {
    if (!category) return '';
    
    const normalized = category.toLowerCase().trim();
    
    // Mapear categorías en español a las claves en inglés
    const spanishToEnglish: { [key: string]: string } = {
      'cine': 'movie',
      'película': 'movie',
      'películas': 'movie',
      'series': 'series',
      'serie': 'series',
      'noticias': 'news',
      'informativo': 'news',
      'información': 'news',
      'deportes': 'sports',
      'deporte': 'sports',
      'documental': 'documentary',
      'documentales': 'documentary',
      'entretenimiento': 'entertainment',
      'variedades': 'entertainment',
      'infantil': 'kids',
      'niños': 'kids',
      'música': 'music',
      'musical': 'music',
      'estilo de vida': 'lifestyle',
      'lifestyle': 'lifestyle'
    };
    
    return spanishToEnglish[normalized] || normalized;
  }

  /**
   * Obtiene el color de texto apropiado para un fondo
   */
  getTextColorForBackground(backgroundColor: string): string {
    // Lógica simple para determinar si usar texto claro u oscuro
    return 'text-white'; // Por defecto texto blanco para nuestros fondos oscuros
  }

  /**
   * Genera clases para estado de loading
   */
  getLoadingClasses(): string {
    return 'absolute inset-0 z-30 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm';
  }

  /**
   * Genera clases para el skeleton loading
   */
  getSkeletonClasses(): string {
    return 'animate-pulse bg-gray-700 rounded';
  }
}