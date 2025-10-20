import { Routes } from '@angular/router';
import { BLOG_ROUTES } from './blog/blog.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Inicio - Guía TV',
  },
  {
    path: 'series',
    loadComponent: () =>
      import('./pages/series/series.component').then((m) => m.SeriesComponent),
    title: 'Series - Guía TV',
  },
  {
    path: 'peliculas',
    loadComponent: () =>
      import('./pages/peliculas/peliculas.component').then(
        (m) => m.PeliculasComponent
      ),
    title: 'Películas - Guía TV',
  },
  {
    path: 'guia-canales',
    loadComponent: () =>
      import('./pages/lista-canales/lista-canales.component').then(
        (m) => m.ListaCanalesComponent
      ),
    title: 'Guía de Canales - Guía TV',
  },
  {
    // SEO-friendly channel route used across the app (e.g. slider/navigation)
    path: 'programacion-tv/ver-canal/:id',
    loadComponent: () =>
      import('./pages/canal-completo/canal-completo.component').then(
        (m) => m.CanalCompletoComponent
      ),
    title: 'Canal - Guía TV',
  },
  {
    path: 'que-ver-hoy',
    loadComponent: () =>
      import('./pages/lista-destacadas/lista-destacadas.component').then(
        (m) => m.ListaDestacadasComponent
      ),
    title: 'Qué Ver Hoy - Guía TV',
  },
  {
    path: 'ver-canal/:id',
    loadComponent: () =>
      import('./pages/canal-completo/canal-completo.component').then(
        (m) => m.CanalCompletoComponent
      ),
    title: 'Canal - Guía TV',
  },

  // Legacy single-parameter detail routes (kept for backwards compatibility)
  {
    path: 'detalles/:id',
    loadComponent: () =>
      import('./pages/pelicula-details/pelicula-details.compoent').then(
        (m) => m.PeliculaDetailsComponent
      ),
    title: 'Detalles - Guía TV',
  },
  {
    path: 'pelicula-details/:id',
    loadComponent: () =>
      import('./pages/pelicula-details/pelicula-details.compoent').then(
        (m) => m.PeliculaDetailsComponent
      ),
    title: 'Detalle de Película - Guía TV',
  },

  // SEO-friendly movie route: slug-only (no id exposed)
  {
    path: 'peliculas/:slug',
    loadComponent: () =>
      import('./pages/pelicula-details/pelicula-details.compoent').then(
        (m) => m.PeliculaDetailsComponent
      ),
    title: 'Películas - Detalle - Guía TV',
  },

  // SEO-friendly program route: slug-only (no id exposed)
  {
    path: 'programas/:slug',
    loadComponent: () =>
      import(
        './pages/program-full-details/program-full-details.component'
      ).then((m) => m.ProgramFullDetailsComponent),
    title: 'Programas - Detalle - Guía TV',
  },

  {
    path: 'en-directo',
    loadComponent: () =>
      import('./pages/ahora-directo/ahora-directo.component').then(
        (m) => m.AhoraDirectoComponent
      ),
    title: 'En Directo - Guía TV',
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./blog/layout/blog-layout.component').then(
        (m) => m.BlogLayoutComponent
      ),
    // attach children from the blog feature routes so the layout's <router-outlet>
    // can render blog-home, post-detail, categories, etc.
    children: BLOG_ROUTES && BLOG_ROUTES.length ? BLOG_ROUTES[0].children : [],
    title: 'Blog - Guía TV',
  },
  {
    path: 'program-full-details/:id',
    loadComponent: () =>
      import(
        './pages/program-full-details/program-full-details.component'
      ).then((m) => m.ProgramFullDetailsComponent),
    title: 'Detalles del Programa - Guía TV',
  }, // Eliminar ruta comodín temporalmente para evitar bucles
  // {
  //   path: '**',
  //   redirectTo: ''
  // }
  {
    path: 'avisolegal',
    loadComponent: () =>
      import('./pages/legal/legal-notice/legal-notice.component').then(
        (m) => m.LegalNoticeComponent
      ),
    title: 'Aviso Legal - Guía TV',
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./pages/legal/privacy/privacy.component').then(
        (m) => m.PrivacyComponent
      ),
    title: 'Política de Privacidad - Guía TV',
  },
  {
    path: 'cookies',
    loadComponent: () =>
      import('./pages/legal/cookies/cookies.component').then(
        (m) => m.CookiesComponent
      ),
    title: 'Política de Cookies - Guía TV',
  },
  {
    path: 'terminos',
    loadComponent: () =>
      import('./pages/legal/terms/terms.component').then(
        (m) => m.TermsComponent
      ),
    title: 'Términos y Condiciones - Guía TV',
  },
  {
    path: 'accesibilidad',
    loadComponent: () =>
      import('./pages/legal/accessibility/accessibility.component').then(
        (m) => m.AccessibilityComponent
      ),
    title: 'Accesibilidad - Guía TV',
  },
  {
    path: 'sitemap',
    loadComponent: () =>
      import('./pages/legal/sitemap/sitemap.component').then(
        (m) => m.SitemapComponent
      ),
    title: 'Mapa del sitio - Guía TV',
  },
];
