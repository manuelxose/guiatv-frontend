import { APP_PATHS } from './route-map';
import { UnifiedPortalRailSection } from '../models/portal-shell.models';

export const PORTAL_ICON_PATHS = {
  menu:
    'M4.5 7.5h15M4.5 12h15M4.5 16.5h10.5',
  panel:
    'M4.5 6.75h4.5v10.5H4.5zM10.5 6.75h9v4.5h-9zM10.5 12.75h9v4.5h-9z',
  home:
    'M3.75 9.75 12 3l8.25 6.75M5.25 8.625V20.25h4.5v-4.5h4.5v4.5h4.5V8.625',
  live:
    'M4.5 6.75h15a1.5 1.5 0 0 1 1.5 1.5v8.25A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5V8.25a1.5 1.5 0 0 1 1.5-1.5Zm3-3 4.5 3m4.5-3-4.5 3',
  discover:
    'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Zm3.75-11.25-4.5 1.5-1.5 4.5 4.5-1.5 1.5-4.5Z',
  streaming:
    'M3.75 7.5a2.25 2.25 0 0 1 2.25-2.25h12A2.25 2.25 0 0 1 20.25 7.5v9A2.25 2.25 0 0 1 18 18.75H6A2.25 2.25 0 0 1 3.75 16.5v-9Zm3 1.5h10.5m-10.5 3h6.75m-6.75 3h4.5',
  sports:
    'M7.5 6.75c1.15-.87 2.77-.87 3.92 0l4.16 3.15c1.15.87 1.68 2.35 1.36 3.76l-1.17 5.03a3.38 3.38 0 0 1-3.29 2.61H11.5a3.38 3.38 0 0 1-3.29-2.61l-1.17-5.03c-.32-1.41.21-2.89 1.36-3.76l4.16-3.15Z',
  editorial:
    'M6.75 5.25h10.5v13.5H6.75zM9 8.25h6M9 11.25h6M9 14.25h4.5',
  rankings:
    'M6.75 18.75h10.5M8.25 15.75h7.5M9.75 12.75h4.5',
  trends:
    'M7.5 15.75 10.5 12l2.25 2.25L16.5 9.75',
  compare:
    'M6.75 7.5h4.5v9h-4.5zM12.75 5.25h4.5v11.25h-4.5z',
  calendar:
    'M6.75 3.75v2.25M17.25 3.75v2.25M4.5 8.25h15M6.75 12h3v3h-3zM4.5 6.75h15v12h-15z',
  search:
    'M10.5 4.5a6 6 0 1 0 0 12a6 6 0 0 0 0-12Zm0 0 7.5 7.5',
  account:
    'M15.75 6.75a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0',
  play:
    'M8.25 7.5 16.5 12l-8.25 4.5v-9Z',
  bolt:
    'M13.5 3 5.25 13.5h5.25L9.75 21l9-11.25H13.5L13.5 3Z',
  sparkles:
    'M12 3.75 13.76 8.24 18.25 10 13.76 11.76 12 16.25 10.24 11.76 5.75 10l4.49-1.76L12 3.75Zm6.75 10.5 1.03 2.47 2.47 1.03-2.47 1.03-1.03 2.47-1.03-2.47-2.47-1.03 2.47-1.03 1.03-2.47Z',
  bookmark:
    'M6.75 4.5h10.5a1.5 1.5 0 0 1 1.5 1.5v13.19a.75.75 0 0 1-1.2.6L12 15.75l-5.55 4.04a.75.75 0 0 1-1.2-.6V6a1.5 1.5 0 0 1 1.5-1.5Z',
  history:
    'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4.5H9m3-3.75V12l3.75 2.25',
  liveDot:
    'M8.25 8.25h.008v.008H8.25V8.25Zm3.75 0h.008v.008H12V8.25Zm3.75 0h.008v.008H15.75V8.25ZM6.75 12h10.5M6.75 15.75h6',
  channels:
    'M4.5 7.5h15v9h-15zM7.5 19.5h9',
  platforms:
    'M4.5 7.5h15v9h-15zM8.25 19.5h7.5',
  clock:
    'M12 6v6l4.5 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
} as const;

export interface PortalDestination {
  id: 'home' | 'live' | 'discover' | 'streaming' | 'sports' | 'editorial' | 'rankings' | 'trends' | 'compare';
  label: string;
  hint: string;
  path: string;
  iconPath: string;
}

/**
 * The compact mobile bar is intentionally a subset of the global model.  The
 * final item opens the secondary navigation surface; it is not a duplicate
 * route disguised as a tab.
 */
export interface PortalMobileDestination {
  id: PortalDestination['id'] | 'more';
  label: string;
  path?: string;
  iconPath: string;
  kind: 'route' | 'more';
}

export interface PortalPillDefinition {
  id: string;
  label: string;
  iconPath?: string;
  tone?: 'neutral' | 'live' | 'discover' | 'streaming' | 'sports';
}

export interface PortalGuideShellConfig {
  topPillLabel: string;
  rightRailLabel: string;
  topPills: readonly PortalPillDefinition[];
}

export type PortalPublicShellSection =
  | 'generic'
  | 'live'
  | 'discover'
  | 'streaming'
  | 'sports'
  | 'editorial'
  | 'rankings';

export const PORTAL_PRIMARY_DESTINATIONS: readonly PortalDestination[] = [
  {
    id: 'live',
    label: 'TV',
    hint: 'Emisión activa, parrilla y canales',
    path: APP_PATHS.guide,
    iconPath: PORTAL_ICON_PATHS.live,
  },
  {
    id: 'discover',
    label: 'Qué ver',
    hint: 'Discovery editorial y catálogo',
    path: APP_PATHS.explore,
    iconPath: PORTAL_ICON_PATHS.discover,
  },
  {
    id: 'streaming',
    label: 'Plataformas',
    hint: 'Plataformas, tops y comparador',
    path: APP_PATHS.platforms,
    iconPath: PORTAL_ICON_PATHS.streaming,
  },
  {
    id: 'sports',
    label: 'Deportes',
    hint: 'Directo, agenda y próximos',
    path: APP_PATHS.sports,
    iconPath: PORTAL_ICON_PATHS.sports,
  },
] as const;

export const PORTAL_GLOBAL_DESTINATIONS: readonly PortalDestination[] = [
  {
    id: 'home',
    label: 'Inicio',
    hint: 'Hub maestro del producto',
    path: APP_PATHS.home,
    iconPath: PORTAL_ICON_PATHS.home,
  },
  ...PORTAL_PRIMARY_DESTINATIONS,
  {
    id: 'editorial',
    label: 'Editorial',
    hint: 'Guías, listas y contexto útil',
    path: APP_PATHS.blog,
    iconPath: PORTAL_ICON_PATHS.editorial,
  },
  {
    id: 'rankings',
    label: 'Rankings',
    hint: 'Top listas para decidir rápido',
    path: APP_PATHS.top10,
    iconPath: PORTAL_ICON_PATHS.rankings,
  },
  {
    id: 'trends',
    label: 'Tendencias',
    hint: 'Lo que más se mueve ahora',
    path: APP_PATHS.stats,
    iconPath: PORTAL_ICON_PATHS.trends,
  },
  {
    id: 'compare',
    label: 'Comparador',
    hint: 'Cruce de plataformas y servicios',
    path: APP_PATHS.streamingComparison,
    iconPath: PORTAL_ICON_PATHS.compare,
  },
] as const;

/** Destinations disclosed from the shared Editorial / Más surface. */
export const PORTAL_EXPLORE_DESTINATIONS: readonly PortalDestination[] =
  PORTAL_GLOBAL_DESTINATIONS.filter((destination) =>
    ['editorial', 'rankings', 'trends', 'compare'].includes(destination.id)
  );

/** One mobile-first navigation model, shared by the fixed bar and its sheet. */
export const PORTAL_MOBILE_PRIMARY_DESTINATIONS: readonly PortalMobileDestination[] = [
  { ...PORTAL_GLOBAL_DESTINATIONS.find((destination) => destination.id === 'home')!, kind: 'route' },
  { ...PORTAL_GLOBAL_DESTINATIONS.find((destination) => destination.id === 'live')!, kind: 'route' },
  { ...PORTAL_GLOBAL_DESTINATIONS.find((destination) => destination.id === 'sports')!, kind: 'route' },
  { ...PORTAL_GLOBAL_DESTINATIONS.find((destination) => destination.id === 'discover')!, kind: 'route' },
  {
    id: 'more',
    label: 'Más',
    iconPath: PORTAL_ICON_PATHS.menu,
    kind: 'more',
  },
] as const;

export const PORTAL_ACCOUNT_DESTINATIONS = [
  { id: 'profile', label: 'Perfil', path: APP_PATHS.profile, iconPath: PORTAL_ICON_PATHS.account },
  { id: 'for-you', label: 'Para ti', path: APP_PATHS.forYou, iconPath: PORTAL_ICON_PATHS.sparkles },
  { id: 'community', label: 'Comunidad', path: APP_PATHS.community, iconPath: PORTAL_ICON_PATHS.history },
] as const;

export const PORTAL_HOME_TOP_PILLS: readonly PortalPillDefinition[] = [
  { id: 'live-now', label: 'Ahora en TV', iconPath: PORTAL_ICON_PATHS.liveDot, tone: 'live' },
  { id: 'tonight', label: 'Esta noche', iconPath: PORTAL_ICON_PATHS.clock, tone: 'live' },
  { id: 'platforms', label: 'Plataformas', iconPath: PORTAL_ICON_PATHS.platforms, tone: 'streaming' },
  { id: 'sports-live', label: 'Deportes en vivo', iconPath: PORTAL_ICON_PATHS.sports, tone: 'sports' },
  { id: 'trending', label: 'Tendencias', iconPath: PORTAL_ICON_PATHS.trends, tone: 'discover' },
  {
    id: 'free',
    label: 'Gratis',
    iconPath: 'M12 6v12m4.5-8.25c0-1.65-2.01-3-4.5-3s-4.5 1.35-4.5 3 2.01 3 4.5 3 4.5 1.35 4.5 3-2.01 3-4.5 3-4.5-1.35-4.5-3',
    tone: 'discover',
  },
] as const;

export const PORTAL_GUIDE_SHELL_CONFIG: Record<'live' | 'discover' | 'streaming' | 'sports', PortalGuideShellConfig> = {
  live: {
    topPillLabel: 'TV Directo',
    rightRailLabel: 'Panel de TV',
    topPills: [
      { id: 'now', label: 'En emisión', iconPath: PORTAL_ICON_PATHS.liveDot, tone: 'live' },
      { id: 'next', label: 'A continuación', iconPath: PORTAL_ICON_PATHS.clock, tone: 'live' },
      { id: 'night', label: 'Esta noche', iconPath: 'M18 15.75A6.75 6.75 0 1 1 8.25 6a6 6 0 1 0 9.75 9.75Z', tone: 'live' },
      { id: 'day', label: 'Parrilla', iconPath: PORTAL_ICON_PATHS.channels, tone: 'live' },
    ],
  },
  discover: {
    topPillLabel: 'Qué Ver',
    rightRailLabel: 'Panel editorial',
    topPills: [
      { id: 'all', label: 'Todo', iconPath: PORTAL_ICON_PATHS.discover, tone: 'discover' },
      { id: 'live', label: 'En TV', iconPath: PORTAL_ICON_PATHS.liveDot, tone: 'discover' },
      { id: 'movie', label: 'Películas', iconPath: PORTAL_ICON_PATHS.play, tone: 'discover' },
      { id: 'series', label: 'Series', iconPath: PORTAL_ICON_PATHS.editorial, tone: 'discover' },
      { id: 'free', label: 'Gratis', iconPath: 'M12 6v12m4.5-8.25c0-1.65-2.01-3-4.5-3s-4.5 1.35-4.5 3 2.01 3 4.5 3 4.5 1.35 4.5 3-2.01 3-4.5 3-4.5-1.35-4.5-3', tone: 'discover' },
    ],
  },
  streaming: {
    topPillLabel: 'Streaming',
    rightRailLabel: 'Panel streaming',
    topPills: [
      { id: 'popular', label: 'Popular', iconPath: PORTAL_ICON_PATHS.trends, tone: 'streaming' },
      { id: 'recent', label: 'Novedades', iconPath: PORTAL_ICON_PATHS.clock, tone: 'streaming' },
      { id: 'rating', label: 'Mejor valoradas', iconPath: PORTAL_ICON_PATHS.rankings, tone: 'streaming' },
      { id: 'free', label: 'Gratis', iconPath: 'M12 6v12m4.5-8.25c0-1.65-2.01-3-4.5-3s-4.5 1.35-4.5 3 2.01 3 4.5 3 4.5 1.35 4.5 3-2.01 3-4.5 3-4.5-1.35-4.5-3', tone: 'streaming' },
    ],
  },
  sports: {
    topPillLabel: 'Deportes',
    rightRailLabel: 'Panel deportivo',
    // Football-first: the vertical leads with its own temporal sections
    // (live → today → upcoming) and a discipline selector. The top shelf
    // keeps only the "Más filtros" entry so there is no duplicated temporal
    // navigation competing with the in-view agenda.
    topPills: [],
  },
} as const;

export function getPortalPublicTopPills(
  section: PortalPublicShellSection
): readonly PortalPillDefinition[] {
  if (section === 'live' || section === 'discover' || section === 'streaming' || section === 'sports') {
    return PORTAL_GUIDE_SHELL_CONFIG[section].topPills;
  }

  if (section === 'editorial') {
    return [
      { id: 'editorial-home', label: 'Guías', iconPath: PORTAL_ICON_PATHS.editorial, tone: 'discover' },
      { id: 'editorial-rankings', label: 'Rankings', iconPath: PORTAL_ICON_PATHS.rankings, tone: 'discover' },
      { id: 'editorial-trends', label: 'Tendencias', iconPath: PORTAL_ICON_PATHS.trends, tone: 'discover' },
      { id: 'editorial-platforms', label: 'Plataformas', iconPath: PORTAL_ICON_PATHS.platforms, tone: 'streaming' },
    ];
  }

  if (section === 'rankings') {
    return [
      { id: 'rankings-all', label: 'Todos', iconPath: PORTAL_ICON_PATHS.rankings, tone: 'discover' },
      { id: 'rankings-streaming', label: 'Streaming', iconPath: PORTAL_ICON_PATHS.platforms, tone: 'streaming' },
      { id: 'rankings-tv', label: 'TV', iconPath: PORTAL_ICON_PATHS.live, tone: 'live' },
      { id: 'rankings-sports', label: 'Deportes', iconPath: PORTAL_ICON_PATHS.sports, tone: 'sports' },
    ];
  }

  return PORTAL_HOME_TOP_PILLS;
}

export function getPortalPublicTopPillLabel(section: PortalPublicShellSection): string {
  switch (section) {
    case 'editorial':
      return 'Editorial';
    case 'rankings':
      return 'Rankings';
    case 'generic':
      return 'Explora el portal';
    default:
      return PORTAL_GUIDE_SHELL_CONFIG[section].topPillLabel;
  }
}

export function getPortalPublicRightRailLabel(section: PortalPublicShellSection): string {
  switch (section) {
    case 'live':
      return 'Panel TV';
    case 'streaming':
      return 'Panel streaming';
    case 'sports':
      return 'Panel deportes';
    case 'editorial':
      return 'Panel editorial';
    case 'rankings':
      return 'Panel rankings';
    default:
      return 'Panel contextual';
  }
}

export function getPortalPublicContextualLeftRailSection(
  section: PortalPublicShellSection
): UnifiedPortalRailSection {
  switch (section) {
    case 'live':
      return {
        id: 'public-live',
        eyebrow: 'TV Directo',
        title: 'Moverse por la guía',
        description: 'Ritmos y grupos de canal sin subir otra barra.',
        items: [
          { id: 'public-live-now', label: 'En emisión', description: 'Lo que está activo', iconPath: PORTAL_ICON_PATHS.liveDot, path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
          { id: 'public-live-night', label: 'Esta noche', description: 'Prime time', iconPath: PORTAL_ICON_PATHS.clock, path: APP_PATHS.guide, queryParams: { liveView: 'night' } },
          { id: 'public-live-channels', label: 'Canales', description: 'Directorio lineal', iconPath: PORTAL_ICON_PATHS.channels, path: APP_PATHS.guide, queryParams: { liveView: 'day' } },
        ],
      };
    case 'streaming':
      return {
        id: 'public-streaming',
        eyebrow: 'Streaming',
        title: 'Entradas rápidas',
        description: 'Servicios, top valorado y comparador.',
        items: [
          { id: 'public-streaming-popular', label: 'Popular', description: 'Lo más visto', iconPath: PORTAL_ICON_PATHS.trends, path: APP_PATHS.platforms },
          { id: 'public-streaming-top', label: 'Top valorado', description: 'Mejor percepción', iconPath: PORTAL_ICON_PATHS.rankings, path: APP_PATHS.platforms, queryParams: { sort: 'rating' } },
          { id: 'public-streaming-compare', label: 'Comparador', description: 'Servicios y perfiles', iconPath: PORTAL_ICON_PATHS.compare, path: APP_PATHS.streamingComparison },
        ],
      };
    case 'sports':
      return {
        id: 'public-sports',
        eyebrow: 'Deportes',
        title: 'Agenda deportiva',
        description: 'Live, próximos y foco en fútbol.',
        items: [
          { id: 'public-sports-live', label: 'En directo', description: 'Eventos activos', iconPath: PORTAL_ICON_PATHS.liveDot, path: APP_PATHS.sports, queryParams: { timeRange: 'live' } },
          { id: 'public-sports-today', label: 'Hoy', description: 'Agenda del día', iconPath: PORTAL_ICON_PATHS.calendar, path: APP_PATHS.sports, queryParams: { timeRange: 'all' } },
          { id: 'public-sports-football', label: 'Fútbol', description: 'Disciplina prioritaria', iconPath: PORTAL_ICON_PATHS.sports, path: APP_PATHS.sports, queryParams: { sport: 'Fútbol' } },
        ],
      };
    case 'editorial':
    case 'rankings':
      return {
        id: 'public-editorial',
        eyebrow: 'Editorial',
        title: 'Contexto útil',
        description: 'Guías, rankings y cruces con discovery.',
        items: [
          { id: 'public-editorial-home', label: 'Editorial', description: 'Portada editorial', iconPath: PORTAL_ICON_PATHS.editorial, path: APP_PATHS.blog },
          { id: 'public-editorial-rankings', label: 'Rankings', description: 'Top listas conectadas', iconPath: PORTAL_ICON_PATHS.rankings, path: APP_PATHS.top10 },
          { id: 'public-editorial-explore', label: 'Qué Ver', description: 'Volver al discovery', iconPath: PORTAL_ICON_PATHS.discover, path: APP_PATHS.explore },
        ],
      };
    default:
      return {
        id: 'public-discover',
        eyebrow: 'Descubrir ahora',
        title: 'Entradas rápidas',
        description: 'Lo principal del portal en navegación secundaria.',
        items: [
          { id: 'public-generic-live', label: 'Ahora en TV', description: 'Lineal vivo', iconPath: PORTAL_ICON_PATHS.liveDot, path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
          { id: 'public-generic-explore', label: 'Qué Ver', description: 'Discovery principal', iconPath: PORTAL_ICON_PATHS.discover, path: APP_PATHS.explore },
          { id: 'public-generic-platforms', label: 'Plataformas', description: 'Catálogos y servicios', iconPath: PORTAL_ICON_PATHS.platforms, path: APP_PATHS.platforms },
        ],
      };
  }
}

export function getPortalPublicRightRailSections(
  section: PortalPublicShellSection
): UnifiedPortalRailSection[] {
  switch (section) {
    case 'live':
      return [
        {
          id: 'right-live-now',
          eyebrow: 'Ahora',
          title: 'TV en foco',
          description: 'Zapping directo a la emisión y la noche.',
          variant: 'feature',
          items: [
            { id: 'right-live-feature', label: 'En emisión', description: 'Abrir la guía activa', iconPath: PORTAL_ICON_PATHS.liveDot, path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
            { id: 'right-live-night', label: 'Prime time', description: 'Ir a esta noche', iconPath: PORTAL_ICON_PATHS.clock, path: APP_PATHS.guide, queryParams: { liveView: 'night' } },
          ],
        },
      ];
    case 'streaming':
      return [
        {
          id: 'right-streaming',
          eyebrow: 'Streaming',
          title: 'Servicios en foco',
          description: 'Entradas útiles sin convertir el panel en otro menú.',
          variant: 'logos',
          items: [
            { id: 'right-streaming-netflix', label: 'Netflix', description: 'Abrir servicio', path: APP_PATHS.platforms, queryParams: { platform: 'Netflix' } },
            { id: 'right-streaming-prime', label: 'Prime Video', description: 'Abrir servicio', path: APP_PATHS.platforms, queryParams: { platform: 'Prime Video' } },
            { id: 'right-streaming-max', label: 'Max', description: 'Abrir servicio', path: APP_PATHS.platforms, queryParams: { platform: 'Max' } },
          ],
        },
      ];
    case 'sports':
      return [
        {
          id: 'right-sports',
          eyebrow: 'Agenda',
          title: 'Live y próximos',
          description: 'Resumen deportivo lateral y compacto.',
          variant: 'feature',
          items: [
            { id: 'right-sports-live', label: 'En directo', description: 'Eventos activos ahora', iconPath: PORTAL_ICON_PATHS.liveDot, path: APP_PATHS.sports, queryParams: { timeRange: 'live' } },
            { id: 'right-sports-next', label: 'Próximos', description: 'Siguiente bloque', iconPath: PORTAL_ICON_PATHS.calendar, path: APP_PATHS.sports, queryParams: { timeRange: 'next' } },
          ],
        },
      ];
    case 'editorial':
    case 'rankings':
      return [
        {
          id: 'right-editorial',
          eyebrow: 'Editorial',
          title: 'Cruces útiles',
          description: 'Lleva el contexto editorial de vuelta al catálogo.',
          variant: 'compact',
          items: [
            { id: 'right-editorial-explore', label: 'Qué Ver', description: 'Volver al discovery', iconPath: PORTAL_ICON_PATHS.discover, path: APP_PATHS.explore },
            { id: 'right-editorial-top10', label: 'Rankings', description: 'Listas editoriales', iconPath: PORTAL_ICON_PATHS.rankings, path: APP_PATHS.top10 },
            { id: 'right-editorial-platforms', label: 'Plataformas', description: 'Abrir servicios', iconPath: PORTAL_ICON_PATHS.platforms, path: APP_PATHS.platforms },
          ],
        },
      ];
    default:
      return [
        {
          id: 'right-generic',
          eyebrow: 'Portal',
          title: 'Accesos rápidos',
          description: 'Contexto lateral sin duplicar la navegación principal.',
          variant: 'compact',
          items: [
            { id: 'right-generic-live', label: 'Ahora en TV', description: 'Ir al directo', iconPath: PORTAL_ICON_PATHS.liveDot, path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
            { id: 'right-generic-platforms', label: 'Plataformas', description: 'Ver servicios', iconPath: PORTAL_ICON_PATHS.platforms, path: APP_PATHS.platforms },
            { id: 'right-generic-trends', label: 'Tendencias', description: 'Abrir tendencias', iconPath: PORTAL_ICON_PATHS.trends, path: APP_PATHS.stats },
          ],
        },
      ];
  }
}

export function resolvePortalPublicTopPillTarget(
  section: PortalPublicShellSection,
  value: string
): { path: string; queryParams?: Record<string, string> } | null {
  const shared: Record<string, { path: string; queryParams?: Record<string, string> }> = {
    platforms: { path: APP_PATHS.platforms },
    trending: { path: APP_PATHS.stats },
    free: { path: APP_PATHS.explore, queryParams: { availability: 'free' } },
  };

  if (section === 'live') {
    return {
      now: { path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
      next: { path: APP_PATHS.guide, queryParams: { liveView: 'next' } },
      night: { path: APP_PATHS.guide, queryParams: { liveView: 'night' } },
      day: { path: APP_PATHS.guide, queryParams: { liveView: 'day' } },
      tdt: { path: APP_PATHS.guide, queryParams: { group: 'tdt' } },
      'sports-tv': { path: APP_PATHS.guide, queryParams: { group: 'deporte' } },
    }[value] || null;
  }

  if (section === 'streaming') {
    return {
      popular: { path: APP_PATHS.platforms, queryParams: { sort: 'popular' } },
      recent: { path: APP_PATHS.platforms, queryParams: { sort: 'recent' } },
      rating: { path: APP_PATHS.platforms, queryParams: { sort: 'rating' } },
      movie: { path: APP_PATHS.platforms, queryParams: { type: 'movie' } },
      series: { path: APP_PATHS.platforms, queryParams: { type: 'series' } },
      free: shared.free,
    }[value] || null;
  }

  if (section === 'sports') {
    return {
      live: { path: APP_PATHS.sports, queryParams: { timeRange: 'live' } },
      all: { path: APP_PATHS.sports, queryParams: { timeRange: 'all' } },
      tonight: { path: APP_PATHS.sports, queryParams: { timeRange: 'tonight' } },
      week: { path: APP_PATHS.sports, queryParams: { timeRange: 'week' } },
      football: { path: APP_PATHS.sports, queryParams: { sport: 'Fútbol' } },
      motor: { path: APP_PATHS.sports, queryParams: { sport: 'F1' } },
    }[value] || null;
  }

  if (section === 'editorial') {
    return {
      'editorial-home': { path: APP_PATHS.blog },
      'editorial-rankings': { path: APP_PATHS.top10 },
      'editorial-trends': { path: APP_PATHS.stats },
      'editorial-platforms': { path: APP_PATHS.platforms },
    }[value] || null;
  }

  if (section === 'rankings') {
    return {
      'rankings-all': { path: APP_PATHS.top10 },
      'rankings-streaming': { path: APP_PATHS.platforms },
      'rankings-tv': { path: APP_PATHS.guide },
      'rankings-sports': { path: APP_PATHS.sports },
    }[value] || null;
  }

  return (
    {
      'live-now': { path: APP_PATHS.guide, queryParams: { liveView: 'now' } },
      tonight: { path: APP_PATHS.guide, queryParams: { liveView: 'night' } },
      platforms: shared.platforms,
      'sports-live': { path: APP_PATHS.sports, queryParams: { timeRange: 'live' } },
      trending: shared.trending,
      free: shared.free,
    }[value] || null
  );
}
