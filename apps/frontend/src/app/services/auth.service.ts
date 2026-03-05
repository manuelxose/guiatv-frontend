import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, map, switchMap, catchError } from 'rxjs/operators';
import { Observable, from, of, throwError } from 'rxjs';
import { UserService } from './user.service';
import { AuthSessionInfo } from '../interfaces/user.interface';

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
    role?: 'admin' | 'editor' | 'user';
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: AuthSessionInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private googleScriptLoaded = false;
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly accessTokenKey = 'gtv_id_token';
  private readonly refreshTokenKey = 'gtv_refresh_token';

  constructor(private http: HttpClient, private userService: UserService) {}

  private loadGoogleScript(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('Google Identity no esta disponible en SSR'));
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
      return throwError(() => new Error('Google Identity no disponible en SSR'));
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
                    finishReject(new Error('No se recibio credential de Google'));
                    return;
                  }
                  this.exchangeGoogleToken(idToken).subscribe({
                    next: (authResp) => {
                      this.userService.applySession(authResp.user, authResp.accessToken);
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
   * Login con email y contrasena.
   */
  loginWithPassword(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.exchangePasswordAuth('/auth/login', payload);
  }

  /**
   * Registro con email y contrasena.
   */
  registerWithPassword(payload: { name?: string; email: string; password: string }): Observable<AuthResponse> {
    return this.exchangePasswordAuth('/auth/register', payload);
  }

  /**
   * Envia el idToken al backend para validacion real.
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
          if (resp?.data?.accessToken) {
            this.persistSession(resp.data.accessToken, resp.data.refreshToken);
          }
        }),
        map((resp) => resp?.data as AuthResponse)
      );
  }

  private exchangePasswordAuth(
    path: string,
    payload: Record<string, unknown>
  ): Observable<AuthResponse> {
    const url = `${environment.API_BASE_URL}${path}`;
    return this.http
      .post<{ success: boolean; data: AuthResponse }>(url, payload, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
      .pipe(
        tap((resp) => {
          if (resp?.data?.accessToken) {
            this.persistSession(resp.data.accessToken, resp.data.refreshToken);
          }
        }),
        map((resp) => resp?.data as AuthResponse),
        tap((authResp) => {
          if (authResp?.user && authResp?.accessToken) {
            this.userService.applySession(authResp.user, authResp.accessToken);
          }
        })
      );
  }

  /**
   * Recupera el perfil desde backend usando el token almacenado.
   */
  fetchProfileFromToken(): Observable<AuthResponse | null> {
    const token = this.getStoredAccessToken();
    const token$ = token
      ? of(token)
      : this.refreshAccessToken().pipe(map((resp) => resp?.accessToken || null));

    return token$.pipe(
      switchMap((resolvedToken) => {
        if (!resolvedToken) return of(null);
        const url = `${environment.API_BASE_URL}/auth/me`;
        return this.http
          .get<{ success: boolean; data: AuthResponse['user'] }>(url, {
            headers: new HttpHeaders({
              Authorization: `Bearer ${resolvedToken}`,
            }),
          })
          .pipe(
            tap((resp) => {
              if (resp?.data) {
                this.userService.applySession(resp.data, resolvedToken);
              }
            }),
            map((resp) => {
              if (!resp?.data) return null;
              return {
                user: resp.data as AuthResponse['user'],
                accessToken: resolvedToken,
                refreshToken: this.getStoredRefreshToken() || '',
                expiresIn: 0,
                session: {
                  id: '',
                  createdAt: new Date().toISOString(),
                  expiresAt: new Date().toISOString(),
                },
              } as AuthResponse;
            })
          );
      }),
      catchError(() => of(null))
    );
  }

  refreshAccessToken(): Observable<AuthResponse | null> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    const url = `${environment.API_BASE_URL}/auth/refresh`;
    return this.http
      .post<{ success: boolean; data: AuthResponse }>(
        url,
        { refreshToken },
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }
      )
      .pipe(
        map((resp) => resp?.data || null),
        tap((resp) => {
          if (resp?.accessToken) {
            this.persistSession(resp.accessToken, resp.refreshToken);
            this.userService.applySession(resp.user, resp.accessToken);
          }
        }),
        catchError(() => of(null))
      );
  }

  logout(): void {
    const refreshToken = this.getStoredRefreshToken();
    if (refreshToken) {
      const url = `${environment.API_BASE_URL}/auth/logout`;
      this.http
        .post(
          url,
          { refreshToken },
          {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
          }
        )
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    this.persistSession('');
    this.userService.logout();
  }

  private persistSession(accessToken: string, refreshToken?: string) {
    if (!this.isBrowser) return;
    try {
      if (!accessToken) {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
      } else {
        localStorage.setItem(this.accessTokenKey, accessToken);
        if (refreshToken) {
          localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
      }
    } catch {
      // ignore storage errors (SSR or privacy mode)
    }
  }

  private getStoredAccessToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(this.accessTokenKey);
    } catch {
      return null;
    }
  }

  private getStoredRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(this.refreshTokenKey);
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
