import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-unified-skeleton-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-skeleton-block.component.html',
  styleUrl: './unified-skeleton-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedSkeletonBlockComponent {
  @Input() count = 3;
  @Input() columns = 3;
  @Input() cardHeight = '14rem';

  columnClass(): string {
    const normalized = Math.max(1, Math.min(4, Math.round(this.columns || 1)));
    return `skeleton-block--cols-${normalized}`;
  }

  items(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_value, index) => index);
  }
}
