/**
 * Phase 2D-2F, optional: independent model assessments of machine-evidence verdicts. Each item is
 * sent to every configured model (at least two) through an injected `assess` function, so no
 * provider SDK or key is needed to run the policy. Bounded concurrency, retries with backoff, a
 * cache keyed by model and request, token accounting and a spending cap.
 *
 * Policy: models can only add doubt. An AUTO_ACCEPT any model disagrees with becomes QUARANTINE
 * (`model_flag:<model>:…`); nothing is ever upgraded, and agreement between models proves nothing.
 * A model's suggestion is kept as advice until deterministic evidence supports it.
 */
import { createHash } from 'node:crypto';
import type { EvidenceDecision, EvidenceVerdict } from './ContentIdentityEvidence';

/** What a model is shown: the candidate and its evidence trail, nothing else. */
export interface AdjudicationRequest {
  candidateId: string;
  title: string;
  kind: string;
  path?: string | null;
  evidence: Pick<EvidenceVerdict, 'decision' | 'support' | 'contradictions' | 'missing'>;
}

/** One model's structured answer. */
export interface Assessment {
  workTitle: string;
  kind: 'show' | 'series' | 'movie' | 'unknown';
  episodeRelationship: 'work' | 'episode' | 'slot' | 'unknown';
  sourceIds: string[];
  supporting: string[];
  contradicting: string[];
  rationale: string;
  recommendation: 'accept' | 'reject' | 'quarantine';
  usage: { inputTokens: number; outputTokens: number };
}

export type Assessor = (model: string, request: AdjudicationRequest) => Promise<Assessment>;

export interface AdjudicationOptions {
  /** At least two independent models. */
  models: string[];
  /** USD per million tokens, per model. */
  prices: Record<string, { input: number; output: number }>;
  /** No new call starts once this is spent; calls in flight may add up to `concurrency` more. */
  budgetUsd: number;
  concurrency?: number;
  maxRetries?: number;
  cache?: Map<string, Assessment>;
  /** Backoff base in ms (tests pass 0). */
  backoffMs?: number;
}

export interface AdjudicationResult {
  candidateId: string;
  before: EvidenceDecision;
  decision: EvidenceDecision;
  flags: string[];
  assessments: Record<string, Assessment | { error: string } | { skipped: 'budget' }>;
}

export const adjudicationRequest = (v: EvidenceVerdict): AdjudicationRequest => ({
  candidateId: v.candidateId,
  title: v.title,
  kind: v.kind,
  path: v.path,
  evidence: { decision: v.decision, support: v.support, contradictions: v.contradictions, missing: v.missing },
});

/** Why a model's answer doubts an accepted identity, or null when it agrees. */
function doubt(v: EvidenceVerdict, a: Assessment): string | null {
  if (a.recommendation !== 'accept') return a.recommendation;
  if (a.episodeRelationship !== 'work') return a.episodeRelationship;
  if (a.kind !== v.kind) return `kind_${a.kind}`;
  return null;
}

export async function adjudicate(verdicts: readonly EvidenceVerdict[], assess: Assessor, opts: AdjudicationOptions) {
  if (new Set(opts.models).size < 2) throw new Error('adjudication needs at least two distinct models');
  const cache = opts.cache ?? new Map<string, Assessment>();
  const spend = { usd: 0, inputTokens: 0, outputTokens: 0, calls: 0, retries: 0, cached: 0, failed: 0, skippedForBudget: 0 };
  const jobs = verdicts.flatMap((v) => opts.models.map((model) => ({ v, model })));
  const answers = new Map<string, AdjudicationResult['assessments']>(verdicts.map((v) => [v.candidateId, {}]));

  const run = async ({ v, model }: (typeof jobs)[number]) => {
    const request = adjudicationRequest(v);
    const key = createHash('sha256').update(`${model}\0${JSON.stringify(request)}`).digest('hex');
    const out = answers.get(v.candidateId)!;
    const hit = cache.get(key);
    if (hit) {
      spend.cached++;
      out[model] = hit;
      return;
    }
    if (spend.usd >= opts.budgetUsd) {
      spend.skippedForBudget++;
      out[model] = { skipped: 'budget' };
      return;
    }
    for (let attempt = 0; ; attempt++) {
      try {
        spend.calls++;
        const a = await assess(model, request);
        const price = opts.prices[model] ?? { input: 0, output: 0 };
        spend.inputTokens += a.usage.inputTokens;
        spend.outputTokens += a.usage.outputTokens;
        spend.usd += (a.usage.inputTokens * price.input + a.usage.outputTokens * price.output) / 1e6;
        cache.set(key, a);
        out[model] = a;
        return;
      } catch (error) {
        if (attempt >= (opts.maxRetries ?? 2)) {
          spend.failed++;
          out[model] = { error: String((error as Error)?.message ?? error).slice(0, 200) };
          return;
        }
        spend.retries++;
        await new Promise((r) => setTimeout(r, (opts.backoffMs ?? 500) * 2 ** attempt));
      }
    }
  };

  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, opts.concurrency ?? 4) }, async () => {
      while (next < jobs.length) await run(jobs[next++]);
    })
  );

  const results: AdjudicationResult[] = verdicts.map((v) => {
    const assessments = answers.get(v.candidateId)!;
    const flags = Object.entries(assessments).flatMap(([model, a]) => {
      if (!('recommendation' in a)) return [];
      const why = doubt(v, a);
      return why ? [`model_flag:${model}:${why}`] : [];
    });
    const decision = v.decision === 'AUTO_ACCEPT' && flags.length ? 'QUARANTINE' : v.decision;
    return { candidateId: v.candidateId, before: v.decision, decision, flags, assessments };
  });
  return { results, spend };
}
