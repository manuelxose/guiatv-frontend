/**
 * Utilidades para el Blog - Optimizado para SEO y Performance
 */

/**
 * Convierte la diferencia entre dos fechas a duración ISO 8601 para schema.org
 * @param start - Fecha/hora de inicio (string ISO o Date)
 * @param stop - Fecha/hora de fin (string ISO o Date)
 * @returns string en formato PTxHyM (ej. "PT1H45M", "PT30M")
 */
export function durationToISO8601(start: string, stop: string): string {
  try {
    const startDate = new Date(start);
    const stopDate = new Date(stop);
    const diffMs = stopDate.getTime() - startDate.getTime();
    if (isNaN(diffMs) || diffMs <= 0) return '';
    const totalMinutes = Math.round(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `PT${hours}H${minutes}M`;
    if (hours > 0) return `PT${hours}H`;
    return `PT${minutes}M`;
  } catch {
    return '';
  }
}

/**
 * Convierte una duración en minutos a ISO 8601
 * @param minutes - Duración en minutos
 * @returns string en formato PTxHyM
 */
export function minutesToISO8601(minutes: number): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `PT${hours}H${mins}M`;
  if (hours > 0) return `PT${hours}H`;
  return `PT${mins}M`;
}

/**
 * Elimina etiquetas HTML de un string
 * @param html - String con HTML
 * @returns Texto plano
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Calcula el tiempo de lectura de un texto
 * @param content - Contenido HTML
 * @param wordsPerMinute - Palabras por minuto (default: 200)
 * @returns Tiempo de lectura en minutos
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 200
): number {
  if (!content) return 1;

  const text = stripHtml(content);
  const words = text.trim().split(/\s+/).length;

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Formatea una fecha para SEO
 * @param date - Fecha a formatear
 * @returns Fecha en formato ISO 8601
 */
export function formatDateForSEO(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Genera un excerpt de un texto
 * @param content - Contenido completo
 * @param maxLength - Longitud máxima (default: 160 para meta description)
 * @returns Excerpt truncado
 */
export function generateExcerpt(
  content: string,
  maxLength: number = 160
): string {
  if (!content) return '';

  const text = stripHtml(content);

  if (text.length <= maxLength) {
    return text;
  }

  // Truncar en el último espacio antes del límite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return (
    (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...'
  );
}

/**
 * Valida si una URL es válida
 * @param url - URL a validar
 * @returns true si es válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera una URL absoluta desde una relativa
 * @param relativePath - Path relativo
 * @param baseUrl - URL base (default: window.location.origin)
 * @returns URL absoluta
 */
export function getAbsoluteUrl(relativePath: string, baseUrl?: string): string {
  const base =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return new URL(relativePath, base).href;
}

/**
 * Sanitiza texto para evitar XSS
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

/**
 * Debounce function para optimizar búsquedas
 * @param func - Función a ejecutar
 * @param wait - Tiempo de espera en ms
 * @returns Función debounced
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Convierte bytes a formato legible
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtiene el color de una categoría
 * @param categoryName - Nombre de la categoría
 * @returns Color en formato Tailwind
 */
export function getCategoryColor(categoryName: string): string {
  const colors: { [key: string]: string } = {
    cine: 'red',
    series: 'blue',
    anime: 'purple',
    noticias: 'green',
    'top 10': 'yellow',
    reseñas: 'pink',
  };

  const normalized = categoryName.toLowerCase();
  return colors[normalized] || 'gray';
}

/**
 * Genera Schema.org JSON-LD para un post
 * @param post - Datos del post
 * @param baseUrl - URL base del sitio
 * @returns Objeto Schema.org
 */
export function generatePostSchema(post: any, baseUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title?.rendered || '',
    image: post.featured_image?.source_url || '',
    datePublished: formatDateForSEO(post.date),
    dateModified: formatDateForSEO(post.modified || post.date),
    author: {
      '@type': 'Organization',
      name: 'Guía Programación',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Guía Programación',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/assets/images/logo.png`,
      },
    },
    description: generateExcerpt(
      post.excerpt?.rendered || post.content?.rendered,
      160
    ),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/editorial/${slugify(post.slug)}`,
    },
  };
}

export function generateCollectionPageSchema(config: {
  name: string;
  description?: string;
  path: string;
}, baseUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.name,
    description: config.description || '',
    url: `${baseUrl}${config.path}`,
    inLanguage: 'es-ES',
  };
}

export function generateEditorialArticleSchema(post: {
  title: string;
  excerptText?: string;
  coverImage?: string;
  publishedAt?: string;
  modifiedAt?: string;
  canonicalPath: string;
  contentType?: string;
  targetQuery?: string | null;
}, baseUrl: string): object {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerptText || '',
    image: post.coverImage || '',
    datePublished: post.publishedAt ? formatDateForSEO(post.publishedAt) : undefined,
    dateModified: post.modifiedAt
      ? formatDateForSEO(post.modifiedAt)
      : post.publishedAt
      ? formatDateForSEO(post.publishedAt)
      : undefined,
    author: {
      '@type': 'Organization',
      name: 'Guia TV',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Guia TV',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/assets/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${post.canonicalPath}`,
    },
    articleSection: post.contentType || 'guide',
    inLanguage: 'es-ES',
  };

  if (post.targetQuery) {
    schema.keywords = [post.targetQuery];
  }

  Object.keys(schema).forEach((key) => {
    if (schema[key] === undefined || schema[key] === '') {
      delete schema[key];
    }
  });

  return schema;
}

/**
 * Genera breadcrumbs para Schema.org
 * @param items - Array de items del breadcrumb
 * @param baseUrl - URL base del sitio
 * @returns Objeto BreadcrumbList Schema.org
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  baseUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Detecta si el usuario está en un dispositivo móvil
 * @returns true si es móvil
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Copia texto al portapapeles
 * @param text - Texto a copiar
 * @returns Promise<boolean>
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Scroll suave a un elemento
 * @param elementId - ID del elemento
 * @param offset - Offset en pixels (default: 0)
 */
export function smoothScrollTo(elementId: string, offset: number = 0): void {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) return;

  const targetPosition =
    element.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth',
  });
}

export function diffHour(start_string: string, stop_string: string) {
  const start = new Date(start_string);
  const stop = new Date(stop_string);

  const diffMs = stop.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / 1000 / 60 / 60);
  const diffMins = Math.floor((diffMs / 1000 / 60) % 60);

  let diff = `${diffHrs}h ${diffMins}min`;
  if (diffHrs === 0) {
    diff = `${diffMins}min`;
  }

  return diff;
}

export function getHoraInicio(inicio: string) {
  //la salida de la funcion es un string con la hora de inicio del programa
  //ejemplo: 21:15 (formato 24 horas)
  //CORREGIDO: Los datos vienen con 2 horas de más, aplicamos corrección centralizada

  // Usar la utilidad centralizada para consistencia
  return formatCorrectTime(inicio);
}

export function isLive(dateIni: string, dateFin: string): boolean {
  // Get current time in UTC (no timezone adjustments)
  const now = new Date();
  const start = new Date(dateIni);
  const end = new Date(dateFin);

  // Check if current time is between start and end
  const isCurrentlyLive = now >= start && now <= end;
  
  return isCurrentlyLive;
}

/**
 * Trunca un título a un número específico de caracteres
 * @param title - Título a truncar
 * @param limit - Límite de caracteres (default: 60)
 * @returns Título truncado
 */
export function truncateTitle(title: string, limit: number = 60): string {
  if (!title) return '';

  const cleanTitle = stripHtml(title);

  if (cleanTitle.length <= limit) {
    return cleanTitle;
  }

  return cleanTitle.substring(0, limit).trim() + '...';
}

/**
 * Utilidad centralizada para manejo de fechas con corrección de zona horaria
 * CORREGIDO: Aplicar corrección de 2 horas para alinear con hora local española
 */
export function getCorrectTime(dateString: string): Date {
  const date = new Date(dateString);
  // Aplicar corrección de zona horaria (restar 2 horas)
  // Los datos parecen venir en UTC+2 y necesitamos mostrar hora local española
  date.setHours(date.getHours() - 2);
  return date;
}

export function getCorrectHour(dateString: string): number {
  return getCorrectTime(dateString).getHours();
}

export function formatCorrectTime(dateString: string): string {
  return getCorrectTime(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Función de debug para analizar problemas de zona horaria
 */
export function debugTimeZone(dateString: string, context: string = ''): void {
  void dateString;
  void context;
}

// ─── SEO Schema Generators ────────────────────────────────────────

/**
 * Genera JSON-LD TVSeries para una serie
 */
export function generateTVSeriesSchema(item: {
  title: string;
  synopsis?: string;
  image?: string;
  backdrop?: string;
  genres?: string[];
  cast?: Array<{ name: string; character?: string }>;
  director?: string;
  releaseYear?: number;
  rating?: number;
  slug?: string;
}, baseUrl: string): object {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: item.title,
    url: `${baseUrl}/series/${item.slug || ''}`,
  };
  if (item.synopsis) schema.description = item.synopsis;
  if (item.backdrop || item.image) schema.image = item.backdrop || item.image;
  if (item.genres?.length) schema.genre = item.genres;
  if (item.releaseYear) schema.datePublished = String(item.releaseYear);
  if (item.director) schema.director = { '@type': 'Person', name: item.director };
  if (item.cast?.length) {
    schema.actor = item.cast.slice(0, 10).map(c => ({
      '@type': 'Person',
      name: c.name,
    }));
  }
  if (item.rating && item.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: item.rating,
      bestRating: 10,
      worstRating: 0,
    };
  }
  schema.inLanguage = 'es';
  return schema;
}

/**
 * Genera JSON-LD Movie para una película
 */
export function generateMovieSchema(item: {
  title: string;
  synopsis?: string;
  image?: string;
  backdrop?: string;
  genres?: string[];
  cast?: Array<{ name: string; character?: string }>;
  director?: string;
  releaseYear?: number;
  rating?: number;
  durationMinutes?: number;
  slug?: string;
}, baseUrl: string): object {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: item.title,
    url: `${baseUrl}/peliculas/${item.slug || ''}`,
  };
  if (item.synopsis) schema.description = item.synopsis;
  if (item.backdrop || item.image) schema.image = item.backdrop || item.image;
  if (item.genres?.length) schema.genre = item.genres;
  if (item.releaseYear) schema.datePublished = String(item.releaseYear);
  if (item.director) schema.director = { '@type': 'Person', name: item.director };
  if (item.durationMinutes) schema.duration = minutesToISO8601(item.durationMinutes);
  if (item.cast?.length) {
    schema.actor = item.cast.slice(0, 10).map(c => ({
      '@type': 'Person',
      name: c.name,
    }));
  }
  if (item.rating && item.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: item.rating,
      bestRating: 10,
      worstRating: 0,
    };
  }
  schema.inLanguage = 'es';
  return schema;
}

/**
 * Genera JSON-LD ItemList para colecciones/carruseles
 */
export function generateItemListSchema(
  items: Array<{ title: string; detailPath?: string; image?: string }>,
  listName: string,
  baseUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 10).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: item.detailPath ? `${baseUrl}${item.detailPath}` : undefined,
      image: item.image || undefined,
    })),
  };
}

/**
 * Genera JSON-LD FAQPage
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Genera JSON-LD VideoObject para trailers
 */
export function generateVideoObjectSchema(video: {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  durationMinutes?: number;
  contentUrl?: string;
  embedUrl?: string;
}): object {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
  };
  if (video.description) schema.description = video.description;
  if (video.thumbnailUrl) schema.thumbnailUrl = video.thumbnailUrl;
  if (video.uploadDate) schema.uploadDate = video.uploadDate;
  if (video.durationMinutes) schema.duration = minutesToISO8601(video.durationMinutes);
  if (video.contentUrl) schema.contentUrl = video.contentUrl;
  if (video.embedUrl) schema.embedUrl = video.embedUrl;
  return schema;
}

/**
 * Genera JSON-LD WebApplication
 */
export function generateWebApplicationSchema(baseUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Guía Programación TV',
    url: baseUrl,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    inLanguage: 'es',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    description: 'Guía completa de programación de televisión y streaming en España.',
  };
}

/**
 * Genera JSON-LD Organization enriquecido
 */
export function generateOrganizationSchema(baseUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Guía Programación TV',
    alternateName: 'GuíaProgramaciónTV',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/assets/images/logo.png`,
    },
    description: 'Guía completa de programación de televisión y streaming en España. Consulta la parrilla de TV, recomendaciones y catálogo de plataformas.',
    foundingDate: '2023',
    areaServed: {
      '@type': 'Country',
      name: 'España',
    },
    sameAs: [
      'https://twitter.com/gptv',
      'https://facebook.com/gptv',
      'https://instagram.com/gptv',
      'https://youtube.com/gptv',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'soporte@tecnoriasl.com',
      availableLanguage: 'Spanish',
    },
  };
}

// ─── End SEO Schema Generators ────────────────────────────────────

/**
 * Convierte un título en un slug SEO-friendly
 * @param text - Texto a convertir
 * @returns Slug formateado
 */
export function slugify(text: string): string {
  if (!text) return '';

  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Reemplazar espacios con guiones
      .replace(/\s+/g, '-')
      // Remover caracteres especiales excepto guiones
      .replace(/[^\w-]+/g, '')
      // Reemplazar múltiples guiones con uno solo
      .replace(/--+/g, '-')
      // Remover guiones al inicio y final
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  );
}
