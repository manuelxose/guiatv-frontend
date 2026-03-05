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
  sport: 'Deportes',
  sports: 'Deportes',
  baloncesto: 'Deportes',
  tenis: 'Deportes',
  ciclismo: 'Deportes',
  motociclismo: 'Deportes',
  'formula 1': 'Deportes',

  // Noticias
  noticia: 'Noticias',
  noticias: 'Noticias',
  informativo: 'Noticias',
  informativos: 'Noticias',
  news: 'Noticias',
  'current affairs': 'Noticias',
  actualidad: 'Noticias',

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
  animación: 'Infantil',
  animacion: 'Infantil',

  // Entretenimiento
  entretenimiento: 'Entretenimiento',
  entertainment: 'Entretenimiento',
  show: 'Entretenimiento',
  'game show': 'Entretenimiento',
  'talk show': 'Entretenimiento',
  variedades: 'Entretenimiento',
  humor: 'Entretenimiento',
  reality: 'Entretenimiento',

  // Concurso
  concurso: 'Concurso',
  concursos: 'Concurso',
  quiz: 'Concurso',
  'quiz show': 'Concurso',

  // Magazine
  magazine: 'Magazine',
  magazin: 'Magazine',
  programa: 'Magazine',
  programas: 'Magazine',
  'morning show': 'Magazine',

  // Música
  musica: 'Música',
  música: 'Música',
  music: 'Música',
  musical: 'Música',

  // Cocina
  cocina: 'Cocina',
  gastronomía: 'Cocina',
  cooking: 'Cocina',

  // Religión
  religión: 'Religión',
  religion: 'Religión',
  religious: 'Religión',
};

/**
 * Normalizes a raw EPG category string to a canonical name.
 * Returns the capitalized original if no mapping is found.
 */
export function normalizeCategory(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  return RAW_TO_CANONICAL[lower] ?? capitalize(trimmed);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
