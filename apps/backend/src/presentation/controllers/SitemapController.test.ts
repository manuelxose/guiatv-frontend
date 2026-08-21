import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invalidateSitemapCache, SitemapController } from './SitemapController';

// Regression coverage for a real gap: competition/match/team detail pages
// were entirely absent from every sitemap — only the 5 static football hub
// routes were ever listed. This is the fix (sitemap-football.xml).

function fakeFootballQueryService(overrides: Partial<Record<'getCompetitions' | 'getMatches', () => Promise<any>>> = {}) {
  return {
    getCompetitions: overrides.getCompetitions ?? (async () => ({ competitions: [], meta: {} })),
    getMatches: overrides.getMatches ?? (async () => ({ matches: [], meta: {} })),
  } as any;
}

function fakeReqRes() {
  let sentXml = '';
  let statusCode = 0;
  const res: any = {
    set: () => res,
    status(code: number) {
      statusCode = code;
      return res;
    },
    send(body: string) {
      sentXml = body;
    },
  };
  return {
    req: {} as any,
    res,
    getSentXml: () => sentXml,
    getStatusCode: () => statusCode,
  };
}

test('sitemap-football.xml includes competition, match, and team URLs', async () => {
  invalidateSitemapCache(); // module-level cache — same as every other sub-sitemap in this controller
  const footballQueryService = fakeFootballQueryService({
    getCompetitions: async () => ({
      competitions: [{ slug: 'laliga', name: 'LaLiga' }],
      meta: {},
    }),
    getMatches: async () => ({
      matches: [
        {
          slug: 'real-madrid-barcelona-2026-08-21',
          status: 'scheduled',
          kickoffAt: '2026-08-21T19:00:00.000Z',
          lastUpdatedAt: '2026-08-21T10:00:00.000Z',
          homeTeam: { slug: 'real-madrid', name: 'Real Madrid' },
          awayTeam: { slug: 'barcelona', name: 'Barcelona' },
        },
      ],
      meta: {},
    }),
  });

  const controller = new SitemapController({} as any, {} as any, undefined, footballQueryService);
  const { req, res, getSentXml, getStatusCode } = fakeReqRes();
  await controller.getFootballSitemap(req, res, (() => {}) as any);

  const xml = getSentXml();
  assert.equal(getStatusCode(), 200);
  assert.match(xml, /\/deportes\/futbol\/competiciones\/laliga/);
  assert.match(xml, /\/deportes\/futbol\/partido\/real-madrid-barcelona-2026-08-21/);
  assert.match(xml, /\/deportes\/futbol\/equipos\/real-madrid/);
  assert.match(xml, /\/deportes\/futbol\/equipos\/barcelona/);
});

test('sitemap-football.xml dedupes a team appearing in multiple matches', async () => {
  invalidateSitemapCache();
  const footballQueryService = fakeFootballQueryService({
    getMatches: async () => ({
      matches: [
        {
          slug: 'match-1',
          status: 'finished',
          kickoffAt: '2026-08-20T19:00:00.000Z',
          lastUpdatedAt: '2026-08-20T21:00:00.000Z',
          homeTeam: { slug: 'real-madrid', name: 'Real Madrid' },
          awayTeam: { slug: 'sevilla', name: 'Sevilla' },
        },
        {
          slug: 'match-2',
          status: 'scheduled',
          kickoffAt: '2026-08-27T19:00:00.000Z',
          lastUpdatedAt: '2026-08-21T10:00:00.000Z',
          homeTeam: { slug: 'real-madrid', name: 'Real Madrid' },
          awayTeam: { slug: 'valencia', name: 'Valencia' },
        },
      ],
      meta: {},
    }),
  });

  const controller = new SitemapController({} as any, {} as any, undefined, footballQueryService);
  const { req, res, getSentXml } = fakeReqRes();
  await controller.getFootballSitemap(req, res, (() => {}) as any);

  const xml = getSentXml();
  const occurrences = xml.match(/\/deportes\/futbol\/equipos\/real-madrid</g) || [];
  assert.equal(occurrences.length, 1, 'real-madrid should only appear once despite being in two matches');
});

test('sitemap-football.xml degrades gracefully when the football query service is absent', async () => {
  invalidateSitemapCache();
  const controller = new SitemapController({} as any, {} as any, undefined, undefined);
  const { req, res, getSentXml, getStatusCode } = fakeReqRes();
  await controller.getFootballSitemap(req, res, (() => {}) as any);

  assert.equal(getStatusCode(), 200);
  assert.match(getSentXml(), /<urlset/);
  assert.doesNotMatch(getSentXml(), /deportes\/futbol/);
});

test('sitemap-football.xml still includes matches when the competitions call fails', async () => {
  invalidateSitemapCache();
  const footballQueryService = fakeFootballQueryService({
    getCompetitions: async () => {
      throw new Error('provider down');
    },
    getMatches: async () => ({
      matches: [
        {
          slug: 'match-1',
          status: 'scheduled',
          kickoffAt: '2026-08-21T19:00:00.000Z',
          lastUpdatedAt: '2026-08-21T10:00:00.000Z',
          homeTeam: { slug: 'real-madrid', name: 'Real Madrid' },
          awayTeam: { slug: 'sevilla', name: 'Sevilla' },
        },
      ],
      meta: {},
    }),
  });

  const controller = new SitemapController({} as any, {} as any, undefined, footballQueryService);
  const { req, res, getSentXml, getStatusCode } = fakeReqRes();
  await controller.getFootballSitemap(req, res, (() => {}) as any);

  assert.equal(getStatusCode(), 200);
  assert.match(getSentXml(), /\/deportes\/futbol\/partido\/match-1/);
});
