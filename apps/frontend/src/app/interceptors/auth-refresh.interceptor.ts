import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const ACCESS_TOKEN_KEY = 'gtv_id_token';
const REFRESH_TOKEN_KEY = 'gtv_refresh_token';
const RETRY_HEADER = 'x-gtv-auth-retry';

let refreshPromise: Promise<string | null> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function isAuthRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/google') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/password/')
  );
}

function isPrivateApiRoute(url: string): boolean {
  const safeUrl = String(url || '').toLowerCase();
  return (
    safeUrl.includes('/user/') ||
    safeUrl.includes('/social/') ||
    safeUrl.includes('/chat/') ||
    safeUrl.includes('/ai/chat')
  );
}

function readAccessToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function readRefreshToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeTokens(accessToken: string, refreshToken?: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    window.dispatchEvent(new CustomEvent('gtv-auth-restored'));
  } catch {
    // noop
  }
}

function clearTokens(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('gtv-auth-expired'));
  } catch {
    // noop
  }
}

function resolveApiBase(): string {
  const base = String(environment.API_BASE_URL || '').trim();
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base;
  }
  if (base.startsWith('/')) {
    if (isBrowser()) {
      return `${window.location.origin}${base}`;
    }
    return `http://127.0.0.1:4000${base}`;
  }
  return isBrowser() ? `${window.location.origin}/v2` : 'http://127.0.0.1:4000/v2';
}

async function refreshAccessToken(): Promise<string | null> {
  if (!isBrowser()) return null;
  const refreshToken = readRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    const baseUrl = resolveApiBase();
    window.dispatchEvent(new CustomEvent('gtv-auth-refreshing'));
    refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        const data = payload?.data;
        const nextAccess = data?.accessToken;
        const nextRefresh = data?.refreshToken;
        if (!nextAccess) return null;
        storeTokens(nextAccess, nextRefresh);
        return String(nextAccess);
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export const authRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isBrowser()) {
    return next(request);
  }

  if (refreshPromise && isPrivateApiRoute(request.url) && !isAuthRoute(request.url)) {
    return from(refreshPromise).pipe(
      switchMap((nextAccessToken) => {
        const deferred = nextAccessToken
          ? request.clone({
              setHeaders: {
                Authorization: `Bearer ${nextAccessToken}`,
              },
            })
          : request;
        return next(deferred);
      })
    );
  }

  const hasAuthHeader = request.headers.has('Authorization');
  const token = readAccessToken();
  const reqWithAuth =
    !hasAuthHeader && token
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : request;

  return next(reqWithAuth).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;
      if (
        httpError?.status !== 401 ||
        isAuthRoute(request.url) ||
        request.headers.get(RETRY_HEADER) === '1'
      ) {
        return throwError(() => error);
      }

      return from(refreshAccessToken()).pipe(
        switchMap((nextAccessToken) => {
          if (!nextAccessToken) {
            clearTokens();
            return throwError(() => error);
          }

          const retried = request.clone({
            setHeaders: {
              Authorization: `Bearer ${nextAccessToken}`,
              [RETRY_HEADER]: '1',
            },
          });

          return next(retried);
        }),
        catchError((refreshError) => {
          clearTokens();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
