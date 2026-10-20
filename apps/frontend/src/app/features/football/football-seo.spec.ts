import { generateFootballMatchSchema, generateFootballTeamSchema } from './football-seo';
import { FootballMatchDTO } from './football.models';

describe('football structured data', () => {
  const base = 'https://guiaprogramaciontv.com';
  const match = {
    slug: 'a-b-2026-10-20',
    kickoffAt: '2026-10-19T23:00:00Z',
    status: 'scheduled',
    homeTeam: { name: 'A' },
    awayTeam: { name: 'B' },
    competition: { name: 'Liga' },
    broadcasts: [{ channelName: 'DAZN', confidence: 'high' }],
  } as unknown as FootballMatchDTO;

  // Phase 1 TS-09: the BroadcastEvent block shipped without @context, so Google could not read it.
  it('gives every top-level block a schema.org @context', () => {
    const broadcast = generateFootballMatchSchema(match, base) as Record<string, any>;
    expect(broadcast['@context']).toBe('https://schema.org');
    expect(broadcast['@type']).toBe('BroadcastEvent');
    expect(broadcast['broadcastOfEvent']['@type']).toBe('SportsEvent');

    const event = generateFootballMatchSchema({ ...match, broadcasts: [] }, base) as Record<string, any>;
    expect(event['@context']).toBe('https://schema.org');
    expect(event['@type']).toBe('SportsEvent');

    const team = generateFootballTeamSchema({ name: 'A', slug: 'a' }, base) as Record<string, any>;
    expect(team['@context']).toBe('https://schema.org');
  });
});
