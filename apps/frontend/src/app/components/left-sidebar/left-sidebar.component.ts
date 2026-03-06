import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_PATHS } from '../../config/route-map';

type ContextRailMode = 'guide' | 'catalog' | null;

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './left-sidebar.component.html',
  styleUrls: ['./left-sidebar.component.scss'],
})
export class LeftSidebarComponent {
  @Input() mode: ContextRailMode = null;
  @Input() currentPath: string = APP_PATHS.explore;

  public readonly guideSections = [
    { label: 'Ahora', fragment: 'guide-now' },
    { label: 'Siguiente', fragment: 'guide-next' },
    { label: 'Esta noche', fragment: 'guide-tonight' },
    { label: 'Canales', fragment: 'guide-directory' },
  ];

  public readonly guideCategories = [
    { label: 'TDT', fragment: 'guide-cat-tdt' },
    { label: 'Movistar+', fragment: 'guide-cat-movistar' },
    { label: 'Online', fragment: 'guide-cat-online' },
    { label: 'Autonómicos', fragment: 'guide-cat-autonomico' },
    { label: 'Deportes', fragment: 'guide-cat-deporte' },
  ];

  public readonly catalogShortcuts = [
    { label: 'Todo', queryParams: {} },
    { label: 'TV', queryParams: { types: 'program' } },
    { label: 'Streaming', queryParams: { types: 'movie,series', availability: 'streaming' } },
    { label: 'Gratis', queryParams: { availability: 'free' } },
    { label: 'Esta noche', queryParams: { timeSlot: '6' } },
  ];

  public readonly platformShortcuts = [
    'Netflix',
    'Prime Video',
    'Disney+',
    'Max',
    'Movistar+',
    'Filmin',
  ];

  get isGuideMode(): boolean {
    return this.mode === 'guide';
  }

  get isCatalogMode(): boolean {
    return this.mode === 'catalog';
  }
}
