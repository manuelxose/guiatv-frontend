/**
 * Europe/Madrid time helpers.
 *
 * SSR runs in a container that may not be on Europe/Madrid local time (often
 * UTC), and the browser rendering the same page may be on yet another zone.
 * Anything that positions EPG content on a time axis (grid columns, the
 * current-time indicator) must resolve "what time is it in Madrid" from the
 * IANA time zone explicitly rather than `Date.getHours()`/`getMinutes()`
 * (which read the *runtime's* local zone), so the server-rendered HTML and
 * the hydrated client agree with real Spanish broadcast times.
 */

const MADRID_TIME_ZONE = 'Europe/Madrid';

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
    second: Number(parts['second']),
  };
}

function zonedOffsetMinutes(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (asUtc - date.getTime()) / 60000;
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = zonedOffsetMinutes(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset * 60000);
}

/** Minutes elapsed since local midnight in Europe/Madrid, for the given instant. */
export function madridMinutesSinceMidnight(date: Date): number {
  const parts = getZonedParts(date, MADRID_TIME_ZONE);
  return parts.hour * 60 + parts.minute + parts.second / 60;
}

/**
 * The instant corresponding to `startHour`:00 Europe/Madrid on the current
 * "broadcast day" for the given instant. If the instant is before that hour
 * in Madrid local time, the broadcast day is still "yesterday's" (matches
 * the Spanish TV EPG convention where the small hours belong to the
 * previous day's schedule, e.g. `partOfDay: 'madrugada'`).
 */
export function madridBroadcastDayAnchor(date: Date, startHour = 6): Date {
  const parts = getZonedParts(date, MADRID_TIME_ZONE);
  const dayShift = parts.hour < startHour ? -1 : 0;
  // Use noon as an intermediate instant so a DST transition landing exactly
  // at the target day boundary can't push the read-back Y/M/D to the wrong
  // calendar day.
  const noonOnTargetDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayShift, 12, 0, 0));
  const targetDayParts = getZonedParts(noonOnTargetDay, MADRID_TIME_ZONE);
  return zonedTimeToUtc(
    targetDayParts.year,
    targetDayParts.month,
    targetDayParts.day,
    startHour,
    0,
    MADRID_TIME_ZONE
  );
}

/** Minutes elapsed between two instants (`to` minus `from`), signed. */
export function minutesBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 60000;
}

/** Formats an instant as `HH:mm` in Europe/Madrid local time. */
export function formatMadridHM(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
