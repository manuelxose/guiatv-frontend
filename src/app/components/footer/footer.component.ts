import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class FooterComponent {
  currentYear: number;
  
  // Accordion state for mobile
  openSections: { [key: string]: boolean } = {
    explorar: false,
    legal: false,
    contacto: false
  };

  constructor() {
    this.currentYear = new Date().getFullYear();
  }

  toggleSection(section: string): void {
    this.openSections[section] = !this.openSections[section];
  }

  isOpen(section: string): boolean {
    return this.openSections[section] || false;
  }
}
