/**
 * CardChannelComponent - VERSIÓN OPTIMIZADA
 * 
 * Cambios de optimización:
 * 1. Reducido iconWidth de 168 a 100 (tamaño real de visualización: 84x55)
 * 2. Añadido srcset para soporte de pantallas retina
 * 3. Mejorado manejo de errores de imagen
 * 4. Añadido lazy loading nativo
 */
import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnChanges, 
  SimpleChanges, 
  inject,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiConfigService } from 'src/app/api/api-config.service';

// Configuración de tamaños de imagen optimizados
const IMAGE_CONFIG = {
  // Tamaño base para pantallas normales (el display es ~84x55)
  ICON_WIDTH: 100,
  ICON_HEIGHT: 65,
  // Tamaño para pantallas retina (2x)
  ICON_WIDTH_2X: 200,
  ICON_HEIGHT_2X: 130,
  // Calidad WebP
  QUALITY: 80,
  // Aspect ratio
  ASPECT_RATIO: 55 / 84
} as const;

@Component({
  selector: 'app-card-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-channel.component.html',
  styleUrls: ['./card-channel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardChannelComponent implements OnInit, OnChanges {
  private readonly apiConfig = inject(ApiConfigService);
  
  @Input() name: string = '';
  @Input() icon: string = '';
  @Input() type: string = '';
  @Input() region?: string;
  @Input() isActive: boolean = true;
  
  @Output() cardClick = new EventEmitter<void>();

  // URLs de imagen optimizadas
  public imageSrc: string = '';
  public imageSrcset: string = '';
  public imageError: boolean = false;
  
  // Placeholder SVG inline para evitar requests adicionales
  private readonly placeholderSvg = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 65"%3E%3Crect fill="%23374151" width="100" height="65"/%3E%3C/svg%3E`;

  ngOnInit(): void {
    this.updateOptimizedImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['icon'] || changes['name']) {
      this.imageError = false;
      this.updateOptimizedImage();
    }
  }

  /**
   * Actualiza las URLs de imagen optimizadas
   */
  private updateOptimizedImage(): void {
    const resolvedIcon = this.resolveIconUrl(this.icon);
    
    if (!resolvedIcon || this.imageError) {
      this.imageSrc = this.generateTextPlaceholder();
      this.imageSrcset = '';
      return;
    }

    // Generar URLs optimizadas con wsrv.nl
    this.imageSrc = this.buildProxyUrl(
      resolvedIcon, 
      IMAGE_CONFIG.ICON_WIDTH, 
      IMAGE_CONFIG.ICON_HEIGHT
    );
    
    // Srcset para pantallas retina
    this.imageSrcset = this.buildSrcset(resolvedIcon);
  }

  /**
   * Resuelve la URL del icono a una URL absoluta
   */
  private resolveIconUrl(icon?: string): string | undefined {
    if (!icon) return undefined;
    
    // URLs absolutas - retornar tal cual
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
      return icon;
    }
    
    // Paths de storage relativos
    if (icon.startsWith('/storage/')) {
      const assetBaseUrl = this.apiConfig.getAssetBaseUrl();
      return `${assetBaseUrl}${icon}`;
    }
    
    // Otros paths relativos
    if (icon.startsWith('/')) {
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${icon}`;
      }
      return icon;
    }
    
    return icon;
  }

  /**
   * Construye URL optimizada con wsrv.nl
   * - Redimensiona la imagen al tamaño exacto necesario
   * - Convierte a WebP para mejor compresión
   * - Aplica calidad optimizada
   */
  private buildProxyUrl(url: string, width: number, height: number): string {
    if (!url || url.startsWith('data:')) return url;
    
    // Si ya es una URL de wsrv.nl, no re-procesar
    if (url.includes('wsrv.nl')) {
      return url;
    }
    
    try {
      const encodedUrl = encodeURIComponent(url);
      return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&h=${height}&output=webp&q=${IMAGE_CONFIG.QUALITY}&fit=cover`;
    } catch (e) {
      console.warn('[CardChannel] Error building proxy URL:', e);
      return url;
    }
  }

  /**
   * Construye srcset para diferentes densidades de pantalla
   */
  private buildSrcset(url: string): string {
    if (!url || url.startsWith('data:')) return '';
    
    const src1x = this.buildProxyUrl(url, IMAGE_CONFIG.ICON_WIDTH, IMAGE_CONFIG.ICON_HEIGHT);
    const src2x = this.buildProxyUrl(url, IMAGE_CONFIG.ICON_WIDTH_2X, IMAGE_CONFIG.ICON_HEIGHT_2X);
    
    return `${src1x} 1x, ${src2x} 2x`;
  }

  /**
   * Genera un placeholder SVG con las iniciales del canal
   */
  private generateTextPlaceholder(): string {
    const initials = this.name.substring(0, 2).toUpperCase();
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 65"%3E%3Crect fill="%23374151" width="100" height="65"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-size="20" font-family="system-ui,sans-serif"%3E${initials}%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const attempts = parseInt(img.dataset['attempts'] || '0', 10);
    
    if (attempts === 0) {
      // Primer intento fallido: probar con el icono original sin proxy
      img.dataset['attempts'] = '1';
      const originalIcon = this.resolveIconUrl(this.icon);
      if (originalIcon && !originalIcon.startsWith('data:')) {
        img.src = originalIcon;
        return;
      }
    }
    
    // Fallback final: placeholder con texto
    this.imageError = true;
    img.src = this.generateTextPlaceholder();
    img.srcset = '';
  }

  /**
   * Handler de click en la card
   */
  onClick(): void {
    if (this.isActive) {
      this.cardClick.emit();
    }
  }
}