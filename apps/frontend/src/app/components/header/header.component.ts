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
import { MenuStateService } from '../../services/menu-state.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, AutocompleteComponent, MenuComponent],
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
    private router: Router,
    private menuState: MenuStateService
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

        // Activar el key del menú compartido según la URL
        const parts = this.router.url.split('/').filter(Boolean);
        const key = parts.length ? parts[parts.length - 1] : 'home';
        // Actualizar servicio compartido
        this.menuState?.setActive(key || 'home');
      }
    });
  }

  // menuState se inyecta en el constructor

  @HostListener('window:scroll', ['$event'])
  handleScroll(event: Event) {
    this.offset = window.scrollY || document.documentElement.scrollTop;
    this.isAtTop = this.offset === 0;
  }

  get shouldShowHeader(): boolean {
    return this.offset > this.headerHeight;
  }

  ngOnInit() {
    // Obtener subset de rutas para el header desde el servicio compartido
    this.items = this.menuState.getHeaderRoutes().map((r) => ({
      label: r.label,
      icon: '',
      routerLink: r.path,
      key: r.key,
    }));

    // suscribirse al activeKey para reflejar estado en el header
    this.menuState.getActive().subscribe((k) => {
      // actualizar banderas simples si las necesitas en el template
      this.isHome = k === 'home';
      this.isGuiaCanales = k === 'guia-canales';
      this.isSeries = k === 'series';
      this.isPeliculas = k === 'peliculas';
    });

    // Subscribe to mobile open state from MenuStateService
    this.menuState.getMobile().subscribe((open) => {
      this.isViewable = !!open;
      if (this.isViewable) {
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
      } else {
        this.renderer.removeStyle(document.body, 'overflow');
      }
    });
  }

  openMenu() {
    this.menuVisible = !this.menuVisible;
  }
  openAcc() {
    this.accVisible = !this.accVisible;
  }

  toggleMenu() {
    // keep local toggle but propagate to shared state
    this.menuState.toggleMobile();
  }

  // Navegar desde header y actualizar estado compartido
  public navigateFromHeader(item: any) {
    if (!item || !item.routerLink) return;
    this.router.navigateByUrl(item.routerLink).then(() => {
      if (item.key) this.menuState.setActive(item.key);
    });
  }
}
