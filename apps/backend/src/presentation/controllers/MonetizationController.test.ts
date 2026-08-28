import test from 'node:test';
import assert from 'node:assert/strict';
import { MonetizationController } from './MonetizationController';

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
  };
}

test('MonetizationController passes bounded filters to the offers service', async () => {
  const calls: unknown[] = [];
  const service = {
    listOffers: (query: unknown) => {
      calls.push(query);
      return { items: [], meta: { market: 'ES', total: 0 }, filters: {} };
    },
  };
  const controller = new MonetizationController(service as never);
  const response = responseDouble();

  await controller.getOffers({ query: {
    intent: 'movies', features: 'downloads,4k', maxMonthlyPrice: '12', sort: 'price-asc', market: 'ES',
  } } as never, response as never);

  assert.deepEqual(calls[0], {
    intent: 'movies', features: ['downloads', '4k'], maxMonthlyPrice: 12, sort: 'price-asc', market: 'ES',
  });
  assert.equal(response.statusCode, 200);
});

test('MonetizationController rejects unsupported filters at the HTTP boundary', async () => {
  const controller = new MonetizationController({ listOffers: () => ({}) } as never);

  await assert.rejects(
    controller.getOffers({ query: { intent: 'highest-commission' } } as never, responseDouble() as never),
    /intent/i
  );
});

test('MonetizationController redirects with no-store and no-referrer headers', async () => {
  const service = {
    trackAndResolveOutbound: async () => ({ destinationUrl: 'https://www.netflix.com/es/signup' }),
  };
  const controller = new MonetizationController(service as never);
  const response = responseDouble();

  await controller.go({
    params: { providerId: 'netflix', offerId: 'netflix-standard-with-ads' },
    query: { placement: 'comparison-table' },
  } as never, response as never);

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, 'https://www.netflix.com/es/signup');
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(response.headers['Referrer-Policy'], 'no-referrer');
});
