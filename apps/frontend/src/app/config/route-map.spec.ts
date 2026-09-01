import { APP_PATHS, normalizePath } from './route-map';
import {
  PORTAL_BLOG_DESTINATIONS,
  PORTAL_MOBILE_MORE_DESTINATIONS,
  PORTAL_MOBILE_PRIMARY_DESTINATIONS,
  PORTAL_PLATFORM_DESTINATIONS,
  PORTAL_PRIMARY_DESTINATIONS,
  PORTAL_DISCOVER_DESTINATIONS,
  PORTAL_SECTION_NAVIGATION,
  PORTAL_SPORTS_DESTINATIONS,
  PORTAL_TV_DESTINATIONS,
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
      'TV', 'Qué ver', 'Plataformas', 'Fútbol', 'Blog',
    ]);
    expect(PORTAL_BLOG_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'Últimos', 'Guías', 'Rankings', 'Tendencias',
    ]);
    expect(PORTAL_PLATFORM_DESTINATIONS.map((tab) => tab.label)).toEqual(['Plataformas', 'Comparador']);
    expect(PORTAL_TV_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'En emisión', 'A continuación', 'Esta noche', 'Parrilla',
    ]);
    expect(PORTAL_DISCOVER_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'Todo', 'En TV', 'Películas', 'Series', 'Gratis',
    ]);
    expect(PORTAL_SPORTS_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'Inicio', 'Partidos', 'Competiciones', 'Noticias',
    ]);
    expect(PORTAL_MOBILE_MORE_DESTINATIONS.map((tab) => tab.label)).toEqual([
      'Plataformas', 'Blog', 'Rankings', 'Tendencias',
    ]);
  });

  it('uses one canonical section model with route and action semantics', () => {
    expect(Object.keys(PORTAL_SECTION_NAVIGATION)).toEqual([
      'live', 'discover', 'platforms', 'sports', 'blog',
    ]);
    expect(PORTAL_SECTION_NAVIGATION.live.items.every((item) => item.kind === 'action')).toBeTrue();
    expect(PORTAL_SECTION_NAVIGATION.sports.items.every((item) => item.kind === 'route')).toBeTrue();
    expect(PORTAL_SECTION_NAVIGATION.sports.items.map((item) => item.label)).toEqual([
      'Inicio',
      'En directo',
      'Hoy',
      'Calendario',
      'Competiciones',
      'Noticias',
    ]);
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
