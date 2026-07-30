/**
 * CardChannelComponent - VERSIÓN OPTIMIZADA
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
import { normalizePublicImageUrl } from 'src/app/utils/media-url';

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

    this.imageSrc = resolvedIcon;
    this.imageSrcset = '';
  }

  /**
   * Resuelve la URL del icono a una URL absoluta
   */
  private resolveIconUrl(icon?: string): string | undefined {
    if (!icon) return undefined;
    return normalizePublicImageUrl(icon, this.apiConfig.getAssetBaseUrl());
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
