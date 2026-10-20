/**
 * Football SEO helpers — schema.org structured data.
 *
 * SportsEvent / BroadcastEvent for matches, SportsTeam for teams; each top-level block carries its own `@context`.
 * BreadcrumbList comes from the visible breadcrumb (BreadcrumbComponent), never from here: two per page disagreed.
 * Football articles are guides: their Article markup lives on /guias/:slug.
 */

import { FootballMatchDTO } from './football.models';

const SCHEMA_CONTEXT = 'https://schema.org';

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

  if (!broadcast) return { '@context': SCHEMA_CONTEXT, ...event };

  return stripUndefined({
    '@context': SCHEMA_CONTEXT,
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
    '@context': SCHEMA_CONTEXT,
    '@type': 'SportsTeam',
    name: team.name,
    logo: team.crest || undefined,
    sport: 'Fútbol',
    url: `${baseUrl}/deportes/futbol/equipos/${team.slug}`,
  });
}
