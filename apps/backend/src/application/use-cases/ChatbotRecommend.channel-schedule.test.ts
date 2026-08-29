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

test('explicit pay-TV and Movistar questions are deterministic channel schedule intents', () => {
  const cases: Array<[string, string, string]> = [
    ['qué ver hoy en TCM', 'tcm', 'today'],
    ['qué ponen esta noche en AXN', 'axn', 'tonight'],
    ['qué están echando ahora en Calle 13', 'calle_13', 'now'],
    ['programación Syfy hoy', 'syfy', 'today'],
    ['qué ver hoy en Movistar Hits', 'movistar_hits', 'today'],
    ['qué ver hoy en M+ Hits', 'movistar_hits', 'today'],
    ['qué ponen hoy en Movistar Estrenos', 'movistar_estrenos', 'today'],
    ['qué echan ahora en M+ Acción', 'movistar_accion', 'now'],
  ];

  cases.forEach(([message, channelId, period]) => {
    const intent = (chatbot as any).analyzeIntent(message);
    assert.equal(intent.mode, 'tv_channel_schedule', message);
    assert.equal(intent.channelId, channelId, message);
    assert.equal(intent.channelPeriod, period, message);
  });
});

test('channel identity avoids prefix collisions', () => {
  assert.equal((chatbot as any).analyzeIntent('qué hay hoy en AXN').channelId, 'axn');
  assert.equal((chatbot as any).analyzeIntent('qué hay hoy en AXN Movies').channelId, 'axn_movies');
  assert.equal((chatbot as any).analyzeIntent('qué hay hoy en AMC').channelId, 'amc');
  assert.equal((chatbot as any).analyzeIntent('qué hay hoy en AMC Crime').channelId, 'amc_crime');
});
