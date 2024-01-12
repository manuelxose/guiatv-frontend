import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  public isHome: boolean = false;
  public isGuiaCanales: boolean = false;
  public isSeries: boolean = false;
  public isPeliculas: boolean = false;
  public hoy: boolean = false;
  public top: boolean = false;

  private unsuscribe$ = new Subject<void>();

  constructor(private router: Router, private guiaTvService: TvGuideService) {
    // Suscribirse a los eventos del router
    this.router.events.pipe(takeUntil(this.unsuscribe$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Resetear todos los booleanos
        this.isHome = false;
        this.isGuiaCanales = false;
        this.isSeries = false;
        this.isPeliculas = false;
        this.top = false;
        this.hoy = false;
        console.log('La ruta: ', this.router.url.split('/')[2]);

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
            console.log('Es peliculas');
            this.isPeliculas = true;
            break;
          case 'que-ver-hoy':
            this.hoy = true;
            break;
          case 'top-10':
            this.top = true;
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

  public navigateTo() {
    this.guiaTvService.setIsMovies();
    this.router.navigate(['programacion-tv/que-ver-hoy']);
  }
}
