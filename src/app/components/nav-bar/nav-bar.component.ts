import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent {
  // Booleanos para saber en qué ruta estamos
  public isHome: boolean = false;
  public isGuiaCanales: boolean = false;
  public isSeries: boolean = false;
  public isPeliculas: boolean = false;
  public isDirecto: boolean = false;

  private unsuscribe$ = new Subject<void>();

  constructor(private router: Router) {
    // Suscribirse a los eventos del router
    this.router.events
      .pipe(takeUntil(this.unsuscribe$))
      .subscribe((event: any) => {
        if (event instanceof NavigationEnd) {
          // Resetear todos los booleanos
          this.isHome = false;
          this.isGuiaCanales = false;
          this.isSeries = false;
          this.isPeliculas = false;
          this.isDirecto = false;

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
            case 'en-directo':
              this.isDirecto = true;
              break;
            default:
              this.isHome = true;
              break;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }
}
