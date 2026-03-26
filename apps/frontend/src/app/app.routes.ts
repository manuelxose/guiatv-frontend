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
    path: 'perfil',
    loadComponent: () =>
      import('./pages/user-area/user-area.component').then(
        (m) => m.UserAreaComponent
      ),
    title: 'Perfil - Guía TV',
    data: { defaultTab: 'feed', robots: 'noindex, nofollow' },
  },
  {
    path: 'mi-cuenta',
    redirectTo: 'perfil',
    pathMatch: 'full',
  },
  {
    path: 'comunidad',
    redirectTo: 'perfil',
    pathMatch: 'full',
  },
  {
    path: 'perfil/:userId',
    loadComponent: () =>
      import('./pages/public-profile/public-profile.component').then(
        (m) => m.PublicProfileComponent
      ),
    title: 'Perfil - Guía TV',
  },
  {
    path: 'para-ti',
    loadComponent: () =>
      import('./pages/for-you/for-you.component').then(
        (m) => m.ForYouComponent
      ),
    title: 'Para ti - Guía TV',
    data: { robots: 'noindex, nofollow' },
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
    path: 'canales/:id',
    loadComponent: () =>
      import('./pages/canal-completo/canal-completo.component').then(
        (m) => m.CanalCompletoComponent
      ),
    title: 'Canal - Guía TV',
  },
  {
    path: 'programacion-tv/ver-canal/:id',
    redirectTo: 'canales/:id',
    pathMatch: 'full',
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
    redirectTo: 'canales/:id',
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
    redirectTo: 'programacion-tv/guia-canales',
    pathMatch: 'full',
  },
  {
    path: 'editorial',
    children: BLOG_ROUTES && BLOG_ROUTES.length ? BLOG_ROUTES[0].children : [],
    title: 'Editorial - Guía TV',
  },
  {
    path: 'blog/top10',
    redirectTo: 'editorial/rankings',
    pathMatch: 'full',
  },
  {
    path: 'blog/categoria/:slug',
    redirectTo: 'editorial/categoria/:slug',
    pathMatch: 'full',
  },
  {
    path: 'blog/:slug',
    redirectTo: 'editorial/:slug',
    pathMatch: 'full',
  },
  {
    path: 'blog',
    redirectTo: 'editorial',
    pathMatch: 'full',
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
    path: 'sobre-nosotros',
    loadComponent: () =>
      import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'Sobre Nosotros - Guía TV',
  },
  {
    path: 'prensa',
    loadComponent: () =>
      import('./pages/press-kit/press-kit.component').then(
        (m) => m.PressKitComponent
      ),
    title: 'Kit de Prensa - Guía TV',
  },
  {
    path: 'comparador-streaming',
    loadComponent: () =>
      import(
        './pages/streaming-comparison/streaming-comparison.component'
      ).then((m) => m.StreamingComparisonComponent),
    title: 'Comparador de Streaming - Guía TV',
  },
  {
    path: 'developers',
    loadComponent: () =>
      import('./pages/developers/developers.component').then(
        (m) => m.DevelopersComponent
      ),
    title: 'API para Desarrolladores - Guía TV',
  },
  {
    path: 'embed/programacion',
    loadComponent: () =>
      import('./pages/embed-page/embed-program-guide.component').then(
        (m) => m.EmbedProgramGuideComponent
      ),
    title: 'Widget de Programación - Guía TV',
  },
  {
    path: 'embed',
    loadComponent: () =>
      import('./pages/embed-page/embed-page.component').then(
        (m) => m.EmbedPageComponent
      ),
    title: 'Widget Embebible - Guía TV',
  },
  {
    path: 'tendencias',
    loadComponent: () =>
      import('./pages/stats/stats.component').then(
        (m) => m.StatsComponent
      ),
    title: 'Tendencias TV y Streaming - Guía TV',
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
