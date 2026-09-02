/**
 * Football SEO helpers — schema.org structured data.
 *
 * Uses SportsEvent + BroadcastEvent + SportsTeam + NewsArticle + BreadcrumbList
 * only where semantically appropriate.
 */

import { FootballMatchDTO, FootballNewsDTO } from './football.models';

function stripUndefined(value: Record<string, any>): Record<string, any> {
  Object.keys(value).forEach((key) => {
    if (value[key] === undefined || value[key] === null || value[key] === '') {
      delete value[key];
    }
  });
  return value;
}

function schemaEventStatus(status: FootballMatchDTO['status']): string {
  if (status === 'live' || status === 'halftime') return 'https://schema.org/EventInProgress';
  if (status === 'finished') return 'https://schema.org/EventCompleted';
  if (status === 'cancelled') return 'https://schema.org/EventCancelled';
  if (status === 'postponed' || status === 'suspended') return 'https://schema.org/EventPostponed';
  return 'https://schema.org/EventScheduled';
}

export function generateFootballMatchSchema(match: FootballMatchDTO, baseUrl: string): object {
  const broadcast = match.broadcasts?.find((b) => b.confidence !== 'low');
  const event = stripUndefined({
    '@type': 'SportsEvent',
    name: `${match.homeTeam.name} - ${match.awayTeam.name}`,
    description: `Partido de ${match.competition.name}: ${match.homeTeam.name} contra ${match.awayTeam.name}.`,
    startDate: match.kickoffAt,
    eventStatus: schemaEventStatus(match.status),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: 'Fútbol',
    competitor: [
      { '@type': 'SportsTeam', name: match.homeTeam.name },
      { '@type': 'SportsTeam', name: match.awayTeam.name },
    ],
    organizer: { '@type': 'SportsOrganization', name: match.competition.name },
    url: `${baseUrl}/deportes/futbol/partido/${match.slug}`,
  });

  if (!broadcast) return stripUndefined(event);

  return stripUndefined({
    '@type': 'BroadcastEvent',
    name: `${match.homeTeam.name} - ${match.awayTeam.name}`,
    startDate: match.kickoffAt,
    eventStatus: schemaEventStatus(match.status),
    isLiveBroadcast: match.status === 'live' || match.status === 'halftime',
    broadcastOfEvent: event,
    publishedOn: { '@type': 'BroadcastService', name: broadcast.channelName },
    url: `${baseUrl}/deportes/futbol/partido/${match.slug}`,
  });
}

export function generateFootballTeamSchema(
  team: { name: string; slug: string; crest?: string | null },
  baseUrl: string
): object {
  return stripUndefined({
    '@type': 'SportsTeam',
    name: team.name,
    logo: team.crest || undefined,
    sport: 'Fútbol',
    url: `${baseUrl}/deportes/futbol/equipos/${team.slug}`,
  });
}

export function generateFootballNewsSchema(article: FootballNewsDTO, baseUrl: string): object {
  return stripUndefined({
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage || undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: article.author?.name ? { '@type': 'Person', name: article.author.name } : undefined,
    url: `${baseUrl}/deportes/futbol/noticias/${article.slug}`,
  });
}

export function generateFootballBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
  baseUrl: string
): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}
