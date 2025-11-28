import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-card-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-slider.component.html',
  styleUrls: ['./card-slider.component.scss'],
})
export class CardSliderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() image: string = '';
  @Input() live: boolean = false;
  @Input() time: string = '';
  @Input() link: string = '';
  @Input() badge: string = '';
  @Input() badgeColor: 'red' | 'green' | 'blue' | 'gray' = 'gray';

  @Output() cardClick = new EventEmitter<void>();

  get backgroundImage(): string {
    return this.image
      ? `url(${this.image})`
      : 'linear-gradient(to bottom, #2d3748, #1a202c)';
  }

  onClick(): void {
    this.cardClick.emit();
  }
}
