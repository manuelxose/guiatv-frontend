import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule,AutocompleteComponent,MenuComponent],
})
export class HeaderComponent {
  menuVisible = false; // Propiedad para controlar la visibilidad del menú
  accVisible = false; // Propiedad para controlar la visibilidad del menú
  offset: number = 0;
  headerHeight: number = 250;
  isAtTop = true;
  items: any[] = [];
  public isViewable = false;
  public renderer: Renderer2;
  public isHome: boolean = false;
  public isGuiaCanales: boolean = false;
  public isSeries: boolean = false;
  public isPeliculas: boolean = false;

  constructor(
    private rendererFactory: RendererFactory2,
    private router: Router
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    // Suscribirse a los eventos del router
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Resetear todos los booleanos
        this.isHome = false;
        this.isGuiaCanales = false;
        this.isSeries = false;
        this.isPeliculas = false;

        // Activar el booleano correspondiente a la ruta actual
        switch (this.router.url.split('/')[2]) {
          case 'home':
            this.isHome = true;
            break;
          case 'guia-canales':
            this.isGuiaCanales = true;
            break;
          case 'series':
            this.isSeries = true;
            break;
          case 'peliculas':
            this.isPeliculas = true;
            break;
          default:
            this.isHome = true;
            break;
        }
      }
    });
  }

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

  toggleMenu() {
    this.isViewable = !this.isViewable;
    if (this.isViewable) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    } else {
      this.renderer.removeStyle(document.body, 'overflow');
    }
  }
}
