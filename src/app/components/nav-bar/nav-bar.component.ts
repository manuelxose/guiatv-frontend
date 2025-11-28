import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuStateService } from '../../services/menu-state.service';
import { UserService } from '../../services/user.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, MenuComponent, RouterModule],
})
export class NavBarComponent implements OnDestroy {
  public isHome = false;
  public isGuiaCanales = false;
  public isSeries = false;
  public isPeliculas = false;
  public isBlog = false;
  public isDirecto = false;
  public isCuenta = false;
  public isLogin = false;
  public isAuthenticated$ = this.userService.isAuthenticated$;

  private unsuscribe$ = new Subject<void>();

  constructor(
    private router: Router,
    public menuState: MenuStateService,
    private userService: UserService
  ) {
    this.menuState
      .getActive()
      .pipe(takeUntil(this.unsuscribe$))
      .subscribe((key) => {
        this.isHome = key === 'home';
        this.isGuiaCanales = key === 'guia-canales';
        this.isSeries = key === 'series';
        this.isPeliculas = key === 'peliculas';
        this.isBlog = key === 'blog';
        this.isDirecto = key === 'en-directo';
        this.isCuenta = key === 'mi-cuenta';
        this.isLogin = key === 'iniciar-sesion';
      });
  }

  ngOnDestroy(): void {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }
}
