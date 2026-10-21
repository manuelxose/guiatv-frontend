import test from 'node:test';
import assert from 'node:assert/strict';
import { adjudicate, type Assessment, type Assessor } from './ContentIdentityAdjudication';
import type { EvidenceVerdict } from './ContentIdentityEvidence';

const verdict = (candidateId: string, decision: EvidenceVerdict['decision'], kind: EvidenceVerdict['kind'] = 'series'): EvidenceVerdict => ({
  candidateId, key: candidateId, kind, title: candidateId, path: `/series/${candidateId}`, decision, assurance: 'independently_supported', kindBasis: 'category', unverified: [],
  support: [], contradictions: [], missing: [],
});
const answer = (over: Partial<Assessment> = {}): Assessment => ({
  workTitle: 'x', kind: 'series', episodeRelationship: 'work', sourceIds: [], supporting: [], contradicting: [], rationale: '',
  recommendation: 'accept', usage: { inputTokens: 1000, outputTokens: 200 }, ...over,
});
const prices = { a: { input: 4, output: 20 }, b: { input: 2, output: 10 } };
const opts = { models: ['a', 'b'], prices, budgetUsd: 10, backoffMs: 0 };

test('models only add doubt: a disagreement quarantines an acceptance; nothing is upgraded', async () => {
  const assess: Assessor = async (model, req) =>
    model === 'b' && req.candidateId === 'grimm' ? answer({ recommendation: 'quarantine' }) : model === 'b' && req.candidateId === 'mixed' ? answer({ kind: 'show' }) : answer();
  const { results } = await adjudicate([verdict('grimm', 'AUTO_ACCEPT'), verdict('mixed', 'AUTO_ACCEPT'), verdict('ok', 'AUTO_ACCEPT'), verdict('held', 'QUARANTINE'), verdict('slot', 'AUTO_REJECT')], assess, opts);
  const by = Object.fromEntries(results.map((r) => [r.candidateId, [r.decision, r.flags]]));
  assert.deepEqual(by, {
    grimm: ['QUARANTINE', ['model_flag:b:quarantine']],
    mixed: ['QUARANTINE', ['model_flag:b:kind_show']],
    ok: ['AUTO_ACCEPT', []],
    held: ['QUARANTINE', []],
    slot: ['AUTO_REJECT', []],
  }, 'both models accepting a quarantined or rejected candidate changes nothing');
  await assert.rejects(adjudicate([], assess, { ...opts, models: ['a', 'a'] }), /two distinct models/);
});

test('token accounting, cache, retries, bounded concurrency and the spending cap', async () => {
  let inFlight = 0;
  let peak = 0;
  let failures = 1;
  const assess: Assessor = async () => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 1));
    inFlight--;
    if (failures-- > 0) throw new Error('529 overloaded');
    return answer();
  };
  const cache = new Map<string, Assessment>();
  const items = ['a1', 'a2', 'a3'].map((id) => verdict(id, 'AUTO_ACCEPT'));
  const first = await adjudicate(items, assess, { ...opts, concurrency: 2, cache });
  assert.ok(peak <= 2);
  assert.deepEqual({ ...first.spend, usd: Number(first.spend.usd.toFixed(4)) }, {
    usd: 0.036, inputTokens: 6000, outputTokens: 1200, calls: 7, retries: 1, cached: 0, failed: 0, skippedForBudget: 0,
  }, '3 items × 2 models, one retried; a: 3×(1000×4+200×20)/1e6, b: 3×(1000×2+200×10)/1e6');
  const again = await adjudicate(items, assess, { ...opts, cache });
  assert.deepEqual([again.spend.calls, again.spend.cached], [0, 6], 'cached answers cost nothing');

  const capped = await adjudicate(items, async () => answer(), { ...opts, budgetUsd: 0.005, concurrency: 1 });
  assert.deepEqual([capped.spend.calls, capped.spend.skippedForBudget], [1, 5]);
  assert.deepEqual(capped.results.map((r) => r.decision), ['AUTO_ACCEPT', 'AUTO_ACCEPT', 'AUTO_ACCEPT'], 'a skipped assessment changes nothing');

  const broken = await adjudicate([verdict('x', 'AUTO_ACCEPT')], async () => { throw new Error('400'); }, { ...opts, maxRetries: 1 });
  assert.deepEqual([broken.spend.failed, broken.spend.calls, broken.results[0].decision], [2, 4, 'AUTO_ACCEPT']);
});
