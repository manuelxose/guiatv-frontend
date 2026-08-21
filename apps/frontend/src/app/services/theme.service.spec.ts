import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';
import { StorageService } from './storage.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let store: Record<string, string>;
  let htmlElement: HTMLElement;
  const setSystemPrefersDark = (dark: boolean) => {
    (window as any).__prefersDark = dark;
  };

  beforeEach(() => {
    store = {};
    htmlElement = document.documentElement;
    htmlElement.removeAttribute('data-theme');
    htmlElement.style.colorScheme = '';

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: StorageService,
          useValue: {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => {
              store[key] = value;
            },
            removeItem: (key: string) => {
              delete store[key];
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    delete (window as any).__prefersDark;
  });

  const createService = (): ThemeService => {
    const mockMatchMedia = (query: string): MediaQueryList =>
      ({
        matches: (window as any).__prefersDark === true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      } as unknown as MediaQueryList);

    spyOn(window, 'matchMedia').and.callFake(mockMatchMedia);
    return TestBed.inject(ThemeService);
  };

  it('defaults to system mode when nothing is stored', () => {
    setSystemPrefersDark(false);
    service = createService();
    expect(service.mode()).toBe('system');
  });

  it('reads a persisted mode', () => {
    store['guiatv-theme'] = 'dark';
    service = createService();
    expect(service.mode()).toBe('dark');
    expect(htmlElement.getAttribute('data-theme')).toBe('dark');
  });

  it('resolves system mode to the OS preference', () => {
    setSystemPrefersDark(true);
    service = createService();
    expect(service.mode()).toBe('system');
    expect(service.resolved).toBe('dark');
    expect(htmlElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists and applies an explicit mode', () => {
    setSystemPrefersDark(false);
    service = createService();
    service.setMode('light');
    expect(service.mode()).toBe('light');
    expect(store['guiatv-theme']).toBe('light');
    expect(htmlElement.getAttribute('data-theme')).toBe('light');
    expect(htmlElement.style.colorScheme).toBe('light');
  });

  it('toggles between concrete themes without a visually ambiguous system step', () => {
    service = createService();
    service.setMode('light');
    expect(service.toggle()).toBe('dark');
    expect(service.mode()).toBe('dark');
    expect(htmlElement.getAttribute('data-theme')).toBe('dark');
    expect(htmlElement.style.colorScheme).toBe('dark');
    expect(store['guiatv-theme']).toBe('dark');
    expect(service.toggle()).toBe('light');
    expect(service.mode()).toBe('light');
    expect(htmlElement.getAttribute('data-theme')).toBe('light');
  });

  it('turns a system preference into the opposite explicit resolved theme', () => {
    setSystemPrefersDark(false);
    service = createService();
    expect(service.mode()).toBe('system');
    expect(service.toggle()).toBe('dark');
    service.setMode('system');
    setSystemPrefersDark(true);
    expect(service.toggle()).toBe('light');
  });

  it('ignores an invalid stored value', () => {
    store['guiatv-theme'] = 'sepia';
    service = createService();
    expect(service.mode()).toBe('system');
  });

  it('removes the exact system listener when switching to an explicit mode', () => {
    let addedHandler: EventListenerOrEventListenerObject | undefined;
    let removedHandler: EventListenerOrEventListenerObject | undefined;
    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: (_type, handler) => (addedHandler = handler),
      removeEventListener: (_type, handler) => (removedHandler = handler),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList);

    service = TestBed.inject(ThemeService);
    service.setMode('dark');

    expect(addedHandler).toBeDefined();
    expect(removedHandler).toBe(addedHandler);
  });
});
