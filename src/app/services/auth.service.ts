import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs/operators';
import { Observable, from, of, throwError } from 'rxjs';
import { UserService } from './user.service';

declare global {
  interface Window {
    google: any;
  }
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private googleScriptLoaded = false;
  private readonly isBrowser = typeof window !== 'undefined';

  constructor(private http: HttpClient, private userService: UserService) {}

  private loadGoogleScript(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('Google Identity no está disponible en SSR'));
    }

    if (this.googleScriptLoaded || typeof window.google !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.googleScriptLoaded = true;
        resolve();
      };
      script.onerror = () =>
        reject(new Error('No se pudo cargar Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /**
   * Lanza el flujo de login con Google, obtiene el idToken y lo valida en backend.
   */
  loginWithGoogle(): Observable<AuthResponse> {
    if (!this.isBrowser) {
      return throwError(
        () => new Error('Google Identity no disponible en SSR')
      );
    }

    const clientId = environment.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return throwError(() => new Error('Google client ID no configurado'));
    }

    return from(
      this.loadGoogleScript().then(
        () =>
          new Promise<AuthResponse>((resolve, reject) => {
            let settled = false;
            const finishResolve = (authResp: AuthResponse) => {
              if (settled) return;
              settled = true;
              resolve(authResp);
            };
            const finishReject = (error: unknown) => {
              if (settled) return;
              settled = true;
              reject(error);
            };

            try {
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                  const idToken = response?.credential;
                  if (!idToken) {
                    finishReject(
                      new Error('No se recibio credential de Google')
                    );
                    return;
                  }
                  this.exchangeGoogleToken(idToken).subscribe({
                    next: (authResp) => {
                      this.userService.applySession(authResp.user, authResp.token);
                      finishResolve(authResp);
                    },
                    error: (err) => finishReject(err),
                  });
                },
                cancel_on_tap_outside: true,
                cookie_policy: 'single_host_origin',
              });
              window.google.accounts.id.prompt((notification: any) => {
                if (settled || !notification) return;

                if (notification.isNotDisplayed?.()) {
                  finishReject(
                    new Error(
                      this.getPromptErrorMessage(
                        notification.getNotDisplayedReason?.()
                      )
                    )
                  );
                  return;
                }

                if (notification.isSkippedMoment?.()) {
                  finishReject(
                    new Error(
                      this.getPromptErrorMessage(
                        notification.getSkippedReason?.()
                      )
                    )
                  );
                  return;
                }

                if (notification.isDismissedMoment?.()) {
                  finishReject(new Error('Inicio de sesion cancelado.'));
                }
              });
            } catch (e) {
              finishReject(e);
            }
          })
      )
    );
  }

  /**
   * Envía el idToken al backend para validación real.
   */
  private exchangeGoogleToken(idToken: string): Observable<AuthResponse> {
    const url = `${environment.API_BASE_URL}/auth/google`;
    return this.http
      .post<{ success: boolean; data: AuthResponse }>(
        url,
        { idToken },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
          }),
        }
      )
      .pipe(
        tap((resp) => {
          if (resp?.data?.token) {
            this.persistToken(resp.data.token);
          }
        }),
        map((resp) => resp?.data as AuthResponse)
      );
  }

  /**
   * Recupera el perfil desde backend usando el token almacenado.
   */
  fetchProfileFromToken(): Observable<AuthResponse | null> {
    const token = this.getStoredToken();
    if (!token) return of(null);

    const url = `${environment.API_BASE_URL}/auth/me`;
    return this.http
      .get<{ success: boolean; data: AuthResponse['user'] }>(url, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .pipe(
        tap((resp) => {
          if (resp?.data) {
            this.userService.applySession(resp.data, token);
          }
        }),
        map((resp) => {
          if (!resp?.data) return null;
          return { user: resp.data as AuthResponse['user'], token };
        })
      );
  }

  logout(): void {
    this.persistToken('');
    this.userService.logout();
  }

  private persistToken(token: string) {
    if (!this.isBrowser) return;
    try {
      if (!token) {
        localStorage.removeItem('gtv_id_token');
      } else {
        localStorage.setItem('gtv_id_token', token);
      }
    } catch {
      // ignore storage errors (SSR or privacy mode)
    }
  }

  private getStoredToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem('gtv_id_token');
    } catch {
      return null;
    }
  }

  private getPromptErrorMessage(reason?: string): string {
    switch (reason) {
      case 'invalid_client':
      case 'unregistered_origin':
      case 'unauthorized_origin':
        return 'Origen no autorizado para este client ID. Revisa Google Cloud.';
      case 'missing_client_id':
        return 'Falta el client ID de Google.';
      case 'browser_not_supported':
        return 'Tu navegador no soporta el inicio de sesion con Google.';
      case 'opt_out_or_no_session':
        return 'No hay sesion activa de Google en el navegador.';
      case 'suppressed_by_user':
        return 'Google ha bloqueado el inicio de sesion en este navegador.';
      case 'issuing_failed':
        return 'No se pudo emitir el token de Google.';
      default:
        return 'No se pudo iniciar sesion con Google. Intenta de nuevo.';
    }
  }

}
