import { CommercialRelationship, MonetizationOfferDTO, OfferIntent } from '../dto/MonetizationDTO';

export interface MonetizationOfferConfig extends Omit<MonetizationOfferDTO, 'outbound' | 'verification'> {
  destinationUrl: string;
  allowedHosts: string[];
  affiliateEnvKey: string;
  defaultRelationship: CommercialRelationship;
  verifiedAt: string;
  sourceUrl: string;
  verificationStatus?: 'current' | 'stale' | 'needs_review';
}

const commonRequirements = {
  commitmentMonths: 0,
  fibreRequired: false,
  mobileRequired: false,
  device: null,
};

const offer = (
  config: Omit<MonetizationOfferConfig, 'market' | 'requirements' | 'disclosure'> & {
    requirements?: MonetizationOfferConfig['requirements'];
    disclosure?: string;
  }
): MonetizationOfferConfig => ({
  market: 'ES',
  requirements: commonRequirements,
  disclosure: 'GuíaTV no recibe comisión por este enlace directo.',
  ...config,
});

export const MONETIZATION_OFFERS: MonetizationOfferConfig[] = [
  offer({
    id: 'netflix-standard-with-ads', provider: { id: 'netflix', name: 'Netflix' },
    plan: { id: 'standard-with-ads', name: 'Estándar con anuncios' },
    pricing: { currency: 'EUR', monthlyAmount: 8.99, annualAmount: null, monthlyLabel: '8,99 €/mes', annualLabel: 'No disponible', activationFeeAmount: null },
    features: { simultaneousStreams: '2', maxResolution: '1080p', downloads: true, ads: true, liveContent: false, sports: false, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'Series globales y estrenos propios', highlight: 'Catálogo amplio y lanzamientos propios constantes.',
    recommendation: { intents: ['movies', 'family'] }, destinationUrl: 'https://www.netflix.com/es/signup', allowedHosts: ['netflix.com'], affiliateEnvKey: 'AFFILIATE_NETFLIX_URL', defaultRelationship: 'direct_commercial_link', verifiedAt: '2026-08-12', sourceUrl: 'https://www.netflix.com/es/',
  }),
  offer({
    id: 'prime-video-prime', provider: { id: 'prime-video', name: 'Prime Video' }, plan: { id: 'prime', name: 'Amazon Prime' },
    pricing: { currency: 'EUR', monthlyAmount: 4.99, annualAmount: 49.90, monthlyLabel: '4,99 €/mes', annualLabel: '49,90 €/año', activationFeeAmount: null },
    features: { simultaneousStreams: '3', maxResolution: '4K HDR', downloads: true, ads: true, liveContent: true, sports: true, football: false, movies: true, series: true, family: true, fourK: true },
    trialDays: 30, bestFor: 'Precio, catálogo y ventajas Prime', highlight: 'La cuota incluye Prime Video y el resto de ventajas Amazon Prime.',
    recommendation: { intents: ['cheapest', 'movies', 'family'] }, destinationUrl: 'https://www.amazon.es/amazonprime', allowedHosts: ['amazon.es'], affiliateEnvKey: 'AFFILIATE_PRIME_VIDEO_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-08-26', sourceUrl: 'https://www.amazon.es/amazonprime',
  }),
  offer({
    id: 'disney-plus-standard-with-ads', provider: { id: 'disney-plus', name: 'Disney+' }, plan: { id: 'standard-with-ads', name: 'Estándar con anuncios' },
    pricing: { currency: 'EUR', monthlyAmount: 6.99, annualAmount: null, monthlyLabel: '6,99 €/mes', annualLabel: 'No disponible', activationFeeAmount: null },
    features: { simultaneousStreams: '2', maxResolution: '1080p', downloads: false, ads: true, liveContent: false, sports: false, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'Familia y grandes franquicias', highlight: 'Disney, Pixar, Marvel, Star Wars y contenido familiar.',
    recommendation: { intents: ['family', 'movies'] }, destinationUrl: 'https://www.disneyplus.com/es-es', allowedHosts: ['disneyplus.com'], affiliateEnvKey: 'AFFILIATE_DISNEY_PLUS_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-08-26', sourceUrl: 'https://www.disneyplus.com/es-es',
  }),
  offer({
    id: 'max-basic-with-ads', provider: { id: 'max', name: 'Max' }, plan: { id: 'basic-with-ads', name: 'Básico con anuncios' },
    pricing: { currency: 'EUR', monthlyAmount: null, annualAmount: null, monthlyLabel: 'Consulta proveedor', annualLabel: 'Consulta proveedor', activationFeeAmount: null },
    features: { simultaneousStreams: '2', maxResolution: '1080p', downloads: false, ads: true, liveContent: true, sports: true, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'HBO, Warner y series premium', highlight: 'Prestige TV, cine de estudio y deporte en planes compatibles.',
    recommendation: { intents: ['movies', 'premium'] }, destinationUrl: 'https://www.max.com/es/es', allowedHosts: ['max.com'], affiliateEnvKey: 'AFFILIATE_MAX_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-03-01', sourceUrl: 'https://help.max.com/es-es/answer/detail/000002543', verificationStatus: 'needs_review',
  }),
  offer({
    id: 'movistar-plus-streaming', provider: { id: 'movistar-plus', name: 'Movistar Plus+' }, plan: { id: 'streaming', name: 'Movistar Plus+' },
    pricing: { currency: 'EUR', monthlyAmount: 9.99, annualAmount: 99.90, monthlyLabel: '9,99 €/mes', annualLabel: '99,90 €/año', activationFeeAmount: null },
    features: { simultaneousStreams: '2', maxResolution: 'HD-4K según contenido', downloads: true, ads: false, liveContent: true, sports: true, football: true, movies: true, series: true, family: true, fourK: true },
    trialDays: null, bestFor: 'Directo, cine y deporte', highlight: 'Combina canales en directo, deporte y catálogo bajo demanda.',
    recommendation: { intents: ['football', 'movies', 'premium'] }, destinationUrl: 'https://www.movistarplus.es/', allowedHosts: ['movistarplus.es'], affiliateEnvKey: 'AFFILIATE_MOVISTAR_PLUS_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-08-26', sourceUrl: 'https://www.movistarplus.es/estaticos/legal/CONDICIONES%20GENERALES%20TEXTOS%20LEGALES%20M%2B%20desdoblamiento%2020260504.pdf',
  }),
  offer({
    id: 'skyshowtime-with-ads', provider: { id: 'skyshowtime', name: 'SkyShowtime' }, plan: { id: 'with-ads', name: 'Con anuncios' },
    pricing: { currency: 'EUR', monthlyAmount: 5.99, annualAmount: null, monthlyLabel: '5,99 €/mes', annualLabel: 'No disponible', activationFeeAmount: null },
    features: { simultaneousStreams: '1', maxResolution: '1080p', downloads: false, ads: true, liveContent: false, sports: false, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'Sagas y catálogo de estudio', highlight: 'Paramount, Universal, DreamWorks y SHOWTIME en una suscripción contenida.',
    recommendation: { intents: ['cheapest', 'movies'] }, destinationUrl: 'https://www.skyshowtime.com/es', allowedHosts: ['skyshowtime.com'], affiliateEnvKey: 'AFFILIATE_SKYSHOWTIME_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-08-26', sourceUrl: 'https://www.skyshowtime.com/es',
  }),
  offer({
    id: 'apple-tv-plus-monthly', provider: { id: 'apple-tv-plus', name: 'Apple TV+' }, plan: { id: 'monthly', name: 'Mensual' },
    pricing: { currency: 'EUR', monthlyAmount: 9.99, annualAmount: null, monthlyLabel: '9,99 €/mes', annualLabel: 'No disponible', activationFeeAmount: null },
    features: { simultaneousStreams: '6', maxResolution: '4K HDR', downloads: true, ads: false, liveContent: true, sports: true, football: false, movies: true, series: true, family: true, fourK: true },
    trialDays: 7, bestFor: 'Originales premium', highlight: 'Catálogo más pequeño con una alta concentración de producciones originales.',
    recommendation: { intents: ['premium', 'family'] }, destinationUrl: 'https://tv.apple.com/es', allowedHosts: ['apple.com'], affiliateEnvKey: 'AFFILIATE_APPLE_TV_PLUS_URL', defaultRelationship: 'no_affiliate_available', verifiedAt: '2026-08-26', sourceUrl: 'https://tv.apple.com/es',
  }),
  offer({
    id: 'filmin-monthly', provider: { id: 'filmin', name: 'Filmin' }, plan: { id: 'monthly', name: 'Mensual' },
    pricing: { currency: 'EUR', monthlyAmount: 9.99, annualAmount: 99, monthlyLabel: '9,99 €/mes', annualLabel: '99 €/año', activationFeeAmount: null },
    features: { simultaneousStreams: '2', maxResolution: 'HD-4K según título', downloads: true, ads: false, liveContent: false, sports: false, football: false, movies: true, series: true, family: false, fourK: true },
    trialDays: null, bestFor: 'Cine de autor y festivales', highlight: 'Curaduría fuerte, cine europeo y fondo de catálogo especializado.',
    recommendation: { intents: ['movies', 'premium'] }, destinationUrl: 'https://www.filmin.es/suscripcion', allowedHosts: ['filmin.es'], affiliateEnvKey: 'AFFILIATE_FILMIN_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-08-26', sourceUrl: 'https://ayuda.filmin.es/es/support/solutions/articles/47001262197-suscripciones-y-precios',
  }),
  offer({
    id: 'atresplayer-premium', provider: { id: 'atresplayer', name: 'ATRESplayer' }, plan: { id: 'premium', name: 'Premium' },
    pricing: { currency: 'EUR', monthlyAmount: null, annualAmount: null, monthlyLabel: 'Consulta proveedor', annualLabel: 'Consulta proveedor', activationFeeAmount: null },
    features: { simultaneousStreams: 'Según plan', maxResolution: '1080p', downloads: true, ads: null, liveContent: true, sports: false, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'Ficción y televisión española', highlight: 'Directos, programas y ficción de Atresmedia.',
    recommendation: { intents: ['family'] }, destinationUrl: 'https://www.atresplayer.com/', allowedHosts: ['atresplayer.com'], affiliateEnvKey: 'AFFILIATE_ATRESPLAYER_URL', defaultRelationship: 'manual_agreement_required', verifiedAt: '2026-03-01', sourceUrl: 'https://www.atresplayer.com/', verificationStatus: 'needs_review',
  }),
  offer({
    id: 'rtve-play-free', provider: { id: 'rtve-play', name: 'RTVE Play' }, plan: { id: 'free', name: 'Gratuito' },
    pricing: { currency: 'EUR', monthlyAmount: 0, annualAmount: 0, monthlyLabel: 'Gratis', annualLabel: 'Gratis', activationFeeAmount: null },
    features: { simultaneousStreams: 'Según emisión', maxResolution: '1080p', downloads: false, ads: false, liveContent: true, sports: true, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'Servicio público y directos', highlight: 'Archivo, canales y eventos de RTVE sin cuota.',
    recommendation: { intents: ['cheapest', 'family', 'no-contract'] }, destinationUrl: 'https://www.rtve.es/play/', allowedHosts: ['rtve.es'], affiliateEnvKey: 'AFFILIATE_RTVE_PLAY_URL', defaultRelationship: 'no_affiliate_available', verifiedAt: '2026-08-26', sourceUrl: 'https://www.rtve.es/rtve/20260209/preguntas-frecuentes-sobre-rtve-play/16930366.shtml',
  }),
  offer({
    id: 'pluto-tv-free', provider: { id: 'pluto-tv', name: 'Pluto TV' }, plan: { id: 'free', name: 'Gratuito con anuncios' },
    pricing: { currency: 'EUR', monthlyAmount: 0, annualAmount: 0, monthlyLabel: 'Gratis', annualLabel: 'Gratis', activationFeeAmount: null },
    features: { simultaneousStreams: '1', maxResolution: '1080p', downloads: false, ads: true, liveContent: true, sports: true, football: false, movies: true, series: true, family: true, fourK: false },
    trialDays: null, bestFor: 'Canales FAST sin registro', highlight: 'Televisión en directo y catálogo gratuito financiado con publicidad.',
    recommendation: { intents: ['cheapest', 'no-contract'] }, destinationUrl: 'https://pluto.tv/es/', allowedHosts: ['pluto.tv'], affiliateEnvKey: 'AFFILIATE_PLUTO_TV_URL', defaultRelationship: 'no_affiliate_available', verifiedAt: '2026-08-26', sourceUrl: 'https://pluto.tv/es/',
  }),
];

export const MONETIZATION_INTENTS: OfferIntent[] = ['cheapest', 'football', 'movies', 'family', 'no-contract', 'premium'];

