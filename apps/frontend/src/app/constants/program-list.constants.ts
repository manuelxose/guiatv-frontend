/**
 * Constantes para ProgramListComponent
 * Ubicación: src/app/constants/program-list.constants.ts
 */

export const TIME_SLOTS:readonly string[][] = [
  ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00'],
  ['03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00'],
  ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'],
  ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'],
  ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
  ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'],
  ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
  ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'],
] as const;

export const PROGRAM_LIST_CONFIG = {
  VIRTUAL_SCROLL: {
    ITEM_SIZE: 150,
    MAX_HEIGHT: 700
  },
  TIME_INDICATOR: {
    UPDATE_INTERVAL: 60000, // 1 minuto
    SCREEN_WIDTH_REM: 18.375,
    COLUMN_WIDTH: 180
  },
  VIEWPORT: {
    SETUP_DELAY: 200,
    RETRY_DELAY: 300,
    MAX_RETRIES: 3
  },
  LOADING: {
    TIMEOUT: 10000,
    DEBOUNCE_TIME: 100
  },
  PROGRAM_DISPLAY: {
    MIN_WIDTH: 90,
    TIME_SLOT_DURATION: 30, // minutos
    HOUR_WIDTH_PX: 240, // Ancho en píxeles por hora
    PIXELS_PER_MINUTE: 4, // 240px / 60min = 4px por minuto
    LOGO_COLUMN_WIDTH: 160 // Ancho de la columna de logos
  },
  SCROLL: {
    SYNC_THRESHOLD: 1, // Umbral para sincronización de scroll
    AUTO_DETECT_DELAY: 100 // Delay para auto-detectar franja horaria
  }
} as const;

export const CATEGORY_COLORS = {
  'cine': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  'movie': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  'series': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  'noticias': 'bg-red-500/20 text-red-300 border-red-500/50',
  'news': 'bg-red-500/20 text-red-300 border-red-500/50',
  'deportes': 'bg-green-500/20 text-green-300 border-green-500/50',
  'sports': 'bg-green-500/20 text-green-300 border-green-500/50',
  'documental': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  'documentary': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  'entretenimiento': 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  'entertainment': 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  'infantil': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  'kids': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  'música': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
  'music': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
  'estilo de vida': 'bg-teal-500/20 text-teal-300 border-teal-500/50',
  'lifestyle': 'bg-teal-500/20 text-teal-300 border-teal-500/50',
  'default': 'bg-gray-500/20 text-gray-300 border-gray-500/50'
} as const;

export const CATEGORY_DISPLAY_NAMES = {
  'cine': 'Película',
  'movie': 'Película',
  'series': 'Serie',
  'noticias': 'Noticias',
  'news': 'Noticias',
  'deportes': 'Deportes',
  'sports': 'Deportes',
  'documental': 'Documental',
  'documentary': 'Documental',
  'entretenimiento': 'Entretenimiento',
  'entertainment': 'Entretenimiento',
  'infantil': 'Infantil',
  'kids': 'Infantil',
  'música': 'Música',
  'music': 'Música',
  'estilo de vida': 'Estilo de vida',
  'lifestyle': 'Estilo de vida'
} as const;