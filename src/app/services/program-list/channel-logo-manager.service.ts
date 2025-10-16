/**
 * Servicio para manejo de logos de canales
 * Ubicación: src/app/services/program-list/channel-logo-manager.service.ts
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IChannelLogoManager, IChannelInfo } from 'src/app/interfaces/program-list.interface';

@Injectable({
  providedIn: 'root'
})
export class ChannelLogoManagerService implements IChannelLogoManager {
  
  private logoUrlCache = new Map<string, string>();
  private failedLogos = new Set<string>();
  private canalesData$ = new BehaviorSubject<any>({});

  constructor() {}

  getChannelLogoUrl(channelData: IChannelInfo): string {
    if (!channelData) {
      return '';
    }
    
    const channelId = channelData.id || channelData.name;
    const channelName = channelData.name;
    
    // Check cache first
    if (this.logoUrlCache.has(channelId)) {
      return this.logoUrlCache.get(channelId)!;
    }
    
    // Check if this logo has failed before
    if (this.failedLogos.has(channelId)) {
      return '';
    }
    
    // Priority 1: Use channel icon from program data
    if (channelData.icon && this.isValidUrl(channelData.icon)) {
      this.logoUrlCache.set(channelId, channelData.icon);
      return channelData.icon;
    }
    
    // Priority 2: Try to get from canales.json
    const canalesData = this.canalesData$.value;
    if (canalesData && Object.keys(canalesData).length > 0) {
      const logoUrl = this.findLogoInCanalesData(channelName, canalesData);
      if (logoUrl) {
        this.logoUrlCache.set(channelId, logoUrl);
        return logoUrl;
      }
    }
    
    // Priority 3: Try alternative logo sources
    const alternativeUrl = this.generateAlternativeLogoUrl(channelName);
    if (alternativeUrl) {
      this.logoUrlCache.set(channelId, alternativeUrl);
      return alternativeUrl;
    }
    
    return '';
  }

  handleLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const src = img.src;
    
    // Mark this URL as failed
    this.markLogoAsFailed(src);
    
    // Hide the image
    img.style.display = 'none';
    
    // Show fallback text
    const container = img.closest('.relative');
    const fallback = container?.querySelector('.channel-name-fallback');
    if (fallback) {
      fallback.classList.remove('hidden');
    }
    
    console.debug('Logo failed to load:', src);
  }

  handleLogoLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const container = img.closest('.relative');
    const fallback = container?.querySelector('.channel-name-fallback');
    
    // Hide fallback text when logo loads successfully
    if (fallback) {
      fallback.classList.add('hidden');
    }
    
    console.debug('Logo loaded successfully:', img.src);
  }

  clearCache(): void {
    this.logoUrlCache.clear();
    this.failedLogos.clear();
    console.log('🗑️ Channel logo cache cleared');
  }

  /**
   * Actualiza los datos de canales desde canales.json
   */
  updateCanalesData(canalesData: any): void {
    this.canalesData$.next(canalesData || {});
    // Clear cache when new data is available
    this.logoUrlCache.clear();
  }

  /**
   * Obtiene el observable de datos de canales
   */
  getCanalesData(): Observable<any> {
    return this.canalesData$.asObservable();
  }

  /**
   * Precargar logos para mejorar performance
   */
  preloadLogos(channels: IChannelInfo[]): void {
    channels.forEach(channel => {
      const logoUrl = this.getChannelLogoUrl(channel);
      if (logoUrl && !this.failedLogos.has(logoUrl)) {
        this.preloadImage(logoUrl);
      }
    });
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats(): { cached: number; failed: number; hitRate: number } {
    const total = this.logoUrlCache.size + this.failedLogos.size;
    const hitRate = total > 0 ? (this.logoUrlCache.size / total) * 100 : 0;
    
    return {
      cached: this.logoUrlCache.size,
      failed: this.failedLogos.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  private findLogoInCanalesData(channelName: string, canalesData: any): string {
    if (!channelName || !canalesData) return '';
    
    const channelKey = this.normalizeChannelName(channelName);
    
    const channelInfo = canalesData[channelKey];
    if (channelInfo) {
      return channelInfo.logo || channelInfo.icon || '';
    }
    
    return '';
  }

  private normalizeChannelName(channelName: string): string {
    return channelName?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/\s+/g, '') // Remove spaces
      .replace(/\+/g, '') // Remove plus signs
      .replace(/hd$/i, '') // Remove HD suffix
      .replace(/tv$/i, '') // Remove TV suffix
      || '';
  }

  private generateAlternativeLogoUrl(channelName: string): string {
    if (!channelName) return '';
    
    // Try different logo sources
    const alternatives = [
      `https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/${encodeURIComponent(channelName)}.png`,
      `https://graph.facebook.com/${encodeURIComponent(channelName)}/picture?type=large`,
      // Add more alternative sources as needed
    ];
    
    // Return the first alternative (simple strategy)
    return alternatives[0];
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private markLogoAsFailed(url: string): void {
    // Extract channel identifier from URL if possible
    this.failedLogos.add(url);
    
    // Remove from cache if it exists
    for (const [key, value] of this.logoUrlCache.entries()) {
      if (value === url) {
        this.logoUrlCache.delete(key);
        break;
      }
    }
  }

  private preloadImage(url: string): void {
    const img = new Image();
    img.onload = () => console.debug('Logo preloaded:', url);
    img.onerror = () => this.markLogoAsFailed(url);
    img.src = url;
  }
}