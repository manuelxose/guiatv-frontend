import { optimizeCardImageUrl } from './unified-program-card.component';

describe('optimizeCardImageUrl', () => {
  it('uses a card-sized TMDB variant instead of the original asset', () => {
    expect(
      optimizeCardImageUrl('https://image.tmdb.org/t/p/original/example.jpg')
    ).toBe('https://image.tmdb.org/t/p/w780/example.jpg');
  });

  it('preserves non-TMDB sources', () => {
    const source = 'https://www.movistarplus.es/recorte/n/dispficha/example';
    expect(optimizeCardImageUrl(source)).toBe(source);
  });
});
