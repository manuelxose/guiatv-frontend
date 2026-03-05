import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-placeholder-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-placeholder-section.component.html',
  styleUrls: ['./admin-placeholder-section.component.scss'],
})
export class AdminPlaceholderSectionComponent {
  @Input() title = 'Section';
}
