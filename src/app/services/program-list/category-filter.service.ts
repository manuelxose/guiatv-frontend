/**
 * CategoryFilterService - Servicio para gestión de filtros de categorías
 * Ubicación: src/app/services/program-list/category-filter.service.ts
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo gestiona filtros de categorías
 * - Open/Closed: Extensible para nuevos tipos de filtros
 * - Interface Segregation: Interfaces específicas para cada responsabilidad
 * - Dependency Inversion: Depende de abstracciones, no implementaciones concretas
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ITvProgram, ICategory } from 'src/app/interfaces';

/**
 * Interface para el contrato del servicio de filtros de categoría
 */
export interface ICategoryFilterService {
  // Estado reactivo
  selectedCategory$: Observable<string | null>;
  availableCategories$: Observable<string[]>;
  filteredPrograms$: Observable<ITvProgram[]>;
  
  // Métodos de gestión
  selectCategory(category: string): void;
  clearCategoryFilter(): void;
  updatePrograms(programs: ITvProgram[]): void;
  
  // Métodos de consulta
  getCategoryStats(category: string): ICategoryStats;
  isValidCategory(category: string): boolean;
  extractCategoriesFromPrograms(programs: ITvProgram[]): string[];
}

/**
 * Interface para estadísticas de categoría
 */
export interface ICategoryStats {
  totalPrograms: number;
  channelsCount: number;
  currentlyAiring: number;
  nextProgramTime: string;
}

/**
 * Interface para evento de selección de categoría
 */
export interface ICategorySelectedEvent {
  category: string;
  timestamp: Date;
  source: 'user' | 'system';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryFilterService implements ICategoryFilterService {
  
  // ===============================================
  // ESTADO PRIVADO
  // ===============================================
  
  private readonly _selectedCategory = new BehaviorSubject<string | null>(null);
  private readonly _availableCategories = new BehaviorSubject<string[]>([]);
  private readonly _allPrograms = new BehaviorSubject<ITvProgram[]>([]);
  
  // Signals para estado reactivo
  private readonly _selectedCategorySignal = signal<string | null>(null);
  private readonly _availableCategoriesSignal = signal<string[]>([]);
  private readonly _allProgramsSignal = signal<ITvProgram[]>([]);
  
  // ===============================================
  // OBSERVABLES PÚBLICOS
  // ===============================================
  
  public readonly selectedCategory$ = this._selectedCategory.asObservable();
  public readonly availableCategories$ = this._availableCategories.asObservable();
  
  // Computed para programas filtrados
  public readonly filteredPrograms$ = this._allPrograms.asObservable();
  
  // ===============================================
  // COMPUTED PROPERTIES
  // ===============================================
  
  /**
   * Programas filtrados por categoría seleccionada
   */
  public readonly filteredPrograms = computed(() => {
    const selectedCategory = this._selectedCategorySignal();
    const allPrograms = this._allProgramsSignal();
    
    if (!selectedCategory) {
      return allPrograms;
    }
    
    return allPrograms.filter(program => 
      this.programMatchesCategory(program, selectedCategory)
    );
  });
  
  /**
   * Categorías disponibles extraídas de los programas
   */
  public readonly availableCategories = computed(() => {
    const programs = this._allProgramsSignal();
    return this.extractCategoriesFromPrograms(programs);
  });
  
  // ===============================================
  // MÉTODOS PÚBLICOS - INTERFACE IMPLEMENTATION
  // ===============================================
  
  /**
   * Selecciona una categoría para filtrar
   */
  public selectCategory(category: string): void {
    if (!this.isValidCategory(category)) {
      console.warn(`CategoryFilterService: Invalid category: ${category}`);
      return;
    }
    
    this._selectedCategorySignal.set(category);
    this._selectedCategory.next(category);
    
    console.log(`CategoryFilterService: Category selected: ${category}`);
  }
  
  /**
   * Limpia el filtro de categoría
   */
  public clearCategoryFilter(): void {
    this._selectedCategorySignal.set(null);
    this._selectedCategory.next(null);
    
    console.log('CategoryFilterService: Category filter cleared');
  }
  
  /**
   * Actualiza la lista de programas
   */
  public updatePrograms(programs: ITvProgram[]): void {
    this._allProgramsSignal.set(programs);
    this._allPrograms.next(programs);
    
    // Actualizar categorías disponibles
    const categories = this.extractCategoriesFromPrograms(programs);
    this._availableCategoriesSignal.set(categories);
    this._availableCategories.next(categories);
    
    console.log(`CategoryFilterService: Programs updated: ${programs.length} items, ${categories.length} categories`);
  }
  
  /**
   * Obtiene estadísticas de una categoría específica
   */
  public getCategoryStats(category: string): ICategoryStats {
    const programs = this._allProgramsSignal();
    const categoryPrograms = programs.filter(program => 
      this.programMatchesCategory(program, category)
    );
    
    const now = new Date();
    const currentlyAiring = categoryPrograms.filter(program => {
      const startTime = new Date(program.start);
      const endTime = new Date(program.end);
      return startTime <= now && endTime > now;
    }).length;
    
    const nextPrograms = categoryPrograms
      .filter(program => new Date(program.start) > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    const nextProgramTime = nextPrograms.length > 0
      ? new Date(nextPrograms[0].start).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      : 'N/A';
    
    // Contar canales únicos
    const channelsCount = new Set(
      categoryPrograms.map(program => program.channel?.id || program.channel_id)
    ).size;
    
    return {
      totalPrograms: categoryPrograms.length,
      channelsCount,
      currentlyAiring,
      nextProgramTime
    };
  }
  
  /**
   * Verifica si una categoría es válida
   */
  public isValidCategory(category: string): boolean {
    return typeof category === 'string' && category.trim().length > 0;
  }
  
  /**
   * Extrae categorías únicas de una lista de programas
   */
  public extractCategoriesFromPrograms(programs: ITvProgram[]): string[] {
    const categoriesSet = new Set<string>();
    
    programs.forEach(program => {
      if (program.category && typeof program.category === 'object' && program.category.value) {
        // Dividir categorías separadas por comas
        const categories = program.category.value.split(',').map(cat => cat.trim());
        categories.forEach(cat => {
          if (cat) categoriesSet.add(cat);
        });
      }
    });
    
    return Array.from(categoriesSet).sort();
  }
  
  // ===============================================
  // GETTERS PARA SIGNALS (API CONVENIENTE)
  // ===============================================
  
  /**
   * Obtiene la categoría seleccionada actual
   */
  public getSelectedCategory(): string | null {
    return this._selectedCategorySignal();
  }
  
  /**
   * Obtiene todas las categorías disponibles
   */
  public getAvailableCategories(): string[] {
    return this._availableCategoriesSignal();
  }
  
  /**
   * Obtiene los programas filtrados
   */
  public getFilteredPrograms(): ITvProgram[] {
    return this.filteredPrograms();
  }
  
  // ===============================================
  // MÉTODOS PRIVADOS
  // ===============================================
  
  /**
   * Verifica si un programa coincide con la categoría especificada
   */
  private programMatchesCategory(program: ITvProgram, category: string): boolean {
    if (!program.category) return false;
    
    // La categoría es un objeto ICategory con propiedad value
    if (typeof program.category === 'object' && program.category.value) {
      return program.category.value.toLowerCase().includes(category.toLowerCase());
    }
    
    return false;
  }
}
