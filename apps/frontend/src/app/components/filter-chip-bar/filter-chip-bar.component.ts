import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface FilterChipItem {
  id: string;
  label: string;
  count?: number;
  iconPath?: string;
  tone?: 'neutral' | 'live' | 'discover' | 'streaming' | 'sports';
}

@Component({
  selector: 'app-filter-chip-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-chip-bar.component.html',
  styleUrl: './filter-chip-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChipBarComponent {
  @Input() chips: readonly FilterChipItem[] = [];
  @Input() active: string | readonly string[] = 'all';
  @Input() multiSelect = false;
  @Input() ariaLabel = 'Filtros rápidos';
  @Input() variant: 'default' | 'shelf' = 'default';

  @Output() chipSelect = new EventEmitter<string>();

  isActive(id: string): boolean {
    return Array.isArray(this.active) ? this.active.includes(id) : this.active === id;
  }

  trackByChip(_index: number, chip: FilterChipItem): string {
    return chip.id;
  }
}
