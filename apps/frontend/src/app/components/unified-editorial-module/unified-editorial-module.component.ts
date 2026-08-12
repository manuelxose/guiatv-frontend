import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EditorialPost } from '../../blog/models/editorial.models';
import { EditorialPostCardComponent } from '../../blog/components/editorial-post-card/editorial-post-card.component';
import { UnifiedSectionHeaderComponent } from '../unified-section-header/unified-section-header.component';

@Component({
  selector: 'app-unified-editorial-module',
  standalone: true,
  imports: [CommonModule, EditorialPostCardComponent, UnifiedSectionHeaderComponent],
  templateUrl: './unified-editorial-module.component.html',
  styleUrl: './unified-editorial-module.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedEditorialModuleComponent {
  @Input() eyebrow = '';
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() linkLabel = '';
  @Input() linkPath: string | any[] | null = null;
  @Input() posts: readonly EditorialPost[] = [];
  @Input() columns = 3;

  columnClass(): string {
    const normalized = Math.max(1, Math.min(4, Math.round(this.columns || 1)));
    return `editorial-module__grid--cols-${normalized}`;
  }

  trackByPost(_index: number, post: EditorialPost): string {
    return post.id;
  }
}
