import { Request, Response, NextFunction } from 'express';

/**
 * Mock controller that serves blog-like content from static fixtures.
 */
export class BlogController {
  private readonly mockPosts = [
    {
      id: 1,
      date: new Date().toISOString(),
      date_gmt: new Date().toISOString(),
      guid: { rendered: 'http://guiatv.mock/?p=1' },
      modified: new Date().toISOString(),
      modified_gmt: new Date().toISOString(),
      slug: 'top-10-series-maraton',
      status: 'publish',
      type: 'post',
      link: 'http://guiatv.mock/top-10-series-maraton',
      title: { rendered: 'Top 10 series para maratonear este finde' },
      content: {
        rendered:
          '<p>Descubre las mejores series para ver este fin de semana. Desde thrillers apasionantes hasta comedias ligeras.</p>',
        protected: false,
      },
      excerpt: {
        rendered:
          '<p>Selección rápida con thriller, comedia y true crime listas en streaming.</p>',
        protected: false,
      },
      author: 1,
      featured_media: 10,
      comment_status: 'open',
      ping_status: 'open',
      sticky: false,
      template: '',
      format: 'standard',
      meta: [],
      categories: [1],
      tags: [],
      image: {
        url: 'https://picsum.photos/seed/series/800/600',
        aspectRatio: 1.6,
      },
    },
    {
      id: 2,
      date: new Date().toISOString(),
      date_gmt: new Date().toISOString(),
      guid: { rendered: 'http://guiatv.mock/?p=2' },
      modified: new Date().toISOString(),
      modified_gmt: new Date().toISOString(),
      slug: 'que-ver-hoy-prime-time',
      status: 'publish',
      type: 'post',
      link: 'http://guiatv.mock/que-ver-hoy-prime-time',
      title: { rendered: 'Qué ver hoy en prime time' },
      content: {
        rendered:
          '<p>Análisis completo de la programación estelar de hoy. No te pierdas los grandes estrenos.</p>',
        protected: false,
      },
      excerpt: {
        rendered:
          '<p>Películas y realities destacados de la noche en abierto.</p>',
        protected: false,
      },
      author: 1,
      featured_media: 11,
      comment_status: 'open',
      ping_status: 'open',
      sticky: false,
      template: '',
      format: 'standard',
      meta: [],
      categories: [2],
      tags: [],
      image: {
        url: 'https://picsum.photos/seed/primetime/800/600',
        aspectRatio: 1.6,
      },
    },
    {
      id: 3,
      date: new Date().toISOString(),
      date_gmt: new Date().toISOString(),
      guid: { rendered: 'http://guiatv.mock/?p=3' },
      modified: new Date().toISOString(),
      modified_gmt: new Date().toISOString(),
      slug: 'estrenos-vod-semana',
      status: 'publish',
      type: 'post',
      link: 'http://guiatv.mock/estrenos-vod-semana',
      title: { rendered: 'Recomendados VOD: estrenos de la semana' },
      content: {
        rendered:
          '<p>Lo mejor que llega a las plataformas de streaming esta semana. Netflix, HBO Max, Disney+ y más.</p>',
        protected: false,
      },
      excerpt: {
        rendered:
          '<p>Lo nuevo en Netflix, HBO Max y Disney+ que vale la pena.</p>',
        protected: false,
      },
      author: 1,
      featured_media: 12,
      comment_status: 'open',
      ping_status: 'open',
      sticky: false,
      template: '',
      format: 'standard',
      meta: [],
      categories: [3],
      tags: [],
      image: {
        url: 'https://picsum.photos/seed/vod/800/600',
        aspectRatio: 1.6,
      },
    },
  ];

  private readonly mockCategories = [
    {
      id: 1,
      count: 5,
      description: 'Noticias y novedades sobre series',
      link: 'http://guiatv.mock/category/series',
      name: 'Series',
      slug: 'series',
      taxonomy: 'category',
      parent: 0,
      meta: [],
    },
    {
      id: 2,
      count: 3,
      description: 'Programación de TV en abierto',
      link: 'http://guiatv.mock/category/tv-abierta',
      name: 'TV Abierta',
      slug: 'tv-abierta',
      taxonomy: 'category',
      parent: 0,
      meta: [],
    },
    {
      id: 3,
      count: 8,
      description: 'Estrenos en plataformas VOD',
      link: 'http://guiatv.mock/category/vod',
      name: 'VOD',
      slug: 'vod',
      taxonomy: 'category',
      parent: 0,
      meta: [],
    },
  ];

  public getPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { slug, limit } = req.query;

      if (slug) {
        const post = this.mockPosts.find((p) => p.slug === slug);
        res.json(post ? [post] : []);
        return;
      }

      let posts = [...this.mockPosts];
      if (limit) {
        posts = posts.slice(0, Number(limit));
      }

      res.json(posts);
    } catch (error) {
      next(error);
    }
  };

  public getCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      void req;
      res.json(this.mockCategories);
    } catch (error) {
      next(error);
    }
  };
}
