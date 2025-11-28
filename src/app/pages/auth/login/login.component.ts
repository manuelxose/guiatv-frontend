import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { NavBarComponent } from '../../../components/nav-bar/nav-bar.component';
import { MenuStateService } from '../../../services/menu-state.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavBarComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  public quickProfileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    favoriteGenres: [''],
    bio: ['', [Validators.maxLength(160)]],
    shareActivity: [true],
  });

  public statusMessage = '';
  public loading = false;
  public isAuthenticated$ = this.userService.isAuthenticated$;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private menuState: MenuStateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.menuState.setActive('iniciar-sesion');

    this.userService
      .getProfile()
      .pipe(take(1))
      .subscribe((profile) => {
        this.quickProfileForm.patchValue({
          name: profile.name,
          username: profile.username,
          favoriteGenres: profile.favoriteGenres.join(', '),
          bio: profile.bio,
          shareActivity: profile.privacy.shareActivity,
        });
      });
  }

  submitLogin(): void {
    // El login por email se implementará cuando el backend lo exponga.
    this.statusMessage =
      'Usa el botón "Continuar con Google" para entrar (email llegará después).';
  }

  onGoogleLogin(): void {
    this.loading = true;
    this.statusMessage = 'Abriendo autenticación con Google...';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.statusMessage = 'Sesión iniciada con Google. Redirigiendo...';
        this.menuState.setActive('mi-cuenta');
        this.router.navigateByUrl('/mi-cuenta');
      },
      error: (err) => {
        this.statusMessage =
          err?.message || 'No se pudo iniciar sesión con Google.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  saveQuickProfile(): void {
    if (this.quickProfileForm.invalid) {
      this.quickProfileForm.markAllAsTouched();
      return;
    }

    const { name, username, favoriteGenres, bio, shareActivity } =
      this.quickProfileForm.value;

    this.userService.updateProfile({
      name: name || '',
      username: username || '',
      bio: bio || '',
      favoriteGenres: (favoriteGenres || '')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
    });

    this.userService.updatePrivacy({ shareActivity: !!shareActivity });

    this.statusMessage =
      'Perfil actualizado. Estos datos se sincronizarán con el backend.';
  }
}
