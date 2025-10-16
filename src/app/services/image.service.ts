/**
 * Image Service - Aplicando Principios SOLID
 * - Principio de Responsabilidad Única: Solo maneja lógica de imágenes
 * - Principio Abierto/Cerrado: Extensible para nuevos tipos de imágenes
 * - Principio de Inversión de Dependencias: Implementa interface IImageService
 */

import { Injectable } from '@angular/core';
import { IImageService } from '../interfaces/banner.interface';

@Injectable({
  providedIn: 'root'
})
export class ImageService implements IImageService {
  
  private readonly CHANNEL_LOGO_BASE_URL = 'https://wsrv.nl/?url=https://raw.githubusercontent.com/davidmuma/picons_dobleM/master/icon/';
  private readonly FALLBACK_POSTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDE1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzOTkzZGQiLz48cGF0aCBkPSJNNTAgNzBMMTAwIDk1TDUwIDEyMFY3MFpNNzAgNDBIODBWNjBINzBWNDBaTTcwIDE0MEg4MFYxNjBINzBWMTQwWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPgo=';
  private readonly FALLBACK_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzNzQxNTEiLz48L3N2Zz4=';

  /**
   * Obtiene la URL del logo del canal
   * Principio de Responsabilidad Única: Solo se encarga de generar URLs de logos
   */
  getChannelLogoUrl(channelName: string): string {
    if (!channelName) {
      return this.FALLBACK_LOGO;
    }

    // Limpiar el nombre del canal para la URL
    const cleanChannelName = this.sanitizeChannelName(channelName);
    return `${this.CHANNEL_LOGO_BASE_URL}${cleanChannelName}.png`;
  }

  /**
   * Obtiene la URL del poster del programa
   * Principio de Responsabilidad Única: Solo se encarga de generar URLs de posters
   */
  getProgramPosterUrl(programData: any): string {
    console.log('🖼️ ImageService: Getting poster URL for:', programData);
    
    // Buscar en diferentes propiedades posibles para el poster
    const possiblePosterFields = [
      programData?.poster,
      programData?.image,
      programData?.thumbnail,
      // Solo usar icon si NO es un logo de canal
      this.isChannelLogoUrl(programData?.icon) ? null : programData?.icon
    ];

    for (const field of possiblePosterFields) {
      if (field && this.isValidPosterUrl(field)) {
        console.log('✅ ImageService: Found valid poster URL:', field);
        return field;
      } else if (field) {
        console.log('❌ ImageService: Rejected URL (likely channel logo):', field);
      }
    }

    console.log('🔄 ImageService: No valid poster found, using fallback');
    return this.FALLBACK_POSTER;
  }

  /**
   * Obtiene la URL de imagen por defecto
   */
  getFallbackImageUrl(): string {
    return this.FALLBACK_POSTER;
  }

  /**
   * Maneja errores de carga de imágenes
   * Principio de Responsabilidad Única: Solo maneja errores de imágenes
   */
  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      // Determinar si es un logo de canal o un poster por el contexto
      const isChannelLogo = target.classList.contains('channel-logo') || 
                          target.alt?.toLowerCase().includes('logo') ||
                          target.alt?.toLowerCase().includes('canal');
      
      target.src = isChannelLogo ? this.FALLBACK_LOGO : this.FALLBACK_POSTER;
    }
  }

  /**
   * Método privado para sanitizar nombres de canales
   * Principio de Responsabilidad Única: Solo se encarga de limpiar nombres
   */
  private sanitizeChannelName(channelName: string): string {
    return channelName
      .replace(/\s+HD$/i, '') // Remover "HD" al final
      .replace(/\s+/g, '-')   // Reemplazar espacios con guiones
      .replace(/[^\w\-]/g, '') // Remover caracteres especiales
      .toLowerCase();
  }

  /**
   * Método privado para validar si una URL es un poster válido
   * Principio de Responsabilidad Única: Solo valida URLs de posters
   */
  private isValidPosterUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // No es válido si es un logo de canal
    if (this.isChannelLogoUrl(url)) {
      return false;
    }

    // Es válido si parece una URL de imagen
    return url.startsWith('http') || url.startsWith('data:image');
  }

  /**
   * Método privado para detectar si una URL es un logo de canal
   * Principio de Responsabilidad Única: Solo detecta URLs de logos de canal
   */
  private isChannelLogoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const logoPatterns = [
      'picons_dobleM',
      '/logo/',
      '/logos/',
      'channel-logo',
      '/channels/',
      '/canales/', // NUEVO: Detectar rutas de canales de Firebase
      '/icono.png', // NUEVO: Detectar iconos específicos
      'icono.png', // NUEVO: Detectar nombres de icono
      'logo-',
      '_logo',
      'logotipo',
      'logo.png',
      'canal_',
      'channel_'
    ];

    return logoPatterns.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()));
  }
}
