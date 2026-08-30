import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserProfile } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss'],
})
export class AdminHeaderComponent {
  @Input() activeGroupLabel = '';
  @Input() activeItemLabel = '';
  @Input() activeItemDescription = '';
  @Input() lastUpdated: Date | null = null;
  @Input() mobileSidebarOpen = false;
  @Input() adminProfile: UserProfile | null = null;
  @Input() environmentLabel = 'Development';

  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
