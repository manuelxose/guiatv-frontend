import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unified-section-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './unified-section-header.component.html',
  styleUrl: './unified-section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedSectionHeaderComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() linkLabel = '';
  @Input() linkPath: string | any[] | null = null;
  @Input() linkQueryParams: Record<string, string> | null = null;
}
