import { APP_PATHS, normalizePath } from './route-map';
import {
  PORTAL_EXPLORE_DESTINATIONS,
  PORTAL_MOBILE_PRIMARY_DESTINATIONS,
} from './portal-navigation.config';

describe('route map', () => {
  it('defines five deliberate mobile destinations from the shared portal model', () => {
    expect(PORTAL_MOBILE_PRIMARY_DESTINATIONS.map((tab) => tab.id)).toEqual([
      'home', 'live', 'sports', 'discover', 'more',
    ]);
    PORTAL_MOBILE_PRIMARY_DESTINATIONS.forEach((tab) => {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.iconPath).toBeTruthy();
    });
  });

  it('keeps editorial and rankings reachable from the shared More model', () => {
    expect(PORTAL_EXPLORE_DESTINATIONS.map((tab) => tab.path)).toContain(APP_PATHS.blog);
    expect(PORTAL_EXPLORE_DESTINATIONS.map((tab) => tab.path)).toContain(APP_PATHS.top10);
  });

  it('normalizes query strings, hashes, and trailing slashes', () => {
    expect(normalizePath('/deportes/?day=today#live')).toBe('/deportes');
    expect(normalizePath('')).toBe('/');
  });
});
