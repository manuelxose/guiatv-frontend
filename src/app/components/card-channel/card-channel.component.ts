import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-channel.component.html',
  styleUrls: ['./card-channel.component.scss']
})
export class CardChannelComponent {
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

  ngOnChanges() {
    this.updateBackgroundImage();
  }

  private updateBackgroundImage() {
    if (this.icon && !this.imageError) {
      this.backgroundImage = `url('${this.icon}')`;
    } else {
      this.backgroundImage = `url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-size="14" font-family="system-ui"%3E${this.name.substring(0, 2).toUpperCase()}%3C/text%3E%3C/svg%3E')`;
    }
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
