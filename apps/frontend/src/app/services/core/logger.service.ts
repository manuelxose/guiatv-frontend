/**
 * Servicio de logging centralizado
 * Ubicación: src/app/services/core/logger.service.ts
 */

import { Injectable } from '@angular/core';
import { ILogger } from '../../interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsoleLoggerService implements ILogger {
  private isDevelopment = !environment.production;
  private enableVerbose = false; // Desactiva info/debug para evitar ruido en consola

  info(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.enableVerbose) {
      console.log(`ℹ️ ${this.formatMessage(message)}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️ ${this.formatMessage(message)}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`❌ ${this.formatMessage(message)}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.enableVerbose) {
      console.debug(`🔍 ${this.formatMessage(message)}`, ...args);
    }
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }
}
