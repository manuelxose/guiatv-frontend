import { Routes } from '@angular/router';
import { BLOG_ROUTES } from './blog/blog.routes';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Inicio - Guía TV',
  },
  {
    path: 'iniciar-sesion',
    loadComponent: () =>
      import('./pages/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Iniciar sesión - Guía TV',
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    title: 'Registro - Guia TV',
  },
  {
    path: 'mi-cuenta',
    loadComponent: () =>
      import('./pages/user-area/user-area.component').then(
        (m) => m.UserAreaComponent
      ),
    title: 'Mi cuenta - Guía TV',
  },
  {
    path: 'comunidad',
    loadComponent: () =>
      import('./pages/user-area/user-area.component').then(
        (m) => m.UserAreaComponent
      ),
    title: 'Comunidad - Guía TV',
    data: { defaultTab: 'social' },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Admin - Guia TV',
    canActivate: [adminGuard],
  },
  {
    path: 'programacion-tv/series',
    loadComponent: () =>
      import('./pages/content-page/content-page.component').then((m) => m.ContentPageComponent),
    title: 'Series - Guía TV',
    data: { type: 'series' }
  },
  {
    path: 'programacion-tv/peliculas',
    loadComponent: () =>
      import('./pages/content-page/content-page.component').then(
        (m) => m.ContentPageComponent
      ),
    title: 'Películas - Guía TV',
    data: { type: 'movies' }
  },
  {
    path: 'programacion-tv/guia-canales',
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
    path: 'programacion-tv/que-ver-hoy',
    loadComponent: () =>
      import('./pages/program-explorer/program-explorer.component').then(
        (m) => m.ProgramExplorerComponent
      ),
    title: 'Qué Ver Hoy - Guía TV',
    data: { mode: 'featured' }
  },
  {
    path: 'plataformas',
    loadComponent: () =>
      import('./pages/program-explorer/program-explorer.component').then(
        (m) => m.ProgramExplorerComponent
      ),
    title: 'Plataformas - Guía TV',
    data: { mode: 'platforms' }
  },
  {
    path: 'contenido/:catalogId',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Contenido - Guía TV',
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
    data: { type: 'movies' }
  },
  {
    path: 'series/:slug',
    loadComponent: () =>
      import('./pages/pelicula-details/pelicula-details.compoent').then(
        (m) => m.PeliculaDetailsComponent
      ),
    title: 'Series - Detalle - Guía TV',
    data: { type: 'series' }
  },

  // SEO-friendly program route: slug-only (no id exposed)
  {
    path: 'programas/:slug',
    loadComponent: () =>
      import(
        './pages/pelicula-details/pelicula-details.compoent'
      ).then((m) => m.PeliculaDetailsComponent),
    title: 'Programas - Detalle - Guía TV',
    data: { type: 'programs' }
  },

  {
    path: 'programacion-tv/en-directo',
    loadComponent: () =>
      import('./pages/program-explorer/program-explorer.component').then(
        (m) => m.ProgramExplorerComponent
      ),
    title: 'En Directo - Guía TV',
    data: { mode: 'live' }
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
  },
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
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
    title: 'Página no encontrada - Guía TV',
  },
];
