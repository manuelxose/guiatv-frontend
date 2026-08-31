import { catalogRobotsPolicy } from './catalog-indexability';

describe('catalogRobotsPolicy', () => {
  it('indexes first-party TV program detail pages', () => {
    expect(catalogRobotsPolicy({ source: 'program', contentType: 'program' })).toContain('index, follow');
  });

  it('indexes film and series pages only when GuíaTV contributes a current airing', () => {
    expect(catalogRobotsPolicy({ source: 'tmdb', contentType: 'movie', airings: [{}] })).toContain('index, follow');
    expect(catalogRobotsPolicy({ source: 'tmdb', contentType: 'series', airings: [] })).toBe('noindex, follow');
    expect(catalogRobotsPolicy({ source: 'tmdb', contentType: 'movie' })).toBe('noindex, follow');
  });
});
