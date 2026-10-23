import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { ViewportService } from '../../services/viewport.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { UnifiedSearchComponent } from '../unified-search/unified-search.component';
import { UnifiedTopNavComponent } from './unified-top-nav.component';

describe('UnifiedTopNavComponent mobile search', () => {
  let fixture: ComponentFixture<UnifiedTopNavComponent>;
  const isMobile = signal(true);

  beforeEach(async () => {
    isMobile.set(true);
    await TestBed.configureTestingModule({
      imports: [UnifiedTopNavComponent],
      providers: [
        provideRouter([]),
        { provide: ViewportService, useValue: { isMobile, shouldShrinkTopNav: () => true } },
        { provide: ThemeService, useValue: { resolved: 'dark', toggle: () => undefined } },
      ],
    }).overrideComponent(UnifiedTopNavComponent, {
      remove: { imports: [UnifiedSearchComponent, NotificationBellComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    }).compileComponents();
    fixture = TestBed.createComponent(UnifiedTopNavComponent);
    fixture.detectChanges();
  });

  it('exposes the mobile search as a modal and releases it on Escape', () => {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Buscar"]');
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
    expect(document.body.classList.contains('portal-overlay-open')).toBeTrue();

    fixture.componentInstance.onEscape();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.classList.contains('portal-overlay-open')).toBeFalse();
  });

  it('releases the mobile scroll lock when switching to desktop', () => {
    fixture.componentInstance.openMobileSearch();
    fixture.detectChanges();
    isMobile.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.mobileSearchOpen()).toBeFalse();
    expect(document.body.classList.contains('portal-overlay-open')).toBeFalse();
  });

  it('releases the scroll lock when the header is destroyed', () => {
    fixture.componentInstance.openMobileSearch();
    fixture.detectChanges();
    fixture.destroy();
    expect(document.body.classList.contains('portal-overlay-open')).toBeFalse();
  });
});
