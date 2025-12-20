import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavBarComponent } from '../../../components/nav-bar/nav-bar.component';
import { MenuStateService } from '../../../services/menu-state.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, NavBarComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public statusMessage = '';
  public statusTone: 'success' | 'error' | 'info' = 'info';
  public loading = false;
  public isAuthenticated$ = this.userService.isAuthenticated$;
  public credentials = { email: '', password: '' };

  constructor(
    private userService: UserService,
    private router: Router,
    private menuState: MenuStateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.menuState.setActive('iniciar-sesion');
  }

  onPasswordLogin(): void {
    const email = this.credentials.email.trim();
    const password = this.credentials.password;

    if (!email || !password) {
      this.statusTone = 'error';
      this.statusMessage = 'Completa email y contrasena.';
      return;
    }

    this.loading = true;
    this.statusTone = 'info';
    this.statusMessage = 'Validando credenciales...';
    this.authService.loginWithPassword({ email, password }).subscribe({
      next: () => {
        this.statusTone = 'success';
        this.statusMessage = 'Sesion iniciada. Redirigiendo...';
        this.menuState.setActive('mi-cuenta');
        this.router.navigateByUrl('/mi-cuenta');
      },
      error: (err) => {
        this.loading = false;
        this.statusTone = 'error';
        this.statusMessage =
          err?.message || 'No se pudo iniciar sesion con email.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onGoogleLogin(): void {
    this.loading = true;
    this.statusTone = 'info';
    this.statusMessage = 'Abriendo autenticacion con Google...';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.statusTone = 'success';
        this.statusMessage = 'Sesion iniciada con Google. Redirigiendo...';
        this.menuState.setActive('mi-cuenta');
        this.router.navigateByUrl('/mi-cuenta');
      },
      error: (err) => {
        this.loading = false;
        this.statusTone = 'error';
        this.statusMessage =
          err?.message || 'No se pudo iniciar sesion con Google.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
