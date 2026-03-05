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

  public readonly statusClasses: Record<string, string> = {
    draft: 'border-amber-500/40 text-amber-200 bg-amber-500/10',
    published: 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10',
    scheduled: 'border-blue-500/40 text-blue-200 bg-blue-500/10',
    archived: 'border-slate-600/40 text-slate-300 bg-slate-500/10',
  };

  private readonly contentSummary: Record<
    string,
    { total: number; draft: number; warnings: number; updated: string }
  > = {
    channels: { total: 128, draft: 6, warnings: 2, updated: '2m ago' },
    programs: { total: 3420, draft: 42, warnings: 11, updated: '8m ago' },
    categories: { total: 42, draft: 3, warnings: 0, updated: '1h ago' },
    assets: { total: 965, draft: 18, warnings: 5, updated: '12m ago' },
    layouts: { total: 14, draft: 2, warnings: 1, updated: '30m ago' },
  };

  private readonly contentRows: Record<
    string,
    Array<{
      title: string;
      status: string;
      author: string;
      createdAt: string;
      updatedAt: string;
      meta: string;
    }>
  > = {
    channels: [
      {
        title: 'HBO Max',
        status: 'published',
        author: 'R. Gomez',
        createdAt: 'Nov 12',
        updatedAt: 'Today 09:12',
        meta: 'US | 124 programs',
      },
      {
        title: 'Discovery',
        status: 'draft',
        author: 'M. Ruiz',
        createdAt: 'Nov 10',
        updatedAt: 'Today 08:30',
        meta: 'LatAm | 78 programs',
      },
      {
        title: 'National Geo',
        status: 'published',
        author: 'A. Perez',
        createdAt: 'Nov 08',
        updatedAt: 'Yesterday 19:40',
        meta: 'Global | 56 programs',
      },
      {
        title: 'Fox Sports',
        status: 'scheduled',
        author: 'J. Lee',
        createdAt: 'Nov 07',
        updatedAt: 'Yesterday 16:10',
        meta: 'US | 34 programs',
      },
    ],
    programs: [
      {
        title: 'Late Night Show',
        status: 'published',
        author: 'N. Diaz',
        createdAt: 'Nov 12',
        updatedAt: 'Today 10:20',
        meta: 'Entertainment | 45m',
      },
      {
        title: 'World News',
        status: 'published',
        author: 'L. Mora',
        createdAt: 'Nov 11',
        updatedAt: 'Today 09:01',
        meta: 'News | 30m',
      },
      {
        title: 'Retro Cinema',
        status: 'draft',
        author: 'K. Chen',
        createdAt: 'Nov 09',
        updatedAt: 'Yesterday 14:05',
        meta: 'Movies | 120m',
      },
      {
        title: 'Weekend Sports',
        status: 'scheduled',
        author: 'C. Silva',
        createdAt: 'Nov 08',
        updatedAt: 'Yesterday 11:30',
        meta: 'Sports | 90m',
      },
    ],
    categories: [
      {
        title: 'Drama',
        status: 'published',
        author: 'M. Ruiz',
        createdAt: 'Oct 28',
        updatedAt: 'Nov 10',
        meta: '142 programs',
      },
      {
        title: 'Documentary',
        status: 'published',
        author: 'L. Mora',
        createdAt: 'Oct 30',
        updatedAt: 'Nov 09',
        meta: '96 programs',
      },
      {
        title: 'Kids',
        status: 'draft',
        author: 'S. Park',
        createdAt: 'Nov 02',
        updatedAt: 'Nov 08',
        meta: '64 programs',
      },
    ],
    assets: [
      {
        title: 'Hero banner - Weekend',
        status: 'published',
        author: 'A. Perez',
        createdAt: 'Nov 10',
        updatedAt: 'Today 07:20',
        meta: 'PNG | 1.2MB',
      },
      {
        title: 'Channel logo pack',
        status: 'published',
        author: 'J. Lee',
        createdAt: 'Nov 08',
        updatedAt: 'Yesterday 18:42',
        meta: 'SVG | 24 files',
      },
      {
        title: 'Sports highlight cover',
        status: 'draft',
        author: 'M. Ruiz',
        createdAt: 'Nov 05',
        updatedAt: 'Yesterday 13:58',
        meta: 'JPG | 860KB',
      },
    ],
    layouts: [
      {
        title: 'Prime time carousel',
        status: 'published',
        author: 'C. Silva',
        createdAt: 'Nov 11',
        updatedAt: 'Today 09:40',
        meta: 'Homepage v4',
      },
      {
        title: 'Weekend picks',
        status: 'scheduled',
        author: 'N. Diaz',
        createdAt: 'Nov 09',
        updatedAt: 'Yesterday 17:05',
        meta: 'Homepage v4',
      },
      {
        title: 'Breaking news strip',
        status: 'draft',
        author: 'A. Perez',
        createdAt: 'Nov 06',
        updatedAt: 'Yesterday 10:15',
        meta: 'Homepage v4',
      },
    ],
  };

  get summary(): { total: number; draft: number; warnings: number; updated: string } {
    return this.contentSummary[this.activeItem] || {
      total: 0,
      draft: 0,
      warnings: 0,
      updated: '-',
    };
  }

  get rows(): Array<{
    title: string;
    status: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    meta: string;
  }> {
    return this.contentRows[this.activeItem] || [];
  }
}
