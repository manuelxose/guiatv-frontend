/**
 * Utilidades para el Blog - Optimizado para SEO y Performance
 */

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
      '@id': `${baseUrl}/blog/${slugify(post.slug)}`,
    },
  };
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
  // Obtiene la hora actual, la hora de inicio y la hora de fin

  let horaActual = new Date(); // Suma 1 hora en milisegundos (3600000 ms)
  horaActual.setHours(horaActual.getHours() + 1);
  const horaInicio = new Date(dateIni);
  const horaFin = new Date(dateFin);

  // Obtén las horas y minutos de la hora actual y las horas de inicio y fin
  if (horaActual >= horaInicio && horaActual <= horaFin) {
    return true;
  }
  return false;
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
  const originalDate = new Date(dateString);
  const correctedDate = getCorrectTime(dateString);

  console.log(`🕐 DEBUG TIMEZONE ${context}:`);
  console.log(`   Raw string: ${dateString}`);
  console.log(`   Original UTC: ${originalDate.toISOString()}`);
  console.log(`   Original local: ${originalDate.toLocaleString('es-ES')}`);
  console.log(`   Corrected: ${correctedDate.toLocaleString('es-ES')}`);
  console.log(
    `   Raw hour: ${originalDate.getHours()} -> Corrected hour: ${correctedDate.getHours()}`
  );
  console.log('---');
}

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
      .replace(/[^\w\-]+/g, '')
      // Reemplazar múltiples guiones con uno solo
      .replace(/\-\-+/g, '-')
      // Remover guiones al inicio y final
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  );
}
