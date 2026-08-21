export const APP_PATHS = {
  home: '/',
  forYou: '/para-ti',
  guide: '/programacion-tv/guia-canales',
  explore: '/programacion-tv/que-ver-hoy',
  platforms: '/plataformas',
  sports: '/deportes/futbol',
  football: '/deportes/futbol',
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
  { key: 'editorial', label: 'Blog', path: APP_PATHS.blog },
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

export function normalizePath(value: string): string {
  const raw = String(value || '')
    .split('?')[0]
    .split('#')[0]
    .trim();
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}
