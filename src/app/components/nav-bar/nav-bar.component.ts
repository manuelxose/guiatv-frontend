import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MenuComponent } from '../menu/menu.component';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuStateService } from '../../services/menu-state.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, MenuComponent],
})
export class NavBarComponent {
  // Booleanos para saber en qué ruta estamos
  public isHome: boolean = false;
  public isGuiaCanales: boolean = false;
  public isSeries: boolean = false;
  public isPeliculas: boolean = false;
  public isBlog: boolean = false;
  public isDirecto: boolean = false;

  private unsuscribe$ = new Subject<void>();

  constructor(private router: Router, public menuState: MenuStateService) {
    // Suscribirse al estado compartido del menú para mantener sincronía
    this.menuState
      .getActive()
      .pipe(takeUntil(this.unsuscribe$))
      .subscribe((k) => {
        this.isHome = k === 'home';
        this.isGuiaCanales = k === 'guia-canales';
        this.isSeries = k === 'series';
        this.isPeliculas = k === 'peliculas';
        this.isBlog = k === 'blog';
        this.isDirecto = k === 'en-directo';
      });
  }

  ngOnDestroy(): void {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }
}
