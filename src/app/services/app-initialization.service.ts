import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio global para coordinar la inicialización de datos
 * Previene múltiples llamadas API simultáneas desde diferentes componentes
 * VERSIÓN CORREGIDA: Maneja correctamente las recargas de página
 */
@Injectable({
  providedIn: 'root',
})
export class AppInitializationService {
  
  // CAMBIO PRINCIPAL: Remover variables estáticas que causan problemas en recargas
  // Las variables de instancia se reinician correctamente en cada recarga
  private isApplicationInitialized = false;
  private isApplicationInitializing = false;
  private initializationError: string | null = null;
  
  // Observables para coordinar entre componentes
  private initializationStatusSubject = new BehaviorSubject<{
    initialized: boolean;
    initializing: boolean;
    error: string | null;
  }>({
    initialized: false, // IMPORTANTE: Siempre comenzar en false
    initializing: false,
    error: null
  });

  public initializationStatus$ = this.initializationStatusSubject.asObservable();

  constructor() {
    console.log(`🔧 APP INIT SERVICE - Servicio de inicialización global creado`);
    console.log(`🔧 APP INIT SERVICE - Estado inicial: initialized=${this.isApplicationInitialized}, initializing=${this.isApplicationInitializing}`);
  }

  /**
   * Verifica si la aplicación ya está inicializada
   */
  public isInitialized(): boolean {
    return this.isApplicationInitialized;
  }

  /**
   * Verifica si la aplicación se está inicializando
   */
  public isInitializing(): boolean {
    return this.isApplicationInitializing;
  }

  /**
   * Obtiene el error de inicialización si existe
   */
  public getInitializationError(): string | null {
    return this.initializationError;
  }

  /**
   * NUEVO: Verifica si realmente hay datos disponibles
   * Esto previene el problema de "inicializado" pero sin datos reales
   */
  public hasRealData(dataCheck?: () => boolean): boolean {
    if (!this.isApplicationInitialized) {
      return false;
    }
    
    // Si se proporciona una función de verificación, usarla
    if (dataCheck && typeof dataCheck === 'function') {
      const hasData = dataCheck();
      console.log(`🔍 APP INIT - Verificación de datos reales: ${hasData}`);
      
      // Si no hay datos reales, resetear el estado de inicialización
      if (!hasData) {
        console.warn(`⚠️ APP INIT - Datos faltantes detectados, reseteando estado de inicialización`);
        this.resetInitialization();
        return false;
      }
      
      return hasData;
    }
    
    return this.isApplicationInitialized;
  }

  /**
   * Marca el inicio de la inicialización global
   * MEJORADO: Más logging para debugging
   */
  public startInitialization(): boolean {
    console.log(`🔍 APP INIT - Estado actual antes de startInitialization: initialized=${this.isApplicationInitialized}, initializing=${this.isApplicationInitializing}`);
    
    if (this.isApplicationInitialized) {
      console.log(`✅ APP INIT - Aplicación ya inicializada, no es necesario reinicializar`);
      return false;
    }

    if (this.isApplicationInitializing) {
      console.log(`⏳ APP INIT - Inicialización ya en progreso, esperando...`);
      return false;
    }

    console.log(`🚀 APP INIT - Iniciando inicialización global de la aplicación`);
    this.isApplicationInitializing = true;
    this.initializationError = null;
    
    this.updateStatus();
    return true;
  }

  /**
   * Marca la inicialización como completada exitosamente
   * MEJORADO: Verificación adicional de datos
   */
  public completeInitialization(dataVerification?: () => boolean): void {
    // Verificar que realmente hay datos antes de marcar como completado
    if (dataVerification && typeof dataVerification === 'function') {
      const hasData = dataVerification();
      if (!hasData) {
        console.error(`❌ APP INIT - Intentando completar inicialización sin datos reales`);
        this.failInitialization('Inicialización completada pero sin datos disponibles');
        return;
      }
    }
    
    console.log(`✅ APP INIT - Inicialización global completada exitosamente`);
    this.isApplicationInitialized = true;
    this.isApplicationInitializing = false;
    this.initializationError = null;
    
    this.updateStatus();
  }

  /**
   * Marca la inicialización como fallida
   */
  public failInitialization(error: string): void {
    console.error(`❌ APP INIT - Inicialización global falló:`, error);
    this.isApplicationInitialized = false;
    this.isApplicationInitializing = false;
    this.initializationError = error;
    
    this.updateStatus();
  }

  /**
   * Resetea el estado de inicialización
   * MEJORADO: Más útil para manejar recargas
   */
  public resetInitialization(): void {
    console.log(`🔄 APP INIT - Reseteando estado de inicialización global`);
    this.isApplicationInitialized = false;
    this.isApplicationInitializing = false;
    this.initializationError = null;
    
    this.updateStatus();
  }

  /**
   * NUEVO: Fuerza una reinicialización completa
   * Útil cuando se detecta que hay datos corruptos o faltantes
   */
  public forceReinitialize(): void {
    console.log(`🔄 APP INIT - Forzando reinicialización completa`);
    this.resetInitialization();
    // Emitir estado inmediatamente para que los componentes reaccionen
    this.updateStatus();
  }

  /**
   * Actualiza el observable con el estado actual
   */
  private updateStatus(): void {
    const status = {
      initialized: this.isApplicationInitialized,
      initializing: this.isApplicationInitializing,
      error: this.initializationError
    };
    
    console.log(`📡 APP INIT - Emitiendo estado:`, status);
    this.initializationStatusSubject.next(status);
  }

  /**
   * Obtiene un resumen del estado actual para debugging
   */
  public getStatusSummary(): string {
    return `APP INIT STATUS - Initialized: ${this.isApplicationInitialized}, Initializing: ${this.isApplicationInitializing}, Error: ${this.initializationError || 'None'}`;
  }

  /**
   * NUEVO: Método para debugging que verifica la consistencia del estado
   */
  public debugStateConsistency(externalDataCheck?: () => boolean): void {
    console.log(`\n🔍 === DEBUG STATE CONSISTENCY ===`);
    console.log(`📊 Internal State - Initialized: ${this.isApplicationInitialized}`);
    console.log(`📊 Internal State - Initializing: ${this.isApplicationInitializing}`);
    console.log(`📊 Internal State - Error: ${this.initializationError || 'None'}`);
    
    if (externalDataCheck && typeof externalDataCheck === 'function') {
      const hasExternalData = externalDataCheck();
      console.log(`📊 External Data Check: ${hasExternalData}`);
      
      // Detectar inconsistencias
      if (this.isApplicationInitialized && !hasExternalData) {
        console.warn(`🚨 INCONSISTENCY DETECTED: Service says initialized but no external data!`);
      }
      
      if (!this.isApplicationInitialized && hasExternalData) {
        console.warn(`🚨 INCONSISTENCY DETECTED: Service says not initialized but external data exists!`);
      }
    }
    
    console.log(`🔍 === END DEBUG STATE CONSISTENCY ===\n`);
  }
}