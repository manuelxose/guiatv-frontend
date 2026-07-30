import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/blog-home/blog-home.component').then(
            (m) => m.BlogHomeComponent
          ),
      },
      {
        path: 'rankings',
        loadComponent: () =>
          import('./pages/top10/top10.component').then((m) => m.Top10Component),
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
