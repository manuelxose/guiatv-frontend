export type StreamingComparisonTone = 'positive' | 'neutral' | 'caution';

export interface StreamingComparisonStatus {
  label: string;
  tone: StreamingComparisonTone;
}

export interface StreamingComparisonEntry {
  platformKey: string;
  startingMonthlyPrice: string;
  startingAnnualPrice: string;
  freeTrial: string;
  simultaneousStreams: string;
  maxResolution: string;
  downloads: StreamingComparisonStatus;
  ads: StreamingComparisonStatus;
  liveContent: StreamingComparisonStatus;
  bestFor: string;
  highlight: string;
  note: string;
  profile: string;
  lastReviewedAt: string;
}

export interface StreamingComparisonSummaryCard {
  value: string;
  label: string;
  description: string;
}

export interface StreamingComparisonProfileCard {
  title: string;
  description: string;
  platformKeys: string[];
}

export interface StreamingComparisonFaqItem {
  question: string;
  answer: string;
}

export const STREAMING_COMPARISON_LAST_REVIEWED_AT = 'marzo 2026';

export const STREAMING_COMPARISON_SUMMARY_CARDS: StreamingComparisonSummaryCard[] = [
  {
    value: '11',
    label: 'plataformas revisadas',
    description: 'Solo servicios que ya enlazan con el catálogo real de Guía TV.',
  },
  {
    value: '2',
    label: 'opciones gratis',
    description: 'RTVE Play y Pluto TV siguen siendo el acceso sin coste más claro.',
  },
  {
    value: '1 clic',
    label: 'al catálogo filtrado',
    description: 'Cada tarjeta abre /plataformas con filtros reales de proveedor.',
  },
];

export const STREAMING_COMPARISON_PROFILE_CARDS: StreamingComparisonProfileCard[] = [
  {
    title: 'Quiero catálogo amplio sin pensar demasiado',
    description:
      'Para quien prioriza volumen, franquicias y una mezcla constante de cine y series.',
    platformKeys: ['netflix', 'prime-video', 'disney-plus'],
  },
  {
    title: 'Busco directo, deporte y eventos',
    description:
      'Si mezclas streaming con emisiones vivas, estas plataformas encajan mejor en la rutina diaria.',
    platformKeys: ['movistar-plus', 'prime-video', 'pluto-tv'],
  },
  {
    title: 'Prefiero curaduría y cine de autor',
    description:
      'Menos ruido, más selección editorial y fondo de catálogo pensado para descubrir.',
    platformKeys: ['filmin', 'rtve-play', 'max'],
  },
  {
    title: 'Necesito una opción gratis o muy contenida',
    description:
      'Buenas puertas de entrada si todavía no quieres sumar otra suscripción mensual.',
    platformKeys: ['rtve-play', 'pluto-tv', 'atresplayer'],
  },
];

export const STREAMING_COMPARISON_FAQ_ITEMS: StreamingComparisonFaqItem[] = [
  {
    question: '¿Los precios son definitivos o pueden cambiar?',
    answer:
      'Se muestran importes editoriales revisados a partir de las páginas oficiales de cada servicio en España. Promociones, bundles y operadoras pueden alterar el precio final.',
  },
  {
    question: '¿Por qué algunas plataformas no tienen anual visible?',
    answer:
      'No todos los servicios publican un anual estándar en la misma landing o lo mantienen siempre activo. En esos casos dejamos la referencia como no disponible para no inventar un ahorro.',
  },
  {
    question: '¿Qué pasa cuando pulso una plataforma?',
    answer:
      'No sales a una ficha estática. Abrimos el catálogo real de /plataformas con el proveedor ya filtrado para ver qué títulos tiene cargados la app ahora mismo.',
  },
  {
    question: '¿Por qué no aparecen todos los servicios del mercado?',
    answer:
      'La comparativa está limitada a proveedores que ya forman parte del ecosistema de catálogo de Guía TV y pueden enlazarse con filtros funcionales dentro de la app.',
  },
];

export const STREAMING_COMPARISON_ENTRIES: StreamingComparisonEntry[] = [
  {
    platformKey: 'netflix',
    startingMonthlyPrice: 'Consulta web',
    startingAnnualPrice: 'No disponible',
    freeTrial: 'No',
    simultaneousStreams: '2-4 según plan',
    maxResolution: '1080p-4K HDR',
    downloads: { label: 'Sí', tone: 'positive' },
    ads: { label: 'Sí, en plan de entrada', tone: 'caution' },
    liveContent: { label: 'No', tone: 'neutral' },
    bestFor: 'Series globales y originales propios',
    highlight:
      'Sigue siendo la referencia cuando lo importante es tener volumen, conversación cultural y estrenos propios muy constantes.',
    note:
      'La página pública de precios cambia por mercado y por plan. Antes de contratar conviene revisar el importe final que Netflix muestre en España.',
    profile: 'Maratón de series y lanzamientos propios.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'prime-video',
    startingMonthlyPrice: '4,99 €',
    startingAnnualPrice: '49,90 €',
    freeTrial: '30 días',
    simultaneousStreams: '3',
    maxResolution: '4K HDR',
    downloads: { label: 'Sí', tone: 'positive' },
    ads: { label: 'Sí, en algunos planes', tone: 'caution' },
    liveContent: { label: 'Sí', tone: 'positive' },
    bestFor: 'Ahorro, catálogo amplio y eventos puntuales',
    highlight:
      'Es la entrada más competitiva si ya usas Amazon Prime y quieres mezclar catálogo generalista con deporte o canales complementarios.',
    note:
      'El precio mostrado corresponde al acceso estándar de Prime Video dentro de Amazon Prime en España.',
    profile: 'Relación precio/cobertura.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'disney-plus',
    startingMonthlyPrice: '6,99 €',
    startingAnnualPrice: '109,90 €',
    freeTrial: 'No',
    simultaneousStreams: '2-4 según plan',
    maxResolution: '1080p-4K HDR',
    downloads: { label: 'Según plan', tone: 'caution' },
    ads: { label: 'Sí, según plan', tone: 'caution' },
    liveContent: { label: 'No', tone: 'neutral' },
    bestFor: 'Familia, franquicias y blockbusters',
    highlight:
      'Ideal cuando priorizas Disney, Pixar, Marvel, Star Wars y una experiencia fuerte para consumo familiar o de saga.',
    note:
      'El anual visible arranca en modalidades sin anuncios; el plan de entrada con anuncios mantiene ciclo mensual.',
    profile: 'Familiar y franquicias.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'max',
    startingMonthlyPrice: '6,99 €',
    startingAnnualPrice: 'No disponible',
    freeTrial: 'No',
    simultaneousStreams: '2-4 según plan',
    maxResolution: '1080p-4K',
    downloads: { label: 'Según plan', tone: 'caution' },
    ads: { label: 'Sí, según plan', tone: 'caution' },
    liveContent: { label: 'No', tone: 'neutral' },
    bestFor: 'Series premium y universo Warner/HBO',
    highlight:
      'Conviene cuando lo que buscas es marca HBO, cine de estudio y una biblioteca reconocible de prestige TV.',
    note:
      'La entrada con anuncios arranca en 6,99 € en España. Los planes superiores dependen del nivel elegido o del distribuidor.',
    profile: 'Prestige TV y Warner.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'movistar-plus',
    startingMonthlyPrice: '9,99 €',
    startingAnnualPrice: '99,90 €',
    freeTrial: 'Promos puntuales',
    simultaneousStreams: '2-4 según acceso',
    maxResolution: 'HD-4K',
    downloads: { label: 'Sí', tone: 'positive' },
    ads: { label: 'No', tone: 'positive' },
    liveContent: { label: 'Sí', tone: 'positive' },
    bestFor: 'Directo, deporte y producción local',
    highlight:
      'Es la opción más completa si quieres convivir con emisiones vivas, deporte y estrenos de series o cine dentro de un único ecosistema.',
    note:
      'La suscripción base en web parte de 9,99 €/mes o 99,90 €/año. El alcance final cambia mucho con paquetes de operadora.',
    profile: 'Directo y deporte.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'skyshowtime',
    startingMonthlyPrice: '8,99 €',
    startingAnnualPrice: 'No disponible',
    freeTrial: 'Promos puntuales',
    simultaneousStreams: '2-5 según plan',
    maxResolution: '1080p-4K',
    downloads: { label: 'Según plan', tone: 'caution' },
    ads: { label: 'Sí, según plan', tone: 'caution' },
    liveContent: { label: 'No', tone: 'neutral' },
    bestFor: 'Catálogo de estudio con huecos muy concretos',
    highlight:
      'Funciona mejor cuando quieres una segunda suscripción centrada en sagas de Paramount, Universal y SHOWTIME.',
    note:
      'SkyShowtime mueve promociones semestrales y cambios de plan con frecuencia. El precio base visible en 2026 arranca en 8,99 €/mes.',
    profile: 'Complemento de catálogo.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'apple-tv-plus',
    startingMonthlyPrice: '9,99 €',
    startingAnnualPrice: 'No disponible',
    freeTrial: '7 días',
    simultaneousStreams: '6',
    maxResolution: '4K HDR',
    downloads: { label: 'Sí', tone: 'positive' },
    ads: { label: 'No', tone: 'positive' },
    liveContent: { label: 'Eventos concretos', tone: 'caution' },
    bestFor: 'Originales premium y consumo corto',
    highlight:
      'Poco volumen, pero nivel muy alto de producción si quieres series y películas originales muy seleccionadas.',
    note:
      'Apple TV+ no suele exponer un anual propio para esta suscripción en España; se comercializa con ciclo mensual y prueba breve.',
    profile: 'Originales premium y consumo selectivo.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'filmin',
    startingMonthlyPrice: '9,99 €',
    startingAnnualPrice: '99,00 €',
    freeTrial: 'No fijo',
    simultaneousStreams: '2',
    maxResolution: 'HD-4K según título',
    downloads: { label: 'Sí', tone: 'positive' },
    ads: { label: 'No', tone: 'positive' },
    liveContent: { label: 'No', tone: 'neutral' },
    bestFor: 'Cine europeo, festivales y curaduría',
    highlight:
      'Es la plataforma que mejor resuelve el perfil de cinéfilo que quiere descubrir más y no solo perseguir franquicias.',
    note:
      'Filmin mantiene una de las mejores bibliotecas de autor en España y la cuota anual sigue siendo una de sus bazas más claras.',
    profile: 'Cine de autor y descubrimiento.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'atresplayer',
    startingMonthlyPrice: '5,99 €',
    startingAnnualPrice: '59,99 €',
    freeTrial: 'No',
    simultaneousStreams: '1-3 según plan',
    maxResolution: '1080p',
    downloads: { label: 'Según plan', tone: 'caution' },
    ads: { label: 'Sí, según plan', tone: 'caution' },
    liveContent: { label: 'Sí', tone: 'positive' },
    bestFor: 'Programas, realities y ficción española',
    highlight:
      'Muy útil si lo tuyo es seguir formatos de Atresmedia, emisiones en directo y una capa premium de contenido nacional.',
    note:
      'La entrada visible con anuncios parte de 5,99 €/mes o 59,99 €/año; los planes superiores cambian pantallas y extras.',
    profile: 'TV española y formato.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'rtve-play',
    startingMonthlyPrice: 'Gratis',
    startingAnnualPrice: 'Gratis',
    freeTrial: 'No aplica',
    simultaneousStreams: '1-5 según directo',
    maxResolution: '1080p',
    downloads: { label: 'No', tone: 'neutral' },
    ads: { label: 'No comercial', tone: 'positive' },
    liveContent: { label: 'Sí', tone: 'positive' },
    bestFor: 'Acceso público, archivo y directos',
    highlight:
      'La opción más práctica para cubrir eventos, archivo de RTVE y consumo ocasional sin añadir otra suscripción.',
    note:
      'RTVE Play es gratuita como servicio generalista. La comparativa se centra en esa capa abierta porque es la que ya conecta mejor con la app.',
    profile: 'Gratis y utilidad diaria.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
  {
    platformKey: 'pluto-tv',
    startingMonthlyPrice: 'Gratis',
    startingAnnualPrice: 'Gratis',
    freeTrial: 'No aplica',
    simultaneousStreams: '1',
    maxResolution: '1080p',
    downloads: { label: 'No', tone: 'neutral' },
    ads: { label: 'Sí', tone: 'caution' },
    liveContent: { label: 'Sí', tone: 'positive' },
    bestFor: 'Canales FAST y consumo sin registro',
    highlight:
      'Encaja muy bien como capa gratuita para zapping, catálogo ligero y canales temáticos siempre activos.',
    note:
      'Pluto TV vive de la publicidad y no exige suscripción. La fortaleza está más en la inmediatez que en el control fino del catálogo.',
    profile: 'Gratis, rápido y sin alta.',
    lastReviewedAt: STREAMING_COMPARISON_LAST_REVIEWED_AT,
  },
];
