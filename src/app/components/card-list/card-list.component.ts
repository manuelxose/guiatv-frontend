import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss'],
})
export class CardListComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() image: string = '';
  @Input() description: string = '';
  @Input() time: string = '';
  @Input() category: string = '';
  @Input() live: boolean = false;
  @Input() progress: number = 0;
  @Input() badge: string = '';
  @Input() badgeColor: 'red' | 'green' | 'blue' | 'gray' = 'gray';

  @Output() cardClick = new EventEmitter<void>();
  @Output() remindClick = new EventEmitter<void>();

  get backgroundImage(): string {
    return this.image
      ? `url(${this.image})`
      : 'linear-gradient(to right, #2d3748, #1a202c)';
  }

  onClick(): void {
    this.cardClick.emit();
  }

  onRemind(event: Event): void {
    event.stopPropagation();
    this.remindClick.emit();
  }
}
