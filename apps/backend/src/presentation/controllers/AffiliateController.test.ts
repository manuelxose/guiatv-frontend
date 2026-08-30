import test from 'node:test';
import assert from 'node:assert/strict';
import { AffiliateController } from './AffiliateController';

function responseDouble() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
    set(name: string, value: string) { this.headers[name] = value; return this; },
    redirect(code: number, location: string) {
      this.statusCode = code;
      this.headers.Location = location;
      return this;
    },
    end() { return this; },
  };
}

test('AffiliateController.resolve rejects a request with no context at the HTTP boundary', async () => {
  const controller = new AffiliateController({} as never, {} as never, {} as never, {} as never);
  await assert.rejects(controller.resolve({ body: {} } as never, responseDouble() as never), /invalid resolve request/i);
});

test('AffiliateController.resolve passes a well-formed request through to the resolver service', async () => {
  const calls: unknown[] = [];
  const resolverService = {
    resolveOffers: async (request: unknown) => {
      calls.push(request);
      return { items: [], meta: { market: 'ES', placement: 'streaming-comparison', total: 0, generatedAt: '2026-08-26T12:00:00.000Z' } };
    },
  };
  const controller = new AffiliateController(resolverService as never, {} as never, {} as never, {} as never);
  const response = responseDouble();

  await controller.resolve(
    { body: { context: { market: 'ES', placement: 'streaming-comparison' }, intent: 'cheapest', maxResults: 5 } } as never,
    response as never
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls[0], {
    context: { market: 'ES', placement: 'streaming-comparison' },
    intent: 'cheapest',
    providerKeys: undefined,
    maxResults: 5,
    category: undefined,
    pinnedOfferIds: undefined,
    autoResolve: undefined,
  });
});

test('AffiliateController.resolve forwards category, pinnedOfferIds and autoResolve to the resolver service', async () => {
  const calls: unknown[] = [];
  const resolverService = {
    resolveOffers: async (request: unknown) => {
      calls.push(request);
      return { items: [], meta: { market: 'ES', placement: 'blog-inline', total: 0, generatedAt: '2026-08-26T12:00:00.000Z' } };
    },
  };
  const controller = new AffiliateController(resolverService as never, {} as never, {} as never, {} as never);

  await controller.resolve(
    {
      body: {
        context: { market: 'ES', placement: 'blog-inline', blogPostId: 'post-1' },
        category: 'smart-tv',
        pinnedOfferIds: ['offer-1', ' ', 42],
        autoResolve: false,
      },
    } as never,
    responseDouble() as never
  );

  assert.deepEqual(calls[0], {
    context: { market: 'ES', placement: 'blog-inline', blogPostId: 'post-1' },
    intent: undefined,
    providerKeys: undefined,
    maxResults: undefined,
    category: 'smart-tv',
    pinnedOfferIds: ['offer-1'],
    autoResolve: false,
  });
});

test('AffiliateController.go redirects with no-store/no-referrer headers and never exposes the destination beyond the redirect', async () => {
  const resolverService = {
    resolveRedirect: async () => ({ destinationUrl: 'https://www.netflix.com/es/signup', clickId: 'click-1', relationship: 'direct_commercial_link' }),
  };
  const controller = new AffiliateController(resolverService as never, {} as never, {} as never, {} as never);
  const response = responseDouble();

  await controller.go(
    { params: { offerId: 'offer-1' }, query: { market: 'ES', placement: 'streaming-comparison' } } as never,
    response as never
  );

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, 'https://www.netflix.com/es/signup');
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(response.headers['Referrer-Policy'], 'no-referrer');
});

test('AffiliateController.go forwards blogPostId from the query string into the resolver context', async () => {
  const contexts: unknown[] = [];
  const resolverService = {
    resolveRedirect: async (_offerId: string, context: unknown) => {
      contexts.push(context);
      return { destinationUrl: 'https://example.com', clickId: 'click-1', relationship: 'direct_commercial_link' };
    },
  };
  const controller = new AffiliateController(resolverService as never, {} as never, {} as never, {} as never);

  await controller.go(
    { params: { offerId: 'offer-1' }, query: { market: 'ES', placement: 'blog-inline', blogPostId: 'post-1' } } as never,
    responseDouble() as never
  );

  assert.equal((contexts[0] as { blogPostId?: string }).blogPostId, 'post-1');
});

test('AffiliateController.impression rejects an empty batch and skips malformed entries without failing the whole call', async () => {
  const controller = new AffiliateController({} as never, {} as never, {} as never, {} as never);
  await assert.rejects(controller.impression({ body: { impressions: [] } } as never, responseDouble() as never), /invalid impression payload/i);

  const tracked: unknown[] = [];
  const offerRepository = { findById: async (id: string) => (id === 'offer-1' ? { id: 'offer-1', merchantId: 'm-1', affiliateProgramId: 'p-1' } : null) };
  const catalogService = { resolvePlacement: async (key: string) => (key === 'streaming-comparison' ? { key: 'streaming-comparison', enabled: true } : null) };
  const analytics = { trackImpression: async (payload: unknown) => { tracked.push(payload); } };
  const okController = new AffiliateController({} as never, catalogService as never, offerRepository as never, analytics as never);
  const response = responseDouble();

  await okController.impression(
    {
      body: {
        impressions: [
          { offerId: 'offer-1', placement: 'streaming-comparison', market: 'ES' },
          { offerId: 'unknown-offer', placement: 'streaming-comparison', market: 'ES' },
          { placement: 'streaming-comparison', market: 'ES' }, // missing offerId — skipped
        ],
      },
    } as never,
    response as never
  );

  assert.equal(response.statusCode, 204);
  assert.equal(tracked.length, 1);
});
