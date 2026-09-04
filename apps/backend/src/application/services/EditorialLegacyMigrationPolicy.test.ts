import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planLegacyEditorialMigration } from './EditorialLegacyMigrationPolicy';

test('curated seed content is approved and attributed', () => {
  const plan = planLegacyEditorialMigration({
    slug: 'guia-curada',
    status: 'publish',
    author: { name: 'Equipo editorial Guia TV', id: 'guiatv-editorial' },
  }, new Set(['guia-curada']));
  assert.ok(plan);
  assert.equal(plan.status, 'publish');
  assert.equal(plan.reviewState, 'approved');
  assert.equal(plan.origin, 'human');
});

test('published content with no author is quarantined', () => {
  const plan = planLegacyEditorialMigration({ slug: 'sin-autor', status: 'publish' }, new Set());
  assert.ok(plan);
  assert.equal(plan.status, 'draft');
  assert.equal(plan.reviewState, 'rejected');
});

test('Auctorio-origin content is quarantined even if it has an author label', () => {
  const plan = planLegacyEditorialMigration({
    slug: 'automatizado', status: 'publish', author: { name: 'Robot', id: 'robot' },
    content: '<a href="https://auctorio.com/item">source</a>',
  }, new Set());
  assert.ok(plan);
  assert.equal(plan.status, 'draft');
  assert.equal(plan.origin, 'automated-import');
});

test('already reviewed non-seed content is left unchanged', () => {
  assert.equal(planLegacyEditorialMigration({
    slug: 'revisado', status: 'publish', reviewState: 'approved',
    author: { name: 'Ana', id: 'ana' }, content: 'original',
  }, new Set()), null);
});

test('an already approved curated post makes the migration idempotent', () => {
  assert.equal(planLegacyEditorialMigration({
    slug: 'guia-curada', status: 'publish', origin: 'human', reviewState: 'approved',
    author: { name: 'Equipo editorial', id: 'guiatv-editorial' },
  }, new Set(['guia-curada'])), null);
});

test('a withdrawn curated post is never republished by the migration', () => {
  assert.equal(planLegacyEditorialMigration({
    slug: 'guia-curada', status: 'draft', origin: 'human', reviewState: 'unreviewed',
    author: { name: 'Equipo editorial', id: 'guiatv-editorial' },
  }, new Set(['guia-curada'])), null);
});
