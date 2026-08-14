import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'guiatv-theme';
const THEME_ATTR = 'data-theme';

const MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Owns the application theme (light / dark / system).
 *
 * - Persists the *mode* (not the resolved value) through StorageService so the
 *   preference survives restarts and is SSR-safe (StorageService no-ops on the
 *   server).
 * - Mirrors the resolved value to `document.documentElement[data-theme]` and
 *   `color-scheme`, which is what design-tokens.scss keys off.
 * - For `system`, tracks `prefers-color-scheme` changes live.
 *
 * An inline script in index.html applies the same resolution before first
 * paint, so there is no light/dark flash during hydration.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** The user-selected mode (light / dark / system). */
  readonly mode = signal<ThemeMode>(this.readStoredMode());

  private systemMediaQuery: MediaQueryList | null = null;
  private readonly systemThemeChangeHandler = () => this.apply('system');

  constructor() {
    this.apply(this.mode());
  }

  /** Currently resolved concrete theme, for templates. */
  get resolved(): ResolvedTheme {
    return this.resolve(this.mode());
  }

  setMode(mode: ThemeMode): void {
    if (this.mode() === mode) {
      return;
    }
    this.mode.set(mode);
    this.storage.setItem(THEME_STORAGE_KEY, mode);
    this.apply(mode);
  }

  /** Cycles light → dark → system → light. */
  cycle(): ThemeMode {
    const current = this.mode();
    const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
    this.setMode(next);
    return next;
  }

  private readStoredMode(): ThemeMode {
    const raw = this.storage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : 'system';
  }

  private resolve(mode: ThemeMode): ResolvedTheme {
    if (mode === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return mode;
  }

  private systemPrefersDark(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return !!this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  private apply(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }
    const resolved = this.resolve(mode);
    const root = this.document.documentElement;
    root.setAttribute(THEME_ATTR, resolved);
    root.style.colorScheme = resolved;
    this.syncSystemListener(mode);
  }

  private syncSystemListener(mode: ThemeMode): void {
    if (mode !== 'system' || !this.isBrowser) {
      this.detachSystemListener();
      return;
    }
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) {
      return;
    }
    if (this.systemMediaQuery === media) {
      return;
    }
    this.detachSystemListener();
    this.systemMediaQuery = media;
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', this.systemThemeChangeHandler);
    } else if (typeof media.addListener === 'function') {
      // Older Safari fallback.
      media.addListener(this.systemThemeChangeHandler);
    }
    // Remove the listener when the service is torn down.
    this.destroyRef.onDestroy(() => this.detachSystemListener());
  }

  private detachSystemListener(): void {
    if (this.systemMediaQuery) {
      if (typeof this.systemMediaQuery.removeEventListener === 'function') {
        this.systemMediaQuery.removeEventListener('change', this.systemThemeChangeHandler);
      } else if (typeof this.systemMediaQuery.removeListener === 'function') {
        this.systemMediaQuery.removeListener(this.systemThemeChangeHandler);
      }
      this.systemMediaQuery = null;
    }
  }
}
