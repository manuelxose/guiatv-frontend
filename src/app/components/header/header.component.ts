import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  menuVisible = false; // Propiedad para controlar la visibilidad del menú
  accVisible = false; // Propiedad para controlar la visibilidad del menú
  offset: number = 0;
  headerHeight: number = 250;
  isAtTop = true;
  items: any[] = [];

  constructor(private router: Router) {}

  @HostListener('window:scroll', ['$event'])
  handleScroll(event: Event) {
    this.offset = window.scrollY || document.documentElement.scrollTop;
    this.isAtTop = this.offset === 0;
  }

  get shouldShowHeader(): boolean {
    return this.offset > this.headerHeight;
  }

  ngOnInit() {
    this.items = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        routerLink: '/',
      },
      {
        label: 'Canales',
        icon: 'pi pi-video',
        routerLink: '/programacion-tv/guia-canales',
      },
      {
        label: 'Series',
        icon: 'pi pi-clock',
        routerLink: '/programacion-tv/series',
      },
      {
        label: 'Películas',
        icon: 'pi pi-television',
        routerLink: '/programacion-tv/peliculas',
      },
      // {
      //   label: 'Top 10',
      //   icon: 'pi pi-video',
      //   routerLink: '/top-10',
      // },
      // {
      //   label: 'Mi Lista',
      //   icon: 'pi pi-info',
      //   routerLink: '/acerca-de',
      // },
    ];
  }

  openMenu() {
    this.menuVisible = !this.menuVisible;
  }
  openAcc() {
    this.accVisible = !this.accVisible;
  }
}
