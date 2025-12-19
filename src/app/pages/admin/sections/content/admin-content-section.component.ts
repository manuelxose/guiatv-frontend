import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-content-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-content-section.component.html',
  styleUrls: ['./admin-content-section.component.scss'],
})
export class AdminContentSectionComponent {
  @Input() activeItem = 'channels';

  private readonly viewLabels: Record<
    string,
    { title: string; description: string }
  > = {
    channels: {
      title: 'Channels',
      description: 'Manage channel catalog, icons, and metadata.',
    },
    programs: {
      title: 'Programs',
      description: 'Audit program data, images, and category mapping.',
    },
    categories: {
      title: 'Categories',
      description: 'Control taxonomy and content grouping.',
    },
    assets: {
      title: 'Assets',
      description: 'Central library for posters, logos, and banners.',
    },
    layouts: {
      title: 'Layouts',
      description: 'Tune home modules and editorial layouts.',
    },
  };

  get viewTitle(): string {
    return this.viewLabels[this.activeItem]?.title || 'Content';
  }

  get viewDescription(): string {
    return this.viewLabels[this.activeItem]?.description || 'Manage content.';
  }
}
