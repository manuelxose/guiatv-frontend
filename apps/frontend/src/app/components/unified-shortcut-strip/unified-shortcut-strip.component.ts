import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Params } from '@angular/router';
import { RouterModule } from '@angular/router';

export interface UnifiedShortcutStripItem {
  label: string;
  path: string;
  description?: string;
  iconPath?: string;
  queryParams?: Params;
}

@Component({
  selector: 'app-unified-shortcut-strip',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './unified-shortcut-strip.component.html',
  styleUrl: './unified-shortcut-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedShortcutStripComponent {
  @Input() items: readonly UnifiedShortcutStripItem[] = [];

  trackByItem(_index: number, item: UnifiedShortcutStripItem): string {
    return `${item.path}-${item.label}`;
  }
}
