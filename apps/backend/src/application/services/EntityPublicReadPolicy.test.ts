import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARY_HARD_CAP, EntityPublicReadPolicy } from './EntityPublicReadPolicy';

const entry = (n: number, extra = {}) => ({ entityId: `e${n}`, canonicalPath: `/peliculas/film-${n}`, approvedBy: 'Ana García', approvedAt: '2026-10-22T08:00:00Z', ...extra });

/** A policy over an in-memory "filesystem" and a manual clock. */
function setup(env: Record<string, string | undefined>, files: Record<string, string> = {}) {
  const clock = { t: 1_000_000 };
  const state = { files: { ...files }, versions: 1 };
  const policy = new EntityPublicReadPolicy({
    env: env as NodeJS.ProcessEnv,
    now: () => clock.t,
    stat: (f) => (f in state.files ? { mtimeMs: state.versions, size: state.files[f].length } : null),
    read: (f) => state.files[f],
    exists: (f) => f in state.files,
  });
  const edit = (f: string, text: string | null) => {
    if (text === null) delete state.files[f]; else state.files[f] = text;
    state.versions++;
    clock.t += 6_000;
  };
  return { policy, clock, edit, env };
}
const list = (...entities: unknown[]) => JSON.stringify({ version: 1, entities });
const base = { CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'canary', CONTENT_ENTITY_CANARY_FILE: '/c.json', CONTENT_ENTITY_CANARY_MAX: '2' };

test('the master flag alone, or only a literal true, never exposes the corpus', () => {
  for (const env of [{}, { CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'TRUE' }, { CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true' }, { CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'everything' }]) {
    const { policy } = setup(env);
    assert.equal(policy.readMode(), 'off', JSON.stringify(env));
    assert.equal(policy.decide('/peliculas/film-1').action, 'legacy');
  }
  assert.equal(setup({ CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'all' }).policy.readMode(), 'all');
});

test('canary serves only allowlisted canonical paths and everything else is legacy', () => {
  const { policy } = setup(base, { '/c.json': list(entry(1), entry(2)) });
  assert.deepEqual(policy.decide('/peliculas/film-1'), { action: 'entity', mode: 'canary', entry: { ...entry(1), approvedBy: 'Ana García' } });
  assert.equal(policy.decide('/peliculas/film-2/').action, 'entity', 'one trailing slash is the same path');
  for (const path of ['/peliculas/film-3', '/series/film-1', '/peliculas/FILM-1', '']) assert.deepEqual(policy.decide(path), { action: 'legacy', reason: 'not_allowlisted' }, path);
  assert.deepEqual([...policy.canaryPaths()].sort(), ['/peliculas/film-1', '/peliculas/film-2']);
});

test('maximum exposure: a longer list, a missing ceiling or the hard cap disable the whole canary', () => {
  const tooMany = setup(base, { '/c.json': list(entry(1), entry(2), entry(3)) }).policy;
  assert.deepEqual(tooMany.decide('/peliculas/film-1'), { action: 'legacy', reason: 'canary_config_invalid' });
  assert.equal(tooMany.canaryPaths().size, 0);
  for (const max of [undefined, '0', '1.5', 'x', String(CANARY_HARD_CAP + 1)]) {
    const env = { ...base, ...(max === undefined ? { CONTENT_ENTITY_CANARY_MAX: '' } : { CONTENT_ENTITY_CANARY_MAX: max }) };
    assert.equal(setup(env, { '/c.json': list(entry(1)) }).policy.decide('/peliculas/film-1').action, 'legacy', String(max));
  }
  const cap = setup({ ...base, CONTENT_ENTITY_CANARY_MAX: String(CANARY_HARD_CAP) }, { '/c.json': list(...Array.from({ length: CANARY_HARD_CAP }, (_, i) => entry(i))) });
  assert.equal(cap.policy.canaryPaths().size, CANARY_HARD_CAP);
});

test('a malformed allowlist fails closed: bad shape, duplicates, automation reviewers, unsafe paths, missing file', () => {
  const bad = [
    '{', list(), JSON.stringify({ version: 2, entities: [] }), JSON.stringify({ version: 1 }),
    list(entry(1), entry(1)), list(entry(1), entry(2, { canonicalPath: '/peliculas/film-1' })),
    list(entry(1, { approvedBy: 'system' })), list(entry(1, { approvedBy: 'claude' })), list(entry(1, { approvedAt: 'never' })),
    list(entry(1, { canonicalPath: '/peliculas/../admin' })), list(entry(1, { canonicalPath: '/otro/film-1' })), list(entry(1, { canonicalPath: '/peliculas/Film-1' })),
    list({ entityId: '', canonicalPath: '/peliculas/film-1', approvedBy: 'Ana García', approvedAt: '2026-10-22' }),
  ];
  for (const text of bad) {
    if (text === list()) continue; // an empty allowlist is valid: nothing is visible
    const { policy } = setup(base, { '/c.json': text });
    assert.equal(policy.decide('/peliculas/film-1').action, 'legacy', text);
    assert.match(policy.stats().configError ?? '', /./, text);
  }
  assert.equal(setup(base).policy.decide('/peliculas/film-1').action, 'legacy');
  assert.equal(setup(base, { '/c.json': list() }).policy.stats().configError, undefined);
});

test('kill switch: env or file, no restart, restores legacy everywhere', () => {
  const s = setup({ ...base, CONTENT_ENTITY_KILL_FILE: '/kill' }, { '/c.json': list(entry(1)) });
  assert.equal(s.policy.decide('/peliculas/film-1').action, 'entity');
  s.edit('/kill', '');
  assert.deepEqual(s.policy.decide('/peliculas/film-1'), { action: 'legacy', reason: 'killed' });
  assert.equal(s.policy.readMode(), 'off');
  assert.equal(s.policy.canaryPaths().size, 0, 'a killed canary excludes nothing from sitemaps');
  s.edit('/kill', null);
  assert.equal(s.policy.decide('/peliculas/film-1').action, 'entity');
  s.env.CONTENT_ENTITY_PUBLIC_READ_KILL = 'true';
  assert.equal(s.policy.decide('/peliculas/film-1').action, 'legacy');
  // The kill switch also overrides scope=all.
  const all = setup({ CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'all', CONTENT_ENTITY_PUBLIC_READ_KILL: 'true' });
  assert.equal(all.policy.readMode(), 'off');
});

test('the allowlist is re-read when it changes: revocation takes effect without a restart', () => {
  const s = setup(base, { '/c.json': list(entry(1), entry(2)) });
  assert.equal(s.policy.decide('/peliculas/film-2').action, 'entity');
  const before = s.policy.partition();
  s.edit('/c.json', list(entry(1)));
  assert.equal(s.policy.decide('/peliculas/film-2').action, 'legacy');
  assert.notEqual(s.policy.partition(), before, 'sitemap caches are keyed by the visible set');
  s.edit('/c.json', null);
  assert.equal(s.policy.decide('/peliculas/film-1').action, 'legacy', 'a deleted file closes the canary');
});

test('breaker: repeated integrity errors open it; failures and routes are counted, other paths share one bucket', () => {
  const s = setup(base, { '/c.json': list(entry(1)) });
  s.policy.decide('/peliculas/film-1');
  s.policy.outcome('/peliculas/film-1', 'served');
  for (let i = 0; i < 4; i++) s.policy.outcome('/peliculas/film-1', 'integrity_error');
  assert.equal(s.policy.stats().breakerOpen, false);
  s.policy.outcome('/peliculas/film-1', 'integrity_error');
  assert.equal(s.policy.stats().breakerOpen, true);
  assert.deepEqual(s.policy.decide('/peliculas/film-1'), { action: 'legacy', reason: 'breaker_open' });
  const stats = s.policy.stats();
  assert.equal(stats.routes['/peliculas/film-1'].integrity_error, 5);
  assert.ok(stats.errorRate! > 0.8);
  for (let i = 0; i < 50; i++) s.policy.decide(`/peliculas/other-${i}`);
  assert.deepEqual(Object.keys(s.policy.stats().routes).sort(), ['(other)', '/peliculas/film-1']);
  // Errors spread over more than a minute never trip it.
  const slow = setup(base, { '/c.json': list(entry(1)) });
  slow.policy.decide('/peliculas/film-1');
  for (let i = 0; i < 20; i++) { slow.policy.outcome('/peliculas/film-1', 'error'); slow.clock.t += 20_000; }
  assert.equal(slow.policy.stats().breakerOpen, false);
});

test('stats expose no entity content and nothing when the feature is off', () => {
  const off = setup({}).policy;
  off.decide('/peliculas/film-1');
  assert.deepEqual(off.stats().routes, {});
  const s = setup(base, { '/c.json': list(entry(1)) });
  const json = JSON.stringify(s.policy.stats());
  assert.doesNotMatch(json, /Ana|e1"|approved/);
});
