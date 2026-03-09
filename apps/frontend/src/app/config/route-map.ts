export const APP_PATHS = {
  home: '/',
  guide: '/programacion-tv/guia-canales',
  explore: '/programacion-tv/que-ver-hoy',
  platforms: '/plataformas',
  live: '/programacion-tv/en-directo',
  series: '/programacion-tv/series',
  movies: '/programacion-tv/peliculas',
  content: '/contenido', // legacy — kept for redirect support
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
  | 'plataformas'
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
  iconOutline?: string;
  iconFilled?: string;
  badgeKey?: string;
}

export const PRIMARY_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'home', label: 'Inicio', path: APP_PATHS.home },
  { key: 'guia-canales', label: 'Guía TV', path: APP_PATHS.guide },
  { key: 'que-ver-hoy', label: 'Explorar', path: APP_PATHS.explore },
  { key: 'plataformas', label: 'Plataformas', path: APP_PATHS.platforms },
];

export const SECONDARY_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'en-directo', label: 'En directo', path: APP_PATHS.live },
  { key: 'peliculas', label: 'Películas', path: APP_PATHS.movies },
  { key: 'series', label: 'Series', path: APP_PATHS.series },
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
  {
    key: 'home',
    label: 'Inicio',
    path: APP_PATHS.home,
    iconOutline: 'M3.75 9.75 12 3l8.25 6.75M5.25 8.625V20.25h4.5v-4.5h4.5v4.5h4.5V8.625',
    iconFilled:
      'M11.47 3.84a.75.75 0 0 1 .95 0l8.25 6.75a.75.75 0 0 1 .28.58v9.08a1.5 1.5 0 0 1-1.5 1.5h-4.5a.75.75 0 0 1-.75-.75v-4.5h-3.5V21a.75.75 0 0 1-.75.75H5.25a1.5 1.5 0 0 1-1.5-1.5v-9.08a.75.75 0 0 1 .28-.58l8.25-6.75Z',
  },
  {
    key: 'guia-canales',
    label: 'Guía TV',
    path: APP_PATHS.guide,
    iconOutline:
      'M4.5 6.75h15a1.5 1.5 0 0 1 1.5 1.5v8.25A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5V8.25a1.5 1.5 0 0 1 1.5-1.5Zm3-3 4.5 3m4.5-3-4.5 3',
    iconFilled:
      'M5.25 5.25A2.25 2.25 0 0 0 3 7.5v9a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 16.5v-9a2.25 2.25 0 0 0-2.25-2.25h-2.69L12 8.19 7.94 5.25H5.25Z',
  },
  {
    key: 'que-ver-hoy',
    label: 'Explorar',
    path: APP_PATHS.explore,
    iconOutline:
      'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Zm3.75-11.25-4.5 1.5-1.5 4.5 4.5-1.5 1.5-4.5Z',
    iconFilled:
      'M12 2.25a9.75 9.75 0 1 0 9.75 9.75A9.76 9.76 0 0 0 12 2.25Zm4.58 6.69-2.02 6.08a.75.75 0 0 1-.47.47l-6.08 2.02a.75.75 0 0 1-.96-.96l2.02-6.08a.75.75 0 0 1 .47-.47l6.08-2.02a.75.75 0 0 1 .96.96Z',
  },
  {
    key: 'comunidad',
    label: 'Comunidad',
    path: APP_PATHS.community,
    iconOutline:
      'M8.25 9.75h7.5M8.25 13.5h4.5M6.75 4.5h10.5a3.75 3.75 0 0 1 3.75 3.75v5.25A3.75 3.75 0 0 1 17.25 17.25H12l-4.5 3v-3h-.75A3.75 3.75 0 0 1 3 13.5V8.25A3.75 3.75 0 0 1 6.75 4.5Z',
    iconFilled:
      'M6.75 3.75A4.5 4.5 0 0 0 2.25 8.25v5.25A4.5 4.5 0 0 0 6.75 18H7.5v2.25a.75.75 0 0 0 1.17.62L12.23 18h5.02a4.5 4.5 0 0 0 4.5-4.5V8.25a4.5 4.5 0 0 0-4.5-4.5H6.75Zm1.5 5.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6A.75.75 0 0 1 8.25 9Zm0 3.75A.75.75 0 0 1 9 12h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z',
    badgeKey: 'unreadMessages',
  },
  {
    key: 'mi-cuenta',
    label: 'Perfil',
    path: APP_PATHS.account,
    iconOutline:
      'M15.75 6.75a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0',
    iconFilled:
      'M12 2.25a9.75 9.75 0 1 0 0 19.5a9.75 9.75 0 0 0 0-19.5Zm0 4.5a3.375 3.375 0 1 1 0 6.75a3.375 3.375 0 0 1 0-6.75Zm0 12a7.46 7.46 0 0 1-4.96-1.88a4.875 4.875 0 0 1 9.92 0A7.46 7.46 0 0 1 12 18.75Z',
  },
];

export function normalizePath(value: string): string {
  const raw = String(value || '')
    .split('?')[0]
    .split('#')[0]
    .trim();
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}
