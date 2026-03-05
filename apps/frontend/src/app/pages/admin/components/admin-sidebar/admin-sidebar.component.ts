import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminGroupId, AdminNavGroup } from '../../admin.types';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent {
  @Input() navGroups: AdminNavGroup[] = [];
  @Input() activeGroup: AdminGroupId = 'analytics';
  @Input() activeItem = '';
  @Input() sidebarOpen = false;
  @Input() environmentLabel = 'Development';

  @Output() sectionSelected = new EventEmitter<{
    group: AdminGroupId;
    item: string;
  }>();

  selectSection(group: AdminGroupId, item: string): void {
    this.sectionSelected.emit({ group, item });
  }

  isActive(group: AdminGroupId, item: string): boolean {
    return this.activeGroup === group && this.activeItem === item;
  }
}
