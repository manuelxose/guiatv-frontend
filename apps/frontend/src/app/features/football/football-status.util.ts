/**
 * Shared match-status formatting — single source of truth so the label
 * mapping and live/score checks don't drift between the scoreboard, the
 * match card, and the match row (previously duplicated in two places).
 */

import { FootballMatchDTO } from './football.models';

export function isLiveStatus(status: FootballMatchDTO['status']): boolean {
  return status === 'live' || status === 'halftime';
}

export function hasFinalScore(score: FootballMatchDTO['score'] | undefined): boolean {
  return score?.home != null && score?.away != null;
}

/**
 * `style: 'short'` → row/card context ("67'", "Final"); `'long'` → scoreboard
 * context ("Minuto 67", "Finalizado").
 */
export function formatMatchStatusLabel(
  match: Pick<FootballMatchDTO, 'status' | 'minute' | 'kickoffAt'>,
  style: 'short' | 'long' = 'short'
): string {
  const long = style === 'long';
  switch (match.status) {
    case 'live':
      if (match.minute != null) return long ? `Minuto ${match.minute}` : `${match.minute}'`;
      return 'En directo';
    case 'halftime':
      return 'Descanso';
    case 'finished':
      return long ? 'Finalizado' : 'Final';
    case 'postponed':
      return 'Aplazado';
    case 'suspended':
      return 'Suspendido';
    case 'cancelled':
      return 'Cancelado';
    default:
      return long ? 'Programado' : formatKickoffTime(match.kickoffAt);
  }
}

export function formatKickoffTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Coherent accessible sentence for a match — never let the visual score
 * table be the only representation (spec: scores must not depend on color).
 */
export function formatMatchAccessibleLabel(
  match: Pick<FootballMatchDTO, 'homeTeam' | 'awayTeam' | 'status' | 'minute' | 'score' | 'kickoffAt'>,
  extra?: string
): string {
  const teams = `${match.homeTeam.name} contra ${match.awayTeam.name}`;
  const score = hasFinalScore(match.score) ? `, ${match.score.home} a ${match.score.away}` : '';
  const status = isLiveStatus(match.status)
    ? match.minute != null
      ? `, minuto ${match.minute}`
      : ', en directo'
    : match.status === 'finished'
      ? ', finalizado'
      : match.status === 'scheduled'
        ? `, ${formatKickoffTime(match.kickoffAt)}`
        : `, ${formatMatchStatusLabel(match, 'long').toLowerCase()}`;
  return `${teams}${score}${status}${extra ? `, ${extra}` : ''}`;
}

/** Best broadcast to surface compactly — filters out low-confidence guesses. */
export function primaryBroadcast(match: Pick<FootballMatchDTO, 'broadcasts'>) {
  return match.broadcasts?.find((broadcast) => broadcast.confidence !== 'low') ?? null;
}
