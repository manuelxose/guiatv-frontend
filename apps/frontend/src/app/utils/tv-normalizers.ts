import { CatalogItem } from '../services/catalog.service';
import { TvReadItemDTO } from '../api/models';
import { buildDetailPath, CatalogContentType } from './catalog';
import { slugify } from './utils';

export interface UnifiedCardData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  channelName: string;
  channelIcon: string;
  startTime: string;
  endTime: string;
  liveNow: boolean;
  category: string;
  platforms: string[];
  sport: string;
  detailPath: string;
  badges: string[];
  progressPercent: number;
  contentType: CatalogContentType;
}

export function isTvReadItem(item: TvReadItemDTO | CatalogItem | null | undefined): item is TvReadItemDTO {
  return Boolean(item && 'airing' in item && 'program' in item && 'channel' in item);
}

export function normalizeToCard(item: TvReadItemDTO | CatalogItem): UnifiedCardData {
  if (isTvReadItem(item)) {
    const category = normalizeCategory(item.program.editorialCategory || item.program.genre);
    const contentType = resolveTvContentType(category);
    return {
      id: item.id,
      title: String(item.program.title || 'Sin título').trim(),
      subtitle: buildTvSubtitle(item),
      description: String(item.program.description || '').trim(),
      image: resolveTvImage(item),
      channelName: String(item.channel.name || '').trim(),
      channelIcon: String(item.assets.channelLogo?.url || item.channel.icon || '').trim(),
      startTime: item.airing.start,
      endTime: item.airing.end,
      liveNow: Boolean(item.airing.liveNow || item.timingContext?.liveNow),
      category,
      platforms: item.availability.streaming ? ['Streaming'] : [],
      sport: String(item.program.sportFacet || '').trim(),
      detailPath: buildDetailPath(contentType, item.program.title, slugify),
      badges: buildTvBadges(item, category),
      progressPercent: computeProgress(item.airing.start, item.airing.end),
      contentType,
    };
  }

  const contentType = item.contentType || 'program';
  return {
    id: String(item.catalogId || item.title || 'content').trim(),
    title: String(item.title || 'Sin título').trim(),
    subtitle: buildCatalogSubtitle(item),
    description: String(item.synopsis || '').trim(),
    image: String(item.backdrop || item.image || '').trim(),
    channelName: String(item.channel?.name || '').trim(),
    channelIcon: String(item.channel?.icon || '').trim(),
    startTime: String(item.start || '').trim(),
    endTime: String(item.end || '').trim(),
    liveNow: Boolean(item.liveNow),
    category: normalizeCategory(item.genres?.[0] || item.contentType || ''),
    platforms: item.primaryPlatforms || [],
    sport: '',
    detailPath: item.detailPath || buildDetailPath(contentType, item.title, slugify),
    badges: buildCatalogBadges(item),
    progressPercent: computeProgress(item.start, item.end),
    contentType,
  };
}

export function normalizeCategory(value: unknown): string {
  const safe = String(value || '').trim();
  if (!safe) {
    return 'Contenido';
  }
  if (/cine|pel[ií]cula/i.test(safe)) return 'Cine';
  if (/serie/i.test(safe)) return 'Series';
  if (/deporte|f[úu]tbol|baloncesto|tenis|motogp|f1/i.test(safe)) return 'Deportes';
  if (/infantil|kids/i.test(safe)) return 'Infantil';
  if (/noticia/i.test(safe)) return 'Noticias';
  return safe;
}

export function computeProgress(start?: string | null, end?: string | null, reference = new Date()): number {
  const startMs = start ? new Date(start).getTime() : Number.NaN;
  const endMs = end ? new Date(end).getTime() : Number.NaN;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }
  const ratio = ((reference.getTime() - startMs) / (endMs - startMs)) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
}

function resolveTvImage(item: TvReadItemDTO): string {
  return String(
    item.assets.poster?.url ||
      item.assets.backdrop?.url ||
      item.assets.primary?.url ||
      item.assets.channelLogo?.url ||
      item.channel.icon ||
      ''
  ).trim();
}

function resolveTvContentType(category: string): CatalogContentType {
  if (category === 'Cine') return 'movie';
  if (category === 'Series') return 'series';
  return 'program';
}

function buildTvSubtitle(item: TvReadItemDTO): string {
  const parts = [
    item.channel.name,
    item.program.sportFacet,
    formatTimeRange(item.airing.start, item.airing.end),
  ]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
  return parts.join(' · ');
}

function buildCatalogSubtitle(item: CatalogItem): string {
  const parts = [
    item.channel?.name,
    formatTimeRange(item.start, item.end),
    item.primaryPlatforms?.slice(0, 2).join(' · '),
    item.releaseYear,
  ]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
  return parts.join(' · ');
}

function buildTvBadges(item: TvReadItemDTO, category: string): string[] {
  const badges = new Set<string>();
  if (item.airing.liveNow) badges.add('LIVE');
  if (item.program.sportFacet) badges.add(item.program.sportFacet);
  if (category) badges.add(category);
  if (item.availability.streaming) badges.add('Streaming');
  return Array.from(badges);
}

function buildCatalogBadges(item: CatalogItem): string[] {
  const badges = new Set<string>();
  if (item.liveNow) badges.add('LIVE');
  if (item.primaryPlatforms?.[0]) badges.add(item.primaryPlatforms[0]);
  if (item.contentType === 'movie') badges.add('Película');
  if (item.contentType === 'series') badges.add('Serie');
  if (item.channel?.name) badges.add(item.channel.name);
  return Array.from(badges);
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (!startLabel && !endLabel) {
    return '';
  }
  if (!startLabel) {
    return endLabel;
  }
  if (!endLabel) {
    return startLabel;
  }
  return `${startLabel} - ${endLabel}`;
}

function formatTime(value?: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
