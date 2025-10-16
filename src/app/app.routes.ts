import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Inicio - Guía TV'
  },
  {
    path: 'series',
    loadComponent: () => import('./pages/series/series.component').then(m => m.SeriesComponent),
    title: 'Series - Guía TV'
  },
  {
    path: 'peliculas',
    loadComponent: () => import('./pages/peliculas/peliculas.component').then(m => m.PeliculasComponent),
    title: 'Películas - Guía TV'
  },
  {
    path: 'guia-canales',
    loadComponent: () => import('./pages/lista-canales/lista-canales.component').then(m => m.ListaCanalesComponent),
    title: 'Guía de Canales - Guía TV'
  },
  {
    path: 'que-ver-hoy',
    loadComponent: () => import('./pages/lista-destacadas/lista-destacadas.component').then(m => m.ListaDestacadasComponent),
    title: 'Qué Ver Hoy - Guía TV'
  },
  {
    path: 'ver-canal/:id',
    loadComponent: () => import('./pages/canal-completo/canal-completo.component').then(m => m.CanalCompletoComponent),
    title: 'Canal - Guía TV'
  },
  {
    path: 'detalles/:id',
    loadComponent: () => import('./pages/blog-details/blog-details.component').then(m => m.BlogDetailsComponent),
    title: 'Detalles - Guía TV'
  },
  {
    path: 'noticias',
    loadComponent: () => import('./pages/blog-noticias/blog-noticias.component').then(m => m.BlogNoticiasComponent),
    title: 'Noticias - Guía TV'
  },
  {
    path: 'en-directo',
    loadComponent: () => import('./pages/ahora-directo/ahora-directo.component').then(m => m.AhoraDirectoComponent),
    title: 'En Directo - Guía TV'
  },
  {
    path: 'top-10',
    loadComponent: () => import('./pages/top10/top10.component').then(m => m.Top10Component),
    title: 'Top 10 - Guía TV'
  },
  {
    path: 'ver-mas/detalles/:id',
    loadComponent: () => import('./pages/blog-post/blog-post.component').then(m => m.BlogPostComponent),
    title: 'Detalles - Guía TV'
  },
  {
    path: 'ver-más/:id',
    loadComponent: () => import('./pages/blog-category/blog-category.component').then(m => m.BlogCategoryComponent),
    title: 'Categoría - Guía TV'
  },
  {
    path: 'program-full-details/:id',
    loadComponent: () => import('./pages/program-full-details/program-full-details.component').then(m => m.ProgramFullDetailsComponent),
    title: 'Detalles del Programa - Guía TV'
  },  // Eliminar ruta comodín temporalmente para evitar bucles
  // {
  //   path: '**',
  //   redirectTo: ''
  // }
];