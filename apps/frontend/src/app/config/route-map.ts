export const APP_PATHS = {
  home: '/',
  guide: '/programacion-tv/guia-canales',
  explore: '/programacion-tv/que-ver-hoy',
  live: '/programacion-tv/en-directo',
  series: '/programacion-tv/series',
  movies: '/programacion-tv/peliculas',
  blog: '/blog',
  top10: '/blog/top10',
  account: '/mi-cuenta',
  community: '/comunidad',
  login: '/iniciar-sesion',
  register: '/registro',
} as const;

export type AppRouteKey =
  | 'home'
  | 'guia-canales'
  | 'que-ver-hoy'
  | 'en-directo'
  | 'series'
  | 'peliculas'
  | 'blog'
  | 'top-10'
  | 'mi-cuenta'
  | 'comunidad'
  | 'iniciar-sesion'
  | 'registro';

export interface AppRouteEntry {
  key: AppRouteKey;
  label: string;
  path: string;
}

export const PRIMARY_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'home', label: 'Inicio', path: APP_PATHS.home },
  { key: 'guia-canales', label: 'Guía canales', path: APP_PATHS.guide },
  { key: 'que-ver-hoy', label: 'Qué ver hoy', path: APP_PATHS.explore },
  { key: 'peliculas', label: 'Películas', path: APP_PATHS.movies },
  { key: 'series', label: 'Series', path: APP_PATHS.series },
  { key: 'en-directo', label: 'En directo', path: APP_PATHS.live },
  { key: 'blog', label: 'Blog', path: APP_PATHS.blog },
  { key: 'top-10', label: 'Top 10', path: APP_PATHS.top10 },
];

export const USER_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'comunidad', label: 'Comunidad', path: APP_PATHS.community },
  { key: 'mi-cuenta', label: 'Mi cuenta', path: APP_PATHS.account },
  { key: 'iniciar-sesion', label: 'Iniciar sesión', path: APP_PATHS.login },
  { key: 'registro', label: 'Crear cuenta', path: APP_PATHS.register },
];

export const MOBILE_APP_TABS: AppRouteEntry[] = [
  { key: 'home', label: 'Inicio', path: APP_PATHS.home },
  { key: 'guia-canales', label: 'Guía', path: APP_PATHS.guide },
  { key: 'en-directo', label: 'Directo', path: APP_PATHS.live },
  { key: 'comunidad', label: 'Comunidad', path: APP_PATHS.community },
  { key: 'mi-cuenta', label: 'Cuenta', path: APP_PATHS.account },
];

export function normalizePath(value: string): string {
  const raw = String(value || '')
    .split('?')[0]
    .split('#')[0]
    .trim();
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}
