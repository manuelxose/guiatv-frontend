import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavBarComponent } from '../../../components/nav-bar/nav-bar.component';
import { MenuStateService } from '../../../services/menu-state.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, NavBarComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  public statusMessage = '';
  public statusTone: 'success' | 'error' | 'info' = 'info';
  public loading = false;
  public isAuthenticated$ = this.userService.isAuthenticated$;

  constructor(
    private router: Router,
    private menuState: MenuStateService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.menuState.setActive('registro');
  }

  onGoogleRegister(): void {
    this.loading = true;
    this.statusTone = 'info';
    this.statusMessage = 'Abriendo autenticacion con Google...';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.statusTone = 'success';
        this.statusMessage = 'Cuenta creada. Redirigiendo...';
        this.menuState.setActive('mi-cuenta');
        this.router.navigateByUrl('/mi-cuenta');
      },
      error: (err) => {
        this.loading = false;
        this.statusTone = 'error';
        this.statusMessage =
          err?.message || 'No se pudo crear la cuenta con Google.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
