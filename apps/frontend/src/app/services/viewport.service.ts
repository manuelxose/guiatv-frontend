import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly widthSignal = signal(1440);

  readonly width = computed(() => this.widthSignal());
  readonly isMobile = computed(() => this.widthSignal() < 768);
  readonly isTablet = computed(() => this.widthSignal() >= 768 && this.widthSignal() < 1100);
  readonly isDesktop = computed(() => this.widthSignal() >= 1100);
  readonly hasPersistentLeftRail = computed(() => this.widthSignal() >= 1100);
  readonly hasPersistentRightRail = computed(() => this.widthSignal() >= 1280);
  readonly shouldShrinkTopNav = computed(() => this.widthSignal() < 1024);

  constructor() {
    // `matchMedia` isn't real during SSR (no actual viewport exists yet), so
    // BreakpointObserver would resolve every query to "not matched" there and
    // fall through to a hardcoded mobile guess — hiding the desktop chat
    // launcher (and other desktop-only UI) in the server-rendered HTML for
    // every visitor until client-side hydration corrects it. Only observe
    // real breakpoints in the browser; SSR keeps the safe desktop-first
    // default above so server and first client render agree.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.breakpointObserver
      .observe([
        '(max-width: 767.98px)',
        '(min-width: 768px) and (max-width: 1099.98px)',
        '(min-width: 1100px) and (max-width: 1279.98px)',
        '(min-width: 1280px)',
      ])
      .pipe(takeUntilDestroyed())
      .subscribe((state) => {
        const activeWidth = state.breakpoints['(min-width: 1280px)']
          ? 1280
          : state.breakpoints['(min-width: 1100px) and (max-width: 1279.98px)']
            ? 1100
            : state.breakpoints['(min-width: 768px) and (max-width: 1099.98px)']
              ? 768
              : 390;
        this.widthSignal.set(activeWidth);
      });
  }
}
