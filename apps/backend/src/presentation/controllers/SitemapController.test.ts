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

test('sitemap-football.xml quarantines provider-only detail URLs', async () => {
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
  assert.doesNotMatch(xml, /\/deportes\/futbol\/competiciones\/laliga/);
  assert.doesNotMatch(xml, /\/deportes\/futbol\/partido\/real-madrid-barcelona-2026-08-21/);
  assert.doesNotMatch(xml, /\/deportes\/futbol\/equipos\/real-madrid/);
});

test('sitemap-football.xml does not leak team URLs from repeated provider matches', async () => {
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
  assert.equal(occurrences.length, 0, 'provider-only team pages must remain quarantined');
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

test('sitemap-football.xml remains empty when the provider fails', async () => {
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
  assert.doesNotMatch(getSentXml(), /\/deportes\/futbol\/partido\/match-1/);
});

test('sitemap index excludes quarantined provider-only child sitemaps', async () => {
  invalidateSitemapCache();
  const controller = new SitemapController({} as any, {} as any, {} as any, fakeFootballQueryService());
  const { req, res, getSentXml } = fakeReqRes();

  await controller.getSitemapIndex(req, res, (() => {}) as any);

  assert.doesNotMatch(getSentXml(), /sitemap-streaming\.xml/);
  assert.doesNotMatch(getSentXml(), /sitemap-football\.xml/);
});

test('static sitemap excludes volatile trends until the page has an indexable quality signal', async () => {
  invalidateSitemapCache();
  const controller = new SitemapController({} as any, {} as any);
  const { req, res, getSentXml } = fakeReqRes();

  await controller.getStaticSitemap(req, res, (() => {}) as any);

  assert.doesNotMatch(getSentXml(), /<loc>[^<]*\/tendencias<\/loc>/);
});

test('sitemap-programs.xml only queries the same today/tomorrow window the slug resolver supports', async () => {
  invalidateSitemapCache();
  const requestedDates: string[] = [];
  const programRepository = {
    findByDate: async (date: string) => {
      requestedDates.push(date);
      return [{
        title: `Programa ${requestedDates.length}`,
        tmdbId: requestedDates.length,
        startTime: new Date(),
      }];
    },
  } as any;
  const controller = new SitemapController({} as any, programRepository);
  const { req, res, getSentXml } = fakeReqRes();

  await controller.getProgramsSitemap(req, res, (() => {}) as any);

  assert.equal(requestedDates.length, 2, 'yesterday must not be queried for sitemap-only URLs');
  assert.match(getSentXml(), /\/programas\/programa-1/);
  assert.match(getSentXml(), /\/programas\/programa-2/);
});

test('sitemap-programs.xml uses the public TV read model instead of repository-only rows', async () => {
  invalidateSitemapCache();
  const programRepository = {
    findByDate: async () => [{
      title: 'Raw programme that cannot resolve',
      tmdbId: 999,
      startTime: new Date('2026-08-31T20:00:00.000Z'),
    }],
  } as any;
  const tvReadQueryService = {
    getChannels: async () => ({ channels: [], meta: {} }),
    getIndexableProgramSitemapRows: async (dates: string[]) => {
      assert.equal(dates.length, 2);
      return [
        {
          title: 'Resolvable programme',
          start: '2026-08-31T21:00:00.000Z',
        },
        {
          title: 'El último pase',
          start: '2026-08-31T22:00:00.000Z',
        },
      ];
    },
  } as any;
  const controller = new SitemapController(
    {} as any,
    programRepository,
    undefined,
    undefined,
    tvReadQueryService
  );
  const { req, res, getSentXml } = fakeReqRes();

  await controller.getProgramsSitemap(req, res, (() => {}) as any);

  assert.match(getSentXml(), /\/programas\/resolvable-programme/);
  assert.match(getSentXml(), /\/programas\/el-ltimo-pase/);
  assert.doesNotMatch(getSentXml(), /\/programas\/el-ultimo-pase/);
  assert.doesNotMatch(getSentXml(), /raw-programme-that-cannot-resolve/);
});

test('sitemap-blog.xml excludes categories with fewer than three approved posts', async () => {
  invalidateSitemapCache();
  const originalFind = (await import('../../infrastructure/database/models/BlogPost.model')).BlogPostModel.find;
  const posts = [
    { slug: 'uno', categories: [{ slug: 'sparse' }, { slug: 'enough' }] },
    { slug: 'dos', categories: [{ slug: 'enough' }] },
    { slug: 'tres', categories: [{ slug: 'enough' }] },
  ];
  (await import('../../infrastructure/database/models/BlogPost.model')).BlogPostModel.find = (() => ({
    select: () => ({ lean: () => ({ exec: async () => posts }) }),
  })) as any;
  try {
    const controller = new SitemapController({} as any, {} as any);
    const { req, res, getSentXml } = fakeReqRes();
    await controller.getBlogSitemap(req, res, (() => {}) as any);
    assert.match(getSentXml(), /\/editorial\/categoria\/enough/);
    assert.doesNotMatch(getSentXml(), /\/editorial\/categoria\/sparse/);
  } finally {
    (await import('../../infrastructure/database/models/BlogPost.model')).BlogPostModel.find = originalFind;
  }
});

test('sitemap-channels.xml excludes channels without a resolvable schedule', async () => {
  invalidateSitemapCache();
  const tvReadQueryService = {
    getChannels: async () => ({
      channels: [{
        channel: {
          id: 'la-1',
          name: 'La 1',
          normalizedName: 'la_1',
          group: 'tdt',
        },
      }],
      meta: {},
    }),
  } as any;
  const controller = new SitemapController(
    {} as any,
    {} as any,
    undefined,
    undefined,
    tvReadQueryService
  );
  const { req, res, getSentXml } = fakeReqRes();

  await controller.getChannelsSitemap(req, res, (() => {}) as any);

  assert.match(getSentXml(), /\/canales\/la_1/);
  assert.doesNotMatch(getSentXml(), /\/canales\/canal_vacio/);
});
