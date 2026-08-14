import { APP_PATHS, MOBILE_APP_TABS, normalizePath } from './route-map';

describe('route map', () => {
  it('defines exactly four distinct, actionable mobile product tabs', () => {
    expect(MOBILE_APP_TABS.length).toBe(4);
    expect(new Set(MOBILE_APP_TABS.map((tab) => tab.key)).size).toBe(4);
    expect(new Set(MOBILE_APP_TABS.map((tab) => tab.path)).size).toBe(4);
    MOBILE_APP_TABS.forEach((tab) => {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.path.startsWith('/')).toBeTrue();
      expect(tab.iconOutline).toBeTruthy();
      expect(tab.iconFilled).toBeTruthy();
    });
  });

  it('keeps the same four product destinations on mobile', () => {
    expect(MOBILE_APP_TABS.map((tab) => tab.path)).toContain(APP_PATHS.guide);
    expect(MOBILE_APP_TABS.map((tab) => tab.path)).toContain(APP_PATHS.explore);
    expect(MOBILE_APP_TABS.map((tab) => tab.path)).toContain(APP_PATHS.platforms);
    expect(MOBILE_APP_TABS.map((tab) => tab.path)).toContain(APP_PATHS.sports);
  });

  it('normalizes query strings, hashes, and trailing slashes', () => {
    expect(normalizePath('/deportes/?day=today#live')).toBe('/deportes');
    expect(normalizePath('')).toBe('/');
  });
});
