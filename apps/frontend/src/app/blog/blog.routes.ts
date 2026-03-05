import { Routes } from '@angular/router';
import { BlogLayoutComponent } from './layout/blog-layout.component';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    component: BlogLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/blog-home/blog-home.component').then(
            (m) => m.BlogHomeComponent
          ),
        data: {
          seo: {
            title: 'Blog de Cine, Series y Anime | Guía Programación',
            description:
              'Descubre los mejores artículos sobre cine, series y anime. Análisis, reseñas y noticias del mundo del entretenimiento.',
            keywords:
              'blog cine, series, anime, reseñas, noticias entretenimiento',
          },
        },
      },
      {
        path: 'top10',
        loadComponent: () =>
          import('./pages/top10/top10.component').then((m) => m.Top10Component),
        data: {
          seo: {
            title: 'Top 10 - Rankings de Cine, Series y Anime',
            description:
              'Los mejores rankings del cine, series y anime. Descubre las obras maestras y joyas ocultas de cada temporada.',
            keywords: 'top 10, rankings cine, mejores series, mejores anime',
          },
        },
      },
      {
        path: 'categoria/:slug',
        loadComponent: () =>
          import('./pages/category/category.component').then(
            (m) => m.CategoryComponent
          ),
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./pages/post-detail/post-detail.component').then(
            (m) => m.PostDetailComponent
          ),
      },
    ],
  },
];
