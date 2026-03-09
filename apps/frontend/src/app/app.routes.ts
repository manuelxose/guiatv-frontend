import { Routes } from '@angular/router';
import { BLOG_ROUTES } from './blog/blog.routes';
import { adminGuard } from './guards/admin.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';

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
    data: { robots: 'noindex, follow' },
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    title: 'Registro - Guia TV',
    data: { robots: 'noindex, follow' },
  },
  {
    path: 'mi-cuenta',
    loadComponent: () =>
      import('./pages/user-area/user-area.component').then(
        (m) => m.UserAreaComponent
      ),
    title: 'Mi cuenta - Guía TV',
    data: { robots: 'noindex, nofollow' },
  },
  {
    path: 'comunidad',
    loadComponent: () =>
      import('./pages/user-area/user-area.component').then(
        (m) => m.UserAreaComponent
      ),
    title: 'Comunidad - Guía TV',
    data: { defaultTab: 'social', robots: 'noindex, nofollow' },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Admin - Guia TV',
    canActivate: [adminGuard],
    data: { robots: 'noindex, nofollow' },
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
    data: { robots: 'noindex, follow' },
  },
  {
    path: 'ver-canal/:id',
    redirectTo: 'programacion-tv/ver-canal/:id',
    pathMatch: 'full',
  },
  // Legacy single-parameter detail routes (redirect to canonical slug routes)
  {
    path: 'detalles/:id',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Detalles del Programa - Guía TV',
    data: { legacyCatalogMode: 'program', robots: 'noindex, follow' },
  },
  {
    path: 'pelicula-details/:id',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Películas - Detalle - Guía TV',
    data: { legacyCatalogMode: 'movie', robots: 'noindex, follow' },
  },

  // SEO-friendly movie route: slug-only (no id exposed)
  {
    path: 'peliculas/:slug',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Películas - Detalle - Guía TV',
    data: { contentType: 'movie' }
  },
  {
    path: 'series/:slug',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Series - Detalle - Guía TV',
    data: { contentType: 'series' }
  },

  // SEO-friendly program route: slug-only (no id exposed)
  {
    path: 'programas/:slug',
    loadComponent: () =>
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Programas - Detalle - Guía TV',
    data: { contentType: 'program' }
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
      import('./pages/catalog-detail/catalog-detail.component').then(
        (m) => m.CatalogDetailComponent
      ),
    title: 'Detalles del Programa - Guía TV',
    data: { legacyCatalogMode: 'program', robots: 'noindex, follow' },
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
    data: { robots: 'noindex, follow' },
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Página no encontrada - Guía TV',
  },
];
