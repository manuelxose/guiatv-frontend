import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { InteractionButtonsComponent } from '../interaction-buttons/interaction-buttons.component';

@Component({
  selector: 'app-card-slider',
  standalone: true,
  imports: [CommonModule, InteractionButtonsComponent],
  templateUrl: './card-slider.component.html',
  styleUrls: ['./card-slider.component.scss'],
})
export class CardSliderComponent implements OnChanges {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() channelIcon: string = '';
  @Input() image: string = '';
  @Input() live: boolean = false;
  @Input() time: string = '';
  @Input() link: string = '';
  @Input() id: string = '';
  @Input() type: 'movie' | 'series' | 'program' = 'program';
  @Input() badge: string = '';
  @Input() badgeColor: 'red' | 'green' | 'blue' | 'gray' = 'gray';
  public imageFailed = false;
  public readonly fallbackImage = '/assets/images/default-movie-poster.svg';

  @Output() cardClick = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image']) {
      this.imageFailed = false;
    }
  }

  get resolvedImage(): string {
    return !this.imageFailed && this.image ? this.image : this.fallbackImage;
  }

  onClick(): void {
    this.cardClick.emit();
  }

  onImageError(): void {
    this.imageFailed = true;
  }
}
