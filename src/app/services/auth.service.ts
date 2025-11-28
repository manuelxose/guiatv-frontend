import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs/operators';
import { Observable, from, of } from 'rxjs';
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
      return of({
        user: { id: 'ssr', email: 'ssr@guiatv', name: 'SSR' },
        token: '',
      });
    }

    const clientId = environment.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return of({
        user: { id: 'local', email: 'local@login', name: 'Falta clientId' },
        token: '',
      });
    }

    return from(
      this.loadGoogleScript().then(
        () =>
          new Promise<AuthResponse>((resolve, reject) => {
            try {
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                  const idToken = response?.credential;
                  if (!idToken) {
                    reject(new Error('No se recibió credential de Google'));
                    return;
                  }
                  this.exchangeGoogleToken(idToken).subscribe({
                    next: (authResp) => {
                      this.userService.applySession(authResp.user, authResp.token);
                      resolve(authResp);
                    },
                    error: (err) => reject(err),
                  });
                },
                cancel_on_tap_outside: true,
              });
              window.google.accounts.id.prompt();
            } catch (e) {
              reject(e);
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
}
