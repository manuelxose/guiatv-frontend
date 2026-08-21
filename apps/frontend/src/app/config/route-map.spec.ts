import { APP_PATHS, normalizePath } from './route-map';
import {
  PORTAL_BLOG_DESTINATIONS,
  PORTAL_MOBILE_MORE_DESTINATIONS,
  PORTAL_MOBILE_PRIMARY_DESTINATIONS,
  PORTAL_PLATFORM_DESTINATIONS,
  PORTAL_PRIMARY_DESTINATIONS,
  resolvePortalPrimaryDestination,
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

  it('defines the canonical desktop hierarchy and contextual children', () => {
    expect(PORTAL_PRIMARY_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'TV', 'Qué ver', 'Plataformas', 'Deportes', 'Blog',
    ]);
    expect(PORTAL_BLOG_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'Últimos', 'Guías', 'Rankings', 'Tendencias',
    ]);
    expect(PORTAL_PLATFORM_DESTINATIONS.map((tab) => tab.label)).toEqual(['Plataformas', 'Comparador']);
    expect(PORTAL_MOBILE_MORE_DESTINATIONS.map((tab) => tab.label)).toEqual(['Plataformas', 'Blog']);
  });

  it('resolves active primary destinations from canonical and detail routes', () => {
    expect(resolvePortalPrimaryDestination(APP_PATHS.blog)).toBe('editorial');
    expect(resolvePortalPrimaryDestination(APP_PATHS.top10)).toBe('editorial');
    expect(resolvePortalPrimaryDestination(APP_PATHS.stats)).toBe('editorial');
    expect(resolvePortalPrimaryDestination(APP_PATHS.streamingComparison)).toBe('streaming');
    expect(resolvePortalPrimaryDestination('/peliculas/una-pelicula')).toBe('discover');
  });

  it('normalizes query strings, hashes, and trailing slashes', () => {
    expect(normalizePath('/deportes/?day=today#live')).toBe('/deportes');
    expect(normalizePath('')).toBe('/');
  });
});
