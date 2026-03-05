/**
 * Canonical category names used across the platform.
 * Raw EPG category strings are mapped to these during sync.
 */

const RAW_TO_CANONICAL: Record<string, string> = {
  // Cine / Películas
  cine: 'Cine',
  película: 'Cine',
  pelicula: 'Cine',
  peliculas: 'Cine',
  películas: 'Cine',
  movie: 'Cine',
  film: 'Cine',
  cinema: 'Cine',
  'cine español': 'Cine',
  'cine western': 'Cine',
  'cine de barrio': 'Cine',
  'tv movie': 'Cine',
  telefilm: 'Cine',

  // Series
  serie: 'Series',
  series: 'Series',
  'tv series': 'Series',
  'serie de tv': 'Series',
  drama: 'Series',
  'drama series': 'Series',
  comedia: 'Series',
  comedy: 'Series',
  thriller: 'Series',
  sitcom: 'Series',

  // Deportes
  deporte: 'Deportes',
  deportes: 'Deportes',
  futbol: 'Deportes',
  fútbol: 'Deportes',
  'fußball': 'Deportes',
  football: 'Deportes',
  sport: 'Deportes',
  sports: 'Deportes',
  desporto: 'Deportes',
  desportos: 'Deportes',
  multisports: 'Deportes',
  baloncesto: 'Deportes',
  tenis: 'Deportes',
  ciclismo: 'Deportes',
  motociclismo: 'Deportes',
  'formula 1': 'Deportes',
  hípica: 'Deportes',
  hipica: 'Deportes',
  equitación: 'Deportes',
  futebol: 'Deportes',

  // Noticias
  noticia: 'Noticias',
  noticias: 'Noticias',
  informativo: 'Noticias',
  informativos: 'Noticias',
  información: 'Noticias',
  informacion: 'Noticias',
  'notícias': 'Noticias',
  news: 'Noticias',
  'current affairs': 'Noticias',
  actualidad: 'Noticias',
  meteorología: 'Noticias',

  // Documentales
  documental: 'Documental',
  documentales: 'Documental',
  documentary: 'Documental',
  naturaleza: 'Documental',
  nature: 'Documental',
  ciencia: 'Documental',

  // Infantil
  infantil: 'Infantil',
  niños: 'Infantil',
  children: 'Infantil',
  kids: 'Infantil',
  dibujos: 'Infantil',
  'dibujos animados': 'Infantil',
  animación: 'Infantil',
  animacion: 'Infantil',
  anime: 'Infantil',

  // Entretenimiento
  entretenimiento: 'Entretenimiento',
  entretenimento: 'Entretenimiento',
  entertainment: 'Entretenimiento',
  show: 'Entretenimiento',
  'game show': 'Entretenimiento',
  'talk show': 'Entretenimiento',
  variedades: 'Entretenimiento',
  humor: 'Entretenimiento',
  reality: 'Entretenimiento',
  'reality show': 'Entretenimiento',
  telerrealidad: 'Entretenimiento',
  magacín: 'Entretenimiento',

  // Concurso
  concurso: 'Concurso',
  concursos: 'Concurso',
  quiz: 'Concurso',
  'quiz show': 'Concurso',

  // Magazine
  magazine: 'Magazine',
  magazin: 'Magazine',
  'magazine sportif': 'Deportes',
  'magazine de desporto': 'Deportes',
  programa: 'Magazine',
  programas: 'Magazine',
  'morning show': 'Magazine',
  'estilo de vida': 'Magazine',
  'ocio y aficiones': 'Entretenimiento',

  // Música
  musica: 'Música',
  música: 'Música',
  music: 'Música',
  musical: 'Música',

  // Cocina
  cocina: 'Cocina',
  gastronomía: 'Cocina',
  cooking: 'Cocina',
  'alimentación y cocina': 'Cocina',

  // Religión
  religión: 'Religión',
  religion: 'Religión',
  religious: 'Religión',

  // More sub-genres mapping to main categories
  acción: 'Cine',
  'accion': 'Cine',
  aventuras: 'Cine',
  'ciencia ficción': 'Cine',
  terror: 'Cine',
  suspense: 'Cine',
  western: 'Cine',
  'bélico': 'Cine',
  belico: 'Cine',
  movies: 'Cine',
  crimen: 'Series',
  policiaco: 'Series',
  policíaco: 'Series',
  policíaca: 'Series',
  'programa deportivo': 'Deportes',
  'programa deportes': 'Deportes',
  'programa infantil': 'Infantil',
  motor: 'Deportes',
  golf: 'Deportes',
  rugby: 'Deportes',
  atletismo: 'Deportes',
  boxeo: 'Deportes',
  'artes marciales': 'Deportes',
  vela: 'Deportes',
  'caza y pesca': 'Deportes',
  viajes: 'Documental',
  'viajes y aventuras': 'Documental',
  historia: 'Documental',
  otros: 'Entretenimiento',
  série: 'Series',
};

/**
 * Normalizes a raw EPG category string to a single canonical name.
 * Handles comma-separated multi-value categories (e.g. "Deportes, Fútbol").
 * Tries each part individually, also attempts substring matching,
 * and returns the first canonical match found.
 */
export function normalizeCategory(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  // Try exact match on each part first
  for (const part of parts) {
    const lower = part.toLowerCase();
    const exact = RAW_TO_CANONICAL[lower];
    if (exact) return exact;
  }

  // Try substring matching: check if any key appears as a word in any part
  for (const part of parts) {
    const lower = part.toLowerCase();
    for (const [key, canonical] of Object.entries(RAW_TO_CANONICAL)) {
      if (lower.includes(key) && key.length >= 4) {
        return canonical;
      }
    }
  }

  // Fallback: capitalize the first part
  return capitalize(parts[0]);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
