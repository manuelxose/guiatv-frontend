import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuStateService } from '../../services/menu-state.service';
import { UserService } from '../../services/user.service';
import { MenuComponent } from '../menu/menu.component';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { TvGuideService } from '../../services/tv-guide.service';


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, MenuComponent, RouterModule, AutocompleteComponent],
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
    public router: Router,
    public menuState: MenuStateService,
    private userService: UserService,
    private tvGuideService: TvGuideService
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

  navigateTo(path: string, key: string): void {
    // Set the active state
    this.menuState.setActive(key);
    
    // Set TV guide mode
    if (key === 'peliculas') {
      this.tvGuideService.setIsMovies();
    } else if (key === 'series') {
      this.tvGuideService.setIsSeries();
    }
    
    // Navigate
    this.router.navigateByUrl(path);
  }

  ngOnDestroy(): void {
    this.unsuscribe$.next();
    this.unsuscribe$.complete();
  }
}
