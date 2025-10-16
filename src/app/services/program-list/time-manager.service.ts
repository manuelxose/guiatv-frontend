/**
 * Servicio para manejo del tiempo y franjas horarias
 * Ubicación: src/app/services/program-list/time-manager.service.ts
 */

import { Injectable } from '@angular/core';
import { TIME_SLOTS, PROGRAM_LIST_CONFIG } from 'src/app/constants/program-list.constants';
import { ITimeManager } from 'src/app/interfaces/program-list.interface';

@Injectable({
  providedIn: 'root'
})
export class TimeManagerService implements ITimeManager {

  getCurrentTimeSlot(): number {
    const currentHour = new Date().getHours();
    return Math.floor(currentHour / 3);
  }

  getTimeSlots(): readonly string[][] {
    return TIME_SLOTS;
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  parseTimeToMinutes(timeString: string): number {
    if (!timeString) return 0;
    
    try {
      // Si ya es formato HH:MM
      if (timeString.includes(':') && timeString.length === 5) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + (minutes || 0);
      }
      
      // Si es una fecha completa (ISO string)
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.getHours() * 60 + date.getMinutes();
      }
    } catch (error) {
      console.warn('Error parsing time:', timeString, error);
    }
    
    return 0;
  }
  calculateTimePosition(time: string, baseTime: string): number {
    const timeMinutes = this.parseTimeToMinutes(time);
    const baseMinutes = this.parseTimeToMinutes(baseTime);
    
    let difference = timeMinutes - baseMinutes;
    if (difference < 0) difference += 24 * 60; // Handle day overflow
    
    // Usar el ancho fijo de hora para consistencia (120px / 60min = 2px por minuto)
    const pixelsPerMinute = PROGRAM_LIST_CONFIG.PROGRAM_DISPLAY.HOUR_WIDTH_PX / 60;
    const positionInPx = Math.max(0, difference * pixelsPerMinute);
    
    // Convertir a rem
    const remSize = 16; // Default browser rem size
    return positionInPx / remSize;
  }

  generateHoursForSlot(slotIndex: number): string[] {
    const slots = this.getTimeSlots();
    if (slotIndex >= 0 && slotIndex < slots.length) {
      return [...slots[slotIndex]];
    }
    return [...slots[0]]; // Fallback to first slot
  }

  /**
   * Convierte tiempo a formato de visualización
   */
  formatDisplayTime(timeString: string): string {
    if (!timeString) return '';
    
    try {
      if (timeString.includes(':') && timeString.length === 5) {
        return timeString;
      }
      
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
    } catch (error) {
      console.warn('Error formatting time:', timeString, error);
    }
    
    return timeString.substring(0, 5);
  }

  /**
   * Verifica si es hora de mostrar el indicador actual
   */
  shouldShowCurrentTimeIndicator(activeDay: number): boolean {
    return activeDay === 0; // Solo mostrar en "hoy"
  }

  /**
   * Calcula la duración entre dos tiempos
   */
  calculateDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 30; // Duración por defecto
    
    try {
      const startMinutes = this.parseTimeToMinutes(startTime);
      const endMinutes = this.parseTimeToMinutes(endTime);
      
      let duration = endMinutes - startMinutes;
      if (duration <= 0) duration += 24 * 60; // Handle day overflow
      
      return Math.max(1, duration);
    } catch (error) {
      console.warn('Error calculating duration:', { startTime, endTime, error });
      return 30;
    }
  }
}