import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attachChatbotAffiliateActions,
  ChatbotAffiliateResolver,
} from './ChatbotRecommend';
import {
  ChatbotResponse,
  ChatbotRecommendationPayload,
} from '@/infrastructure/external/AIRecommendationService';
import { AffiliateResolveResponseDTO, AffiliateResolvedOfferDTO } from '@/application/dto/AffiliateResolveDTO';

function recommendation(overrides: Partial<ChatbotRecommendationPayload> = {}): ChatbotRecommendationPayload {
  return {
    title: 'Contenido de prueba',
    type: 'program',
    reason: 'Coincide con tu búsqueda.',
    ...overrides,
  };
}

function response(overrides: Partial<ChatbotResponse> = {}): ChatbotResponse {
  return {
    text: 'Aquí tienes lo que pediste.',
    recommendations: [],
    moreRecommendations: [],
    ...overrides,
  };
}

function offer(overrides: Partial<AffiliateResolvedOfferDTO> = {}): AffiliateResolvedOfferDTO {
  return {
    offerId: 'offer-1',
    merchant: { id: 'merchant-1', slug: 'movistar-plus', name: 'Movistar Plus+' },
    category: 'flatrate' as AffiliateResolvedOfferDTO['category'],
    plan: { id: 'plan-1', name: 'Plan estándar' },
    display: { disclosure: 'Enlace afiliado: GuíaTV puede recibir una comisión.' },
    cta: { label: 'Ver oferta', sponsored: true },
    outbound: { path: '/v2/affiliate/go/offer-1?placement=chatbot-answer&market=ES' },
    ...overrides,
  };
}

/** A resolver stub that returns `items` for every call and records every request it received. */
function stubResolver(items: AffiliateResolvedOfferDTO[]): ChatbotAffiliateResolver & { calls: string[][] } {
  const calls: string[][] = [];
  return {
    calls,
    resolveOffers: async (request): Promise<AffiliateResolveResponseDTO> => {
      calls.push(request.providerKeys || []);
      return { items, meta: { market: 'ES', placement: 'chatbot-answer', total: items.length, generatedAt: new Date().toISOString() } };
    },
  };
}

test('a pay/sports channel recommendation (TCM) resolves an affiliate CTA', async () => {
  const resolver = stubResolver([offer({ merchant: { id: 'm1', slug: 'movistar-plus', name: 'Movistar Plus+' } })]);
  const rec = recommendation({ channel: 'TCM', channelOrPlatform: 'TCM' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions?.length, 1);
  const action = result.recommendations![0].affiliateActions![0];
  assert.equal(action.provider, 'Movistar Plus+');
  assert.equal(action.sponsored, true);
  assert.equal(action.outboundPath, offer().outbound.path);
});

test('Movistar Hits resolves an affiliate CTA using channelOrPlatform', async () => {
  const resolver = stubResolver([offer()]);
  const rec = recommendation({ channel: 'M+ Hits', channelOrPlatform: 'M+ Hits' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions?.length, 1);
  assert.equal(resolver.calls[0][0], 'M+ Hits');
});

test('DAZN (sports streaming) resolves an affiliate CTA', async () => {
  const resolver = stubResolver([offer({ merchant: { id: 'm2', slug: 'dazn', name: 'DAZN' } })]);
  const rec = recommendation({ channel: 'DAZN', channelOrPlatform: 'DAZN' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions?.[0].provider, 'DAZN');
});

test('a plain streaming movie/series recommendation resolves by platform', async () => {
  const resolver = stubResolver([offer({ merchant: { id: 'm3', slug: 'netflix', name: 'Netflix' } })]);
  const movie = recommendation({ type: 'movie', platform: 'netflix', channelOrPlatform: 'netflix' });
  const series = recommendation({ type: 'series', platform: 'netflix', channelOrPlatform: 'netflix' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [movie, series] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions?.[0].provider, 'Netflix');
  assert.equal(result.recommendations?.[1].affiliateActions?.[0].provider, 'Netflix');
  // Both recommendations share one provider key — resolved once, not twice.
  assert.equal(resolver.calls.length, 1);
});

test('a football broadcaster resolves an affiliate CTA', async () => {
  const resolver = stubResolver([offer({ merchant: { id: 'm4', slug: 'dazn', name: 'DAZN' } })]);
  const withMatches = response({
    recommendations: [],
    matches: [
      {
        id: 'm1', slug: 'real-madrid-barcelona', competition: 'LaLiga', kickoffAt: new Date().toISOString(),
        status: 'scheduled', homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
        broadcasters: [{ name: 'DAZN' }], detailPath: '/futbol/partido/real-madrid-barcelona',
      },
    ],
  });
  const result = await attachChatbotAffiliateActions(withMatches, resolver);

  assert.equal(result.matches?.[0].broadcasters[0].affiliateActions?.[0].provider, 'DAZN');
});

test('an unknown provider leaves affiliateActions unset (CTA simply absent)', async () => {
  const resolver = stubResolver([]);
  const rec = recommendation({ channel: 'Canal Exótico', channelOrPlatform: 'Canal Exótico' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions, undefined);
});

test('a non-affiliate provider returns a CTA with sponsored:false, not omitted', async () => {
  const resolver = stubResolver([offer({ cta: { label: 'Ir al proveedor', sponsored: false } })]);
  const rec = recommendation({ channel: 'RTVE', channelOrPlatform: 'RTVE' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  const action = result.recommendations?.[0].affiliateActions?.[0];
  assert.ok(action);
  assert.equal(action!.sponsored, false);
});

test('affiliate backend throwing never breaks the chat answer', async () => {
  const resolver: ChatbotAffiliateResolver = {
    resolveOffers: async () => {
      throw new Error('affiliate service unavailable');
    },
  };
  const rec = recommendation({ channel: 'TCM', channelOrPlatform: 'TCM' });
  const original = response({ recommendations: [rec] });
  const result = await attachChatbotAffiliateActions(original, resolver);

  assert.equal(result.text, original.text);
  assert.equal(result.recommendations?.[0].affiliateActions, undefined);
});

test('affiliate backend timing out never breaks the chat answer', async () => {
  const resolver: ChatbotAffiliateResolver = {
    resolveOffers: () => new Promise(() => {}), // never resolves
  };
  const rec = recommendation({ channel: 'TCM', channelOrPlatform: 'TCM' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions, undefined);
});

test('no resolver configured is a no-op (deployment without the Affiliate Engine)', async () => {
  const rec = recommendation({ channel: 'TCM', channelOrPlatform: 'TCM' });
  const original = response({ recommendations: [rec] });
  const result = await attachChatbotAffiliateActions(original, undefined);

  assert.deepEqual(result, original);
});

test('streaming provider ambiguity: the engine’s top-ranked candidate wins, not the LLM', async () => {
  // Multiple valid providers for one recommendation — the resolver (deterministic ranking)
  // returns one ordered list; attachChatbotAffiliateActions always takes items[0].
  const resolver = stubResolver([
    offer({ offerId: 'best-ranked', merchant: { id: 'm5', slug: 'movistar-plus', name: 'Movistar Plus+' } }),
    offer({ offerId: 'second-ranked', merchant: { id: 'm6', slug: 'rakuten-tv', name: 'Rakuten TV' } }),
  ]);
  const rec = recommendation({ type: 'movie', platform: 'movistar-plus', channelOrPlatform: 'movistar-plus' });
  const result = await attachChatbotAffiliateActions(response({ recommendations: [rec] }), resolver);

  assert.equal(result.recommendations?.[0].affiliateActions?.length, 1);
  assert.equal(result.recommendations?.[0].affiliateActions?.[0].offerId, 'best-ranked');
});

test('a response with no provider-bearing recommendations or matches is left untouched', async () => {
  const resolver = stubResolver([offer()]);
  const original = response({ recommendations: [recommendation({ channel: undefined, channelOrPlatform: undefined, platform: undefined })] });
  const result = await attachChatbotAffiliateActions(original, resolver);

  assert.deepEqual(result, original);
  assert.equal(resolver.calls.length, 0);
});
