import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getItem(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures.
    }
  }

  removeItem(key: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }

  readJson<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
    if (!raw) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw) as T;
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  writeJson<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }
}
