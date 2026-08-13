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

  onChipKeydown(event: KeyboardEvent, id: string): void {
    if (this.multiSelect || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const currentIndex = this.chips.findIndex((chip) => chip.id === id);
    if (currentIndex < 0 || !this.chips.length) {
      return;
    }

    event.preventDefault();
    let nextIndex: number;
    if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = this.chips.length - 1;
    } else {
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      nextIndex = (currentIndex + direction + this.chips.length) % this.chips.length;
    }

    const nextChip = this.chips[nextIndex];
    this.chipSelect.emit(nextChip.id);
    const tablist = (event.currentTarget as HTMLElement).parentElement;
    queueMicrotask(() => tablist?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]?.focus());
  }

  trackByChip(_index: number, chip: FilterChipItem): string {
    return chip.id;
  }
}
