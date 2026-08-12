import { Injectable, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly widthSignal = signal(1440);

  readonly width = computed(() => this.widthSignal());
  readonly isMobile = computed(() => this.widthSignal() < 768);
  readonly isTablet = computed(() => this.widthSignal() >= 768 && this.widthSignal() < 1100);
  readonly isDesktop = computed(() => this.widthSignal() >= 1100);
  readonly hasPersistentLeftRail = computed(() => this.widthSignal() >= 1100);
  readonly hasPersistentRightRail = computed(() => this.widthSignal() >= 1280);
  readonly shouldShrinkTopNav = computed(() => this.widthSignal() < 1024);

  constructor() {
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
