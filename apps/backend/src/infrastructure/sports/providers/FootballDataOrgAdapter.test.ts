import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dedupeTeamsFromMatches,
  extractSlugDate,
  filterMatchesByIsoDay,
  findTeamBySlugInMatches,
  mapFootballDataOrgCompetition,
  mapFootballDataOrgMatch,
  mapFootballDataOrgStandingRow,
  mapFootballDataOrgTeam,
  parseFootballDataOrgThrottleHeaders,
} from './FootballDataOrgAdapter';
import { buildMatchSlug } from '../../../application/sports/services/FootballNormalizer';

const rawHomeTeam = { id: 81, name: 'FC Barcelona', shortName: 'Barça', tla: 'FCB', crest: 'https://x/barca.png', area: { name: 'Spain' } };
const rawAwayTeam = { id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', tla: 'RMA', area: { name: 'Spain' } };
const rawCompetition = { id: 2014, name: 'Primera Division', code: 'PD', emblem: 'https://x/laliga.png', area: { name: 'Spain' } };

function rawMatch(overrides: Record<string, any> = {}) {
  return {
    id: 12345,
    utcDate: '2026-08-21T19:00:00Z',
    status: 'FINISHED',
    matchday: 3,
    homeTeam: rawHomeTeam,
    awayTeam: rawAwayTeam,
    competition: rawCompetition,
    score: { winner: 'HOME_TEAM', duration: 'REGULAR', fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 } },
    ...overrides,
  };
}

test('mapFootballDataOrgMatch reads the real v4 score shape (fullTime.home/away)', () => {
  const match = mapFootballDataOrgMatch(rawMatch());
  assert.ok(match);
  // Regression: an earlier version read fullTime.homeTeam/awayTeam (the
  // deprecated v2 field names), which silently nulled every finished score.
  assert.deepEqual(match!.score, { home: 2, away: 1 });
});

test('mapFootballDataOrgMatch never fabricates a score when fullTime is absent', () => {
  const match = mapFootballDataOrgMatch(rawMatch({ score: { fullTime: {} } }));
  assert.deepEqual(match!.score, { home: null, away: null });
});

test('mapFootballDataOrgMatch maps a live match with a real minute', () => {
  const match = mapFootballDataOrgMatch(
    rawMatch({ status: 'IN_PLAY', minute: 63, score: { fullTime: { home: 1, away: 1 } } })
  );
  assert.equal(match!.status, 'live');
  assert.equal(match!.minute, 63);
  assert.deepEqual(match!.score, { home: 1, away: 1 });
});

test('mapFootballDataOrgMatch returns null when a team is missing rather than guessing', () => {
  const match = mapFootballDataOrgMatch(rawMatch({ awayTeam: undefined }));
  assert.equal(match, null);
});

test('mapFootballDataOrgMatch returns null for a payload with no id', () => {
  assert.equal(mapFootballDataOrgMatch({}), null);
});

test('mapFootballDataOrgTeam builds aliases from name/shortName/tla', () => {
  const team = mapFootballDataOrgTeam(rawHomeTeam);
  assert.equal(team.name, 'FC Barcelona');
  assert.equal(team.country, 'Spain');
  assert.deepEqual(team.aliases, ['FC Barcelona', 'Barça', 'FCB']);
});

test('mapFootballDataOrgCompetition classifies known cup/international codes', () => {
  assert.equal(mapFootballDataOrgCompetition({ ...rawCompetition, code: 'CL' }).type, 'international');
  assert.equal(mapFootballDataOrgCompetition({ ...rawCompetition, code: 'CDR' }).type, 'cup');
  assert.equal(mapFootballDataOrgCompetition(rawCompetition).type, 'league');
});

test('mapFootballDataOrgStandingRow maps a full table row', () => {
  const row = mapFootballDataOrgStandingRow({
    position: 1,
    team: rawHomeTeam,
    playedGames: 10,
    won: 8,
    draw: 1,
    lost: 1,
    goalsFor: 22,
    goalsAgainst: 7,
    goalDifference: 15,
    points: 25,
    form: 'W,W,D,W,L',
  });
  assert.equal(row.position, 1);
  assert.equal(row.points, 25);
  assert.equal(row.team.name, 'FC Barcelona');
});

// Regression: the site links to every match by our own generated slug
// (buildMatchSlug), never by football-data.org's numeric id — getMatch()
// must recognize a slug and resolve it via a dated getMatches() lookup
// rather than 404ing against the provider's id-only endpoint.
test('extractSlugDate pulls the trailing YYYY-MM-DD from a real generated slug', () => {
  const slug = buildMatchSlug('FC Barcelona', 'Real Madrid CF', '2026-08-21T19:00:00Z');
  assert.equal(extractSlugDate(slug), '2026-08-21');
});

test('extractSlugDate returns null for a bare numeric provider id', () => {
  assert.equal(extractSlugDate('564470'), null);
});

test('extractSlugDate returns null for a malformed slug with no date suffix', () => {
  assert.equal(extractSlugDate('fc-barcelona-real-madrid'), null);
});

test('mapFootballDataOrgMatch produces a slug extractSlugDate can round-trip', () => {
  const match = mapFootballDataOrgMatch(rawMatch({ utcDate: '2026-09-05T20:00:00Z' }));
  assert.equal(extractSlugDate(match!.slug), '2026-09-05');
});

test('filterMatchesByIsoDay provides an exact fallback when upstream day filters return empty', () => {
  const target = mapFootballDataOrgMatch(rawMatch({ id: 1, utcDate: '2026-09-05T20:00:00Z' }))!;
  const other = mapFootballDataOrgMatch(rawMatch({ id: 2, utcDate: '2026-09-06T18:00:00Z' }))!;
  assert.deepEqual(filterMatchesByIsoDay([target, other], '20260905').map((match) => match.id), ['1']);
});

// Regression: getTeam() had the same id/slug bug as getMatch()/getStandings()
// — `/teams/{slug}` 404s because the endpoint wants the provider's numeric
// id. findTeamBySlugInMatches is the fix's resolution logic, extracted for
// direct testability (getTeam() itself needs a live HTTP call).
test('findTeamBySlugInMatches finds a team as the home side', () => {
  const match = mapFootballDataOrgMatch(rawMatch())!;
  const team = findTeamBySlugInMatches([match], match.homeTeam.slug);
  assert.equal(team?.name, 'FC Barcelona');
});

test('findTeamBySlugInMatches finds a team as the away side', () => {
  const match = mapFootballDataOrgMatch(rawMatch())!;
  const team = findTeamBySlugInMatches([match], match.awayTeam.slug);
  assert.equal(team?.name, 'Real Madrid CF');
});

test('findTeamBySlugInMatches returns null when the slug appears in no match', () => {
  const match = mapFootballDataOrgMatch(rawMatch())!;
  assert.equal(findTeamBySlugInMatches([match], 'nonexistent-team'), null);
});

test('findTeamBySlugInMatches returns null for an empty match list', () => {
  assert.equal(findTeamBySlugInMatches([], 'any-slug'), null);
});

// Regression: getTeams() had the same unreliable-unscoped-endpoint problem
// as getTeam()/getStandings() — searching "Real" found matches for Real
// Betis/Real Sociedad via getMatches(), but the unscoped /teams listing
// returned zero teams for the same window. dedupeTeamsFromMatches is the fix.
test('dedupeTeamsFromMatches returns both sides of a single match', () => {
  const match = mapFootballDataOrgMatch(rawMatch())!;
  const teams = dedupeTeamsFromMatches([match]);
  assert.equal(teams.length, 2);
  assert.ok(teams.some((t) => t.name === 'FC Barcelona'));
  assert.ok(teams.some((t) => t.name === 'Real Madrid CF'));
});

test('dedupeTeamsFromMatches deduplicates a team appearing across multiple matches', () => {
  const match1 = mapFootballDataOrgMatch(rawMatch({ id: 1 }))!;
  const match2 = mapFootballDataOrgMatch(rawMatch({ id: 2, homeTeam: rawHomeTeam, awayTeam: { ...rawAwayTeam, id: 999, name: 'Sevilla FC' } }))!;
  const teams = dedupeTeamsFromMatches([match1, match2]);
  // FC Barcelona appears in both matches as the home team — should only
  // appear once in the deduplicated pool.
  assert.equal(teams.filter((t) => t.name === 'FC Barcelona').length, 1);
  assert.equal(teams.length, 3);
});

test('dedupeTeamsFromMatches returns an empty array for no matches', () => {
  assert.deepEqual(dedupeTeamsFromMatches([]), []);
});

test('response headers block new requests until the provider counter resets', () => {
  const now = 1_000_000;
  const state = parseFootballDataOrgThrottleHeaders({
    'x-requests-available-minute': '0',
    'x-requestcounter-reset': '23',
  }, now, 200);
  assert.deepEqual(state, { remaining: 0, blockedUntil: now + 23_000 });
});

test('a 429 honors Retry-After even when remaining headers are absent', () => {
  const now = 2_000_000;
  const state = parseFootballDataOrgThrottleHeaders({ 'retry-after': '17' }, now, 429);
  assert.deepEqual(state, { remaining: null, blockedUntil: now + 17_000 });
});

test('available quota leaves the local request gate open', () => {
  const state = parseFootballDataOrgThrottleHeaders({
    'x-requests-available-minute': '8',
    'x-requestcounter-reset': '41',
  }, 3_000_000, 200);
  assert.deepEqual(state, { remaining: 8, blockedUntil: 0 });
});
