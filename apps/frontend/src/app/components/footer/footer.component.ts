import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { APP_PATHS } from '../../config/route-map';

interface FooterLinkGroup {
  id: string;
  title: string;
  links: Array<{ label: string; path: string }>;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly highlightLinks = [
    { label: 'TV Directo', path: APP_PATHS.guide },
    { label: 'Qué Ver', path: APP_PATHS.explore },
    { label: 'Streaming', path: APP_PATHS.platforms },
    { label: 'Fútbol', path: APP_PATHS.sports },
  ];
  readonly groups: FooterLinkGroup[] = [
    {
      id: 'producto',
      title: 'Producto',
      links: [
        { label: 'Inicio', path: APP_PATHS.home },
        { label: 'TV Directo', path: APP_PATHS.guide },
        { label: 'Qué Ver Hoy', path: APP_PATHS.explore },
        { label: 'Plataformas', path: APP_PATHS.platforms },
        { label: 'Fútbol', path: APP_PATHS.sports },
      ],
    },
    {
      id: 'explorar',
      title: 'Explorar',
      links: [
        { label: 'Blog', path: APP_PATHS.blog },
        { label: 'Rankings', path: APP_PATHS.top10 },
        { label: 'Tendencias', path: APP_PATHS.stats },
        { label: 'Comparador', path: APP_PATHS.streamingComparison },
        { label: 'Series', path: APP_PATHS.series },
      ],
    },
    {
      id: 'cuenta',
      title: 'Cuenta',
      links: [
        { label: 'Perfil', path: APP_PATHS.profile },
        { label: 'Mi cuenta', path: APP_PATHS.account },
        { label: 'Acceder', path: APP_PATHS.login },
        { label: 'Crear cuenta', path: APP_PATHS.register },
      ],
    },
    {
      id: 'marca',
      title: 'Marca',
      links: [
        { label: 'Sobre nosotros', path: APP_PATHS.about },
        { label: 'Prensa', path: APP_PATHS.pressKit },
        { label: 'Widget', path: APP_PATHS.embed },
        { label: 'Desarrolladores', path: APP_PATHS.developers },
      ],
    },
  ];

  openSections: Record<string, boolean> = {
    producto: true,
    explorar: false,
    cuenta: false,
    marca: false,
  };

  toggleSection(sectionId: string): void {
    this.openSections[sectionId] = !this.openSections[sectionId];
  }

  isOpen(sectionId: string): boolean {
    return !!this.openSections[sectionId];
  }
}
