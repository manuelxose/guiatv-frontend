import assert from 'node:assert/strict';
import test from 'node:test';
import { ChatbotRecommend } from './ChatbotRecommend';

const chatbot = new ChatbotRecommend(
  {} as any,
  {} as any,
  {} as any,
  {} as any,
  {} as any,
);

test('live action movie queries retain only enriched action matches', () => {
  const actionMovie = {
    catalogId: 'program:action', contentType: 'movie', title: 'Misión imposible',
    genres: ['Cine', 'Acción'], primaryPlatforms: [], liveNow: true,
  };
  const dramaMovie = {
    catalogId: 'program:drama', contentType: 'movie', title: 'Un drama',
    genres: ['Cine', 'Drama'], primaryPlatforms: [], liveNow: true,
  };
  const intent = (chatbot as any).analyzeIntent('¿Echan alguna película de acción ahora?');

  assert.equal(intent.mode, 'tv_now');
  assert.deepEqual(
    (chatbot as any).filterCatalogItems([actionMovie, dramaMovie], intent),
    [actionMovie],
  );
});

test('live action movie queries preserve the no-result fallback when no action title is airing', async () => {
  const intent = (chatbot as any).analyzeIntent('¿Echan alguna película de acción ahora?');
  const response = await (chatbot as any).buildDirectScheduleResponse(
    intent,
    [],
    [],
    [],
    '¿Echan alguna película de acción ahora?',
    { history: { messages: [] }, communityReply: { kind: 'none', shouldPersist: false } },
  );

  assert.match(response.text, /no veo películas en la parrilla/i);
  assert.deepEqual(response.recommendations, []);
});

// Regression: "thriller" had no canonical genre entry before the shared
// taxonomy existed, so this query silently matched nothing.
test('"qué thrillers hay esta noche" detects the canonical Suspense genre and filters by it', () => {
  const thrillerSeries = {
    catalogId: 'program:thriller', contentType: 'series', title: 'Serie de suspense',
    genres: ['Series', 'Suspense'], primaryPlatforms: [], liveNow: true,
  };
  const comedySeries = {
    catalogId: 'program:comedy', contentType: 'series', title: 'Una comedia',
    genres: ['Series', 'Comedia'], primaryPlatforms: [], liveNow: true,
  };
  const intent = (chatbot as any).analyzeIntent('qué thrillers hay esta noche');

  assert.equal(intent.mode, 'tv_tonight');
  assert.deepEqual(intent.explicitGenres, ['Suspense']);
  assert.deepEqual(
    (chatbot as any).filterCatalogItems([thrillerSeries, comedySeries], intent),
    [thrillerSeries],
  );
});

test('"qué comedias ponen hoy" and "ciencia ficción" queries detect the canonical genre', () => {
  assert.deepEqual(
    (chatbot as any).analyzeIntent('qué comedias ponen hoy').explicitGenres,
    ['Comedia'],
  );
  assert.deepEqual(
    (chatbot as any).analyzeIntent('hay alguna película de ciencia ficción ahora').explicitGenres,
    ['Ciencia ficción'],
  );
});

test('English and unaccented genre wording still filters items tagged with the Spanish canonical label', () => {
  const scifiMovie = {
    catalogId: 'program:scifi', contentType: 'movie', title: 'Viaje estelar',
    genres: ['Cine', 'Ciencia ficción'], primaryPlatforms: [], liveNow: true,
  };
  const intent = (chatbot as any).analyzeIntent('any sci-fi movies on now?');

  assert.deepEqual(intent.explicitGenres, ['Ciencia ficción']);
  assert.deepEqual((chatbot as any).filterCatalogItems([scifiMovie], intent), [scifiMovie]);
});
