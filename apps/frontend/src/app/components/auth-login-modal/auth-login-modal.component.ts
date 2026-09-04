import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';

@Component({
  selector: 'app-auth-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="loginModalService.isOpen$ | async"
      class="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      (click)="cancel()"
      (keydown.escape)="cancel()"
      tabindex="-1"
    >
      <section
        class="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[var(--shadow-lg)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
        >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.18em] text-[var(--portal-text-muted)]">Comunidad Guía TV</p>
            <h2 id="login-modal-title" class="text-xl font-semibold text-[var(--portal-text)] mt-1">
              Inicia sesión para seguir usuarios
            </h2>
          </div>
          <button
            type="button"
            (click)="cancel()"
            class="min-h-[36px] min-w-[36px] rounded-lg border border-[var(--portal-border)] text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
            aria-label="Cerrar login"
          >
            ✕
          </button>
        </div>

        <p class="text-sm text-[var(--portal-text-muted)] mt-3">
          Tu acción pendiente se aplicará automáticamente tras autenticarte.
        </p>

        <form class="space-y-3 mt-4" (ngSubmit)="onPasswordLogin()">
          <div>
            <label for="modal-login-email" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wide">Email</label>
            <input
              id="modal-login-email"
              name="email"
              type="email"
              required
              autocomplete="email"
              [(ngModel)]="credentials.email"
              class="mt-1.5 w-full min-h-[44px] rounded-lg border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] px-3 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label for="modal-login-password" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wide">Contraseña</label>
            <input
              id="modal-login-password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              [(ngModel)]="credentials.password"
              class="mt-1.5 w-full min-h-[44px] rounded-lg border border-[var(--portal-border)] bg-[var(--portal-bg-deep)] px-3 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-live)]"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading"
            class="w-full min-h-[44px] rounded-lg bg-[var(--accent-live-strong)] hover:opacity-90 text-[var(--spotify-white)] font-semibold disabled:opacity-60"
          >
            {{ loading ? 'Validando...' : 'Entrar con email' }}
          </button>
        </form>

        <button
          type="button"
          (click)="onGoogleLogin()"
          [disabled]="loading"
          class="w-full mt-3 min-h-[44px] rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] font-semibold hover:bg-[var(--portal-surface-strong)] disabled:opacity-60"
        >
          {{ loading ? 'Conectando...' : 'Continuar con Google' }}
        </button>

        <p
          *ngIf="statusMessage"
          class="mt-3 text-sm rounded-lg px-3 py-2 border"
          [ngClass]="{
            'text-[var(--accent-streaming)] bg-[var(--accent-streaming-soft)] border-transparent': statusTone === 'success',
            'text-[var(--accent-live)] bg-[var(--accent-live-soft)] border-transparent': statusTone === 'error',
            'text-[var(--accent-discover)] bg-[var(--accent-discover-soft)] border-transparent': statusTone === 'info'
          }"
        >
          {{ statusMessage }}
        </p>
      </section>
    </div>
  `,
})
export class AuthLoginModalComponent {
  public loading = false;
  public statusMessage = '';
  public statusTone: 'success' | 'error' | 'info' = 'info';
  public credentials = { email: '', password: '' };

  constructor(
    public loginModalService: LoginModalService,
    private authService: AuthService
  ) {}

  cancel(): void {
    this.loading = false;
    this.statusMessage = '';
    this.loginModalService.cancel();
  }

  onPasswordLogin(): void {
    const email = this.credentials.email.trim();
    const password = this.credentials.password;

    if (!email || !password) {
      this.statusTone = 'error';
      this.statusMessage = 'Completa email y contraseña.';
      return;
    }

    this.loading = true;
    this.statusTone = 'info';
    this.statusMessage = 'Validando credenciales...';
    this.authService.loginWithPassword({ email, password }).subscribe({
      next: () => {
        this.statusTone = 'success';
        this.statusMessage = 'Sesión iniciada.';
        this.loading = false;
        this.loginModalService.complete(true);
      },
      error: (err) => {
        this.loading = false;
        this.statusTone = 'error';
        this.statusMessage = err?.message || 'No se pudo iniciar sesión con email.';
      },
    });
  }

  onGoogleLogin(): void {
    this.loading = true;
    this.statusTone = 'info';
    this.statusMessage = 'Abriendo autenticación con Google...';
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.statusTone = 'success';
        this.statusMessage = 'Sesión iniciada con Google.';
        this.loading = false;
        this.loginModalService.complete(true);
      },
      error: (err) => {
        this.loading = false;
        this.statusTone = 'error';
        this.statusMessage = err?.message || 'No se pudo iniciar sesión con Google.';
      },
    });
  }
}
