/**
 * Servicio para manejo del estado de inicialización
 * Ubicación: src/app/services/core/initialization-manager.service.ts
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IInitializationManager, ILogger, InitializationState } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class InitializationManagerService implements IInitializationManager {
  private _isInitialized = false;
  private _isInitializing = false;
  private initializationError: string | null = null;

  private statusSubject = new BehaviorSubject<InitializationState>({
    initialized: false,
    initializing: false,
    error: null
  });

  public status$: Observable<InitializationState> = this.statusSubject.asObservable();

  constructor(private logger: ILogger) {
    this.logger.info('Initialization Manager created');
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  isInitializing(): boolean {
    return this._isInitializing;
  }

  getInitializationError(): string | null {
    return this.initializationError;
  }

  startInitialization(): boolean {
    this.logger.debug(
      `Start initialization called - Current state: initialized=${this._isInitialized}, initializing=${this._isInitializing}`
    );

    if (this._isInitialized) {
      this.logger.info('Already initialized, skipping initialization');
      return false;
    }

    if (this._isInitializing) {
      this.logger.info('Initialization already in progress, waiting');
      return false;
    }

    this.logger.info('Starting initialization process');
    this._isInitializing = true;
    this.initializationError = null;
    this.emitStatus();
    return true;
  }

  completeInitialization(dataVerification?: () => boolean): void {
    if (dataVerification && typeof dataVerification === 'function') {
      const hasValidData = dataVerification();
      
      if (!hasValidData) {
        this.logger.error('Data verification failed during initialization completion');
        this.failInitialization('Initialization completed but data verification failed');
        return;
      }
      
      this.logger.debug('Data verification passed');
    }

    this.logger.info('Initialization completed successfully');
    this._isInitialized = true;
    this._isInitializing = false;
    this.initializationError = null;
    this.emitStatus();
  }

  failInitialization(error: string): void {
    this.logger.error(`Initialization failed: ${error}`);
    this._isInitialized = false;
    this._isInitializing = false;
    this.initializationError = error;
    this.emitStatus();
  }

  resetInitialization(): void {
    this.logger.info('Resetting initialization state');
    this._isInitialized = false;
    this._isInitializing = false;
    this.initializationError = null;
    this.emitStatus();
  }

  forceReinitialize(): void {
    this.logger.info('Forcing reinitialization');
    this.resetInitialization();
    // Emitir estado inmediatamente para que los componentes reaccionen
    this.emitStatus();
  }

  hasRealData(dataCheck?: () => boolean): boolean {
    if (!this._isInitialized) {
      return false;
    }
    
    // Si se proporciona una función de verificación, usarla
    if (dataCheck && typeof dataCheck === 'function') {
      const hasData = dataCheck();
      this.logger.debug(`Real data verification: ${hasData}`);
      
      // Si no hay datos reales, resetear el estado de inicialización
      if (!hasData) {
        this.logger.warn('Real data missing detected, resetting initialization state');
        this.resetInitialization();
        return false;
      }
      
      return hasData;
    }
    
    return this._isInitialized;
  }

  debugStateConsistency(externalDataCheck?: () => boolean): void {
    this.logger.debug('\n=== DEBUG STATE CONSISTENCY ===');
    this.logger.debug(`Internal State - Initialized: ${this._isInitialized}`);
    this.logger.debug(`Internal State - Initializing: ${this._isInitializing}`);
    this.logger.debug(`Internal State - Error: ${this.initializationError || 'None'}`);
    
    if (externalDataCheck && typeof externalDataCheck === 'function') {
      const hasExternalData = externalDataCheck();
      this.logger.debug(`External Data Check: ${hasExternalData}`);
      
      // Detectar inconsistencias
      if (this._isInitialized && !hasExternalData) {
        this.logger.warn('INCONSISTENCY DETECTED: Service says initialized but no external data!');
      }
      
      if (!this._isInitialized && hasExternalData) {
        this.logger.warn('INCONSISTENCY DETECTED: Service says not initialized but external data exists!');
      }
    }
    
    this.logger.debug('=== END DEBUG STATE CONSISTENCY ===\n');
  }

  getStatusSummary(): string {
    return `Initialization Status - Initialized: ${this._isInitialized}, Initializing: ${this._isInitializing}, Error: ${this.initializationError || 'None'}`;
  }

  private emitStatus(): void {
    const status = {
      initialized: this._isInitialized,
      initializing: this._isInitializing,
      error: this.initializationError
    };
    
    this.logger.debug('Emitting initialization status', status);
    this.statusSubject.next(status);
  }
}