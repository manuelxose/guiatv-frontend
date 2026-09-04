import { firstValueFrom, of, throwError } from 'rxjs';
import { EditorialService } from './editorial.service';

function rawPost(
  id: number,
  title: string,
  category: string,
  options: { featured?: boolean; contentType?: 'guide' | 'ranking' | 'trend' } = {}
): any {
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    slug,
    title: { rendered: title },
    excerpt: { rendered: `<p>Resumen de ${title}</p>` },
    content: { rendered: `<p>Contenido de ${title}</p>` },
    date: `2026-08-${String(20 + id).padStart(2, '0')}T10:00:00.000Z`,
    featured: options.featured,
    contentType: options.contentType || 'guide',
    categories_name: [{ id, name: category, slug: categorySlug }],
  };
}

describe('EditorialService', () => {
  it('propagates API failures so the editorial surface can offer recovery', async () => {
    const service = new EditorialService(
      { getAllPosts: () => throwError(() => new Error('API unavailable')) } as any
    );

    await expectAsync(firstValueFrom(service.getPosts())).toBeRejectedWithError(
      'API unavailable'
    );
  });

  it('builds a distinct latest block and orders core editorial taxonomies', async () => {
    const portada = rawPost(1, 'Portada', 'Televisión', { featured: true });
    portada.author = { name: 'Redacción Guía TV', id: 'editorial' };
    const service = new EditorialService(
      {
        getAllPosts: () => of([
          portada,
          rawPost(2, 'Estrenos de series', 'Series'),
          rawPost(3, 'Guía de plataformas', 'Streaming'),
          rawPost(4, 'Películas del fin de semana', 'Cine'),
          rawPost(5, 'Partidos de hoy', 'Fútbol'),
        ]),
      } as any
    );

    const state = await firstValueFrom(service.getHubState());

    expect((state as any).latestPosts.map((post: any) => post.title)).toEqual([
      'Partidos de hoy',
      'Películas del fin de semana',
      'Guía de plataformas',
      'Estrenos de series',
    ]);
    expect(state.categorySections.map((section) => section.category.name)).toEqual([
      'Cine',
      'Series',
      'Fútbol',
    ]);
    expect(state.hero?.author).toEqual({ name: 'Redacción Guía TV', id: 'editorial' });
  });

  it('does not repeat a multi-category story across equivalent hub sections', async () => {
    const shared = rawPost(2, 'Historia compartida', 'Cine');
    shared.categories_name = [
      { id: 2, name: 'Cine', slug: 'cine' },
      { id: 3, name: 'Películas', slug: 'peliculas' },
      { id: 4, name: 'Series', slug: 'series' },
    ];
    const service = new EditorialService(
      {
        getAllPosts: () => of([
          rawPost(1, 'Portada', 'Televisión', { featured: true }),
          shared,
          rawPost(3, 'Solo cine', 'Cine'),
          rawPost(4, 'Solo series', 'Series'),
        ]),
      } as any
    );

    const state = await firstValueFrom(service.getHubState());
    const sectionSlugs = state.categorySections.flatMap((section) =>
      section.posts.map((post) => post.slug)
    );

    expect(new Set(sectionSlugs).size).toBe(sectionSlugs.length);
    expect(state.categorySections.filter((section) =>
      ['cine', 'peliculas'].includes(section.category.slug)
    ).length).toBe(1);
  });

  it('uses thematic categories for ranking filters and sections', async () => {
    const seriesRanking = rawPost(1, 'Top series', 'Rankings', { contentType: 'ranking' });
    seriesRanking.categories_name.push({ id: 11, name: 'Series', slug: 'series' });
    const movieRanking = rawPost(2, 'Top películas', 'Rankings', { contentType: 'ranking' });
    movieRanking.categories_name.push({ id: 12, name: 'Películas', slug: 'peliculas' });
    const service = new EditorialService(
      { getAllPosts: () => of([seriesRanking, movieRanking]) } as any
    );

    const state = await firstValueFrom(service.getRankingsPageState());

    expect(state.categories.map((category) => category.slug)).toEqual([
      'peliculas',
      'series',
    ]);
    expect(state.sections.map((section) => section.category.slug)).toEqual([
      'peliculas',
      'series',
    ]);
  });

  it('does not repeat featured or ranking stories in a category archive', async () => {
    const featured = rawPost(1, 'Ranking destacado', 'Cine', {
      featured: true,
      contentType: 'ranking',
    });
    const secondaryRanking = rawPost(2, 'Otro ranking', 'Cine', {
      contentType: 'ranking',
    });
    const guide = rawPost(3, 'Guía de cine', 'Cine');
    const service = new EditorialService(
      { getAllPosts: () => of([featured, secondaryRanking, guide]) } as any
    );

    const state = await firstValueFrom(service.getCategoryPageState('cine'));

    expect(state?.featuredPost?.slug).toBe(featured.slug);
    expect(state?.relatedRankings.map((post) => post.slug)).toEqual([
      secondaryRanking.slug,
    ]);
    expect(state?.posts.map((post) => post.slug)).toEqual([guide.slug]);
  });

  it('builds stable contents navigation for long articles with real headings', async () => {
    const article = rawPost(1, 'Guía extensa', 'Guías');
    const longParagraph = `<p>${'contenido '.repeat(1100)}</p>`;
    article.content.rendered = [
      '<h2>Cómo elegir plataforma</h2>',
      longParagraph,
      '<h3>Precio y catálogo</h3>',
      longParagraph,
      '<h2>Qué ver esta semana</h2>',
      longParagraph,
    ].join('');
    const service = new EditorialService(
      { getAllPosts: () => of([article]) } as any
    );

    const [post] = await firstValueFrom(service.getPosts());

    expect(post.tocItems).toEqual([
      { id: 'como-elegir-plataforma', label: 'Cómo elegir plataforma', level: 2 },
      { id: 'precio-y-catalogo', label: 'Precio y catálogo', level: 3 },
      { id: 'que-ver-esta-semana', label: 'Qué ver esta semana', level: 2 },
    ]);
    expect(post.contentHtml).toContain('<h2 id="como-elegir-plataforma">');
  });

  it('adapts the editorial monetization fields, defaulting affiliatePlacementMode to auto and arrays to empty', async () => {
    const article = rawPost(1, 'Mejores Smart TV para el fútbol', 'Guías');
    article.affiliatePlacementMode = 'MANUAL';
    article.relatedOfferCategories = ['Smart-TV', ' device '];
    article.relatedMerchantKeys = ['pccomponentes'];
    article.manualAffiliateOfferIds = ['offer-1'];
    const service = new EditorialService({ getAllPosts: () => of([article]) } as any);

    const [post] = await firstValueFrom(service.getPosts());

    expect(post.affiliatePlacementMode).toBe('manual');
    expect(post.relatedOfferCategories).toEqual(['Smart-TV', 'device']);
    expect(post.relatedMerchantKeys).toEqual(['pccomponentes']);
    expect(post.manualAffiliateOfferIds).toEqual(['offer-1']);
  });

  it('defaults a post written before Phase 8 (no monetization fields at all) to auto mode with empty arrays', async () => {
    const article = rawPost(1, 'Artículo antiguo', 'Guías');
    const service = new EditorialService({ getAllPosts: () => of([article]) } as any);

    const [post] = await firstValueFrom(service.getPosts());

    expect(post.affiliatePlacementMode).toBe('auto');
    expect(post.relatedOfferCategories).toEqual([]);
    expect(post.relatedMerchantKeys).toEqual([]);
    expect(post.manualAffiliateOfferIds).toEqual([]);
  });

  it('falls back to auto for an unrecognized affiliatePlacementMode value', async () => {
    const article = rawPost(1, 'Artículo corrupto', 'Guías');
    article.affiliatePlacementMode = 'sometimes';
    const service = new EditorialService({ getAllPosts: () => of([article]) } as any);

    const [post] = await firstValueFrom(service.getPosts());

    expect(post.affiliatePlacementMode).toBe('auto');
  });
});
