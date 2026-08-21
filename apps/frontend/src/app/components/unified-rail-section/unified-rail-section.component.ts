import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  UnifiedPortalRailItem,
  UnifiedPortalRailSection,
} from '../../models/portal-shell.models';

@Component({
  selector: 'app-unified-rail-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './unified-rail-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnifiedRailSectionComponent {
  readonly section = input.required<UnifiedPortalRailSection>();
  readonly contextual = input(false);
  readonly collapsed = input(false);
  readonly showActionLink = input(true);

  @Output() railAction = new EventEmitter<UnifiedPortalRailItem>();
  @Output() railNavigate = new EventEmitter<void>();

  trackByRailItem(_index: number, item: UnifiedPortalRailItem): string {
    return item.id;
  }

  optimizedImageUrl(url: string): string {
    return url.startsWith('https://image.tmdb.org/t/p/original/')
      ? url.replace('/t/p/original/', '/t/p/w185/')
      : url;
  }

  onAction(item: UnifiedPortalRailItem): void {
    this.railAction.emit(item);
  }

  onNavigate(): void {
    this.railNavigate.emit();
  }
}
