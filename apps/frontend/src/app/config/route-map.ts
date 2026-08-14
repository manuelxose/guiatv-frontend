export const APP_PATHS = {
  home: '/',
  forYou: '/para-ti',
  guide: '/programacion-tv/guia-canales',
  explore: '/programacion-tv/que-ver-hoy',
  platforms: '/plataformas',
  sports: '/deportes',
  live: '/programacion-tv/en-directo',
  series: '/programacion-tv/series',
  movies: '/programacion-tv/peliculas',
  content: '/contenido', // legacy — kept for redirect support
  blog: '/editorial',
  top10: '/editorial/rankings',
  about: '/sobre-nosotros',
  pressKit: '/prensa',
  streamingComparison: '/comparador-streaming',
  developers: '/developers',
  embed: '/embed',
  embedProgramGuide: '/embed/programacion',
  stats: '/tendencias',
  account: '/mi-cuenta',
  community: '/comunidad',
  profile: '/perfil',
  login: '/iniciar-sesion',
  register: '/registro',
} as const;

export type AppRouteKey =
  | 'home'
  | 'para-ti'
  | 'guia-canales'
  | 'que-ver-hoy'
  | 'plataformas'
  | 'deportes'
  | 'en-directo'
  | 'series'
  | 'peliculas'
  | 'editorial'
  | 'rankings'
  | 'tendencias'
  | 'comparador-streaming'
  | 'prensa'
  | 'sobre-nosotros'
  | 'developers'
  | 'embed'
  | 'mi-cuenta'
  | 'comunidad'
  | 'perfil'
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
  { key: 'editorial', label: 'Editorial', path: APP_PATHS.blog },
  { key: 'rankings', label: 'Rankings', path: APP_PATHS.top10 },
];

export const RESOURCE_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'tendencias', label: 'Tendencias', path: APP_PATHS.stats },
  {
    key: 'comparador-streaming',
    label: 'Comparar plataformas',
    path: APP_PATHS.streamingComparison,
  },
  { key: 'prensa', label: 'Prensa', path: APP_PATHS.pressKit },
  { key: 'sobre-nosotros', label: 'Sobre nosotros', path: APP_PATHS.about },
];

export const TOOL_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'developers', label: 'Desarrolladores', path: APP_PATHS.developers },
  { key: 'embed', label: 'Widget', path: APP_PATHS.embed },
];

export const USER_NAV_ROUTES: AppRouteEntry[] = [
  { key: 'para-ti', label: 'Para ti', path: APP_PATHS.forYou },
  { key: 'perfil', label: 'Perfil', path: APP_PATHS.profile },
  { key: 'comunidad', label: 'Comunidad', path: APP_PATHS.community },
  { key: 'mi-cuenta', label: 'Mi cuenta', path: APP_PATHS.account },
  { key: 'iniciar-sesion', label: 'Iniciar sesión', path: APP_PATHS.login },
  { key: 'registro', label: 'Crear cuenta', path: APP_PATHS.register },
];

export const MOBILE_APP_TABS: AppRouteEntry[] = [
  {
    key: 'guia-canales',
    label: 'TV',
    path: APP_PATHS.guide,
    iconOutline:
      'M4.5 6.75h15a1.5 1.5 0 0 1 1.5 1.5v8.25A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5V8.25a1.5 1.5 0 0 1 1.5-1.5Zm3-3 4.5 3m4.5-3-4.5 3',
    iconFilled:
      'M5.25 5.25A2.25 2.25 0 0 0 3 7.5v9a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 16.5v-9a2.25 2.25 0 0 0-2.25-2.25h-2.69L12 8.19 7.94 5.25H5.25Z',
  },
  {
    key: 'que-ver-hoy',
    label: 'Qué ver',
    path: APP_PATHS.explore,
    iconOutline:
      'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Zm3.75-11.25-4.5 1.5-1.5 4.5 4.5-1.5 1.5-4.5Z',
    iconFilled:
      'M12 2.25a9.75 9.75 0 1 0 9.75 9.75A9.76 9.76 0 0 0 12 2.25Zm4.58 6.69-2.02 6.08a.75.75 0 0 1-.47.47l-6.08 2.02a.75.75 0 0 1-.96-.96l2.02-6.08a.75.75 0 0 1 .47-.47l6.08-2.02a.75.75 0 0 1 .96.96Z',
  },
  {
    key: 'plataformas',
    label: 'Plataformas',
    path: APP_PATHS.platforms,
    iconOutline:
      'M4.5 5.25h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75v-9a1.5 1.5 0 0 1 1.5-1.5ZM9 20.25h6M12 17.25v3',
    iconFilled:
      'M4.5 4.5A2.25 2.25 0 0 0 2.25 6.75v9A2.25 2.25 0 0 0 4.5 18h6.75v1.5H9a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5h-2.25V18h6.75a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 19.5 4.5h-15Z',
  },
  {
    key: 'deportes',
    label: 'Deportes',
    path: APP_PATHS.sports,
    iconOutline:
      'M6.75 4.5h10.5l3 5.25-3 9.75H6.75l-3-9.75 3-5.25Zm0 0L12 9l5.25-4.5M3.75 9.75 12 14l8.25-4.25M12 9v5m-5.25 5.5L12 14l5.25 5.5',
    iconFilled:
      'M6.33 3.75h11.34a.75.75 0 0 1 .65.38l3 5.25a.75.75 0 0 1 .07.59l-3 9.75a.75.75 0 0 1-.72.53H6.33a.75.75 0 0 1-.72-.53l-3-9.75a.75.75 0 0 1 .07-.59l3-5.25a.75.75 0 0 1 .65-.38Z',
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
