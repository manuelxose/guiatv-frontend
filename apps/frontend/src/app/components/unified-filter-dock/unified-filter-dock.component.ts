import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface UnifiedFilterDockOption {
  id: string;
  label: string;
  iconPath?: string;
  count?: number;
  selected?: boolean;
}

export interface UnifiedFilterDockSection {
  id: string;
  title: string;
  description?: string;
  multiSelect?: boolean;
  options: UnifiedFilterDockOption[];
}

@Component({
  selector: 'app-unified-filter-dock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-filter-dock.component.html',
  styleUrl: './unified-filter-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedFilterDockComponent {
  @Input() open = false;
  @Input() title = 'Filtros';
  @Input() activeCount = 0;
  @Input() sections: readonly UnifiedFilterDockSection[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() select = new EventEmitter<{ sectionId: string; optionId: string }>();

  trackBySection(_index: number, section: UnifiedFilterDockSection): string {
    return section.id;
  }

  trackByOption(_index: number, option: UnifiedFilterDockOption): string {
    return option.id;
  }

  selectedCount(section: UnifiedFilterDockSection): number {
    return section.options.filter((option) => option.selected).length;
  }

  selectedLabels(section: UnifiedFilterDockSection): string[] {
    return section.options
      .filter((option) => option.selected)
      .map((option) => option.label)
      .slice(0, 3);
  }
}
