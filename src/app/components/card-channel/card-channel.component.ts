import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-channel.component.html',
  styleUrls: ['./card-channel.component.scss']
})
export class CardChannelComponent implements OnInit, OnChanges {
  @Input() name: string = '';
  @Input() icon: string = '';
  @Input() type: string = '';
  @Input() region?: string;
  @Input() isActive: boolean = true;
  
  @Output() cardClick = new EventEmitter<void>();

  public backgroundImage: string = '';
  public imageError: boolean = false;

  ngOnInit() {
    this.updateBackgroundImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['icon']) {
      this.updateBackgroundImage();
    }
  }

  private updateBackgroundImage() {
    const resolvedIcon = this.resolveIconUrl(this.icon);
    
    console.log('[CardChannel] Updating background:', {
      name: this.name,
      originalIcon: this.icon,
      resolvedIcon: resolvedIcon,
      imageError: this.imageError
    });
    
    if (resolvedIcon && !this.imageError) {
      this.backgroundImage = `url('${resolvedIcon}')`;
    } else {
      this.backgroundImage = `url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-size="14" font-family="system-ui"%3E${this.name.substring(0, 2).toUpperCase()}%3C/text%3E%3C/svg%3E')`;
    }
  }

  private resolveIconUrl(icon?: string): string | undefined {
    if (!icon) {
      console.log('[CardChannel] No icon provided');
      return undefined;
    }
    
    // If already absolute URL, return as-is
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
      return icon;
    }
    
    // Convert relative path to absolute URL
    // Storage paths should point to backend (port 4000)
    if (icon.startsWith('/storage/')) {
      const backendUrl = 'http://localhost:4000';
      const resolved = `${backendUrl}${icon}`;
      console.log('[CardChannel] Resolved storage path:', { icon, backendUrl, resolved });
      return resolved;
    }
    
    // Other relative paths use current origin
    if (icon.startsWith('/')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const resolved = `${origin}${icon}`;
      console.log('[CardChannel] Resolved relative path:', { icon, origin, resolved });
      return resolved;
    }
    
    return icon;
  }

  onClick() {
    if (this.isActive) {
      this.cardClick.emit();
    }
  }

  onImageError() {
    this.imageError = true;
    this.updateBackgroundImage();
  }

  getTypeColor(): string {
    const typeMap: { [key: string]: string } = {
      'TDT': 'blue',
      'MOVISTAR': 'purple',
      'CABLE': 'green',
      'AUTONOMICO': 'orange',
      'DEPORTE': 'red'
    };
    return typeMap[this.type?.toUpperCase()] || 'gray';
  }
}
