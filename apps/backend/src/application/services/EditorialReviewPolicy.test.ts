import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertEditorialPostCanBeApproved,
  buildEditorialApproval,
  PUBLIC_EDITORIAL_FILTER,
} from './EditorialReviewPolicy';

const validPost = {
  title: 'Guía de series de streaming que merece la pena ver',
  excerpt: 'Una introducción concreta que explica qué serie de streaming encontrará el lector en la guía.',
  content: `<p>${'contenido editorial verificado sobre esta serie de streaming '.repeat(90)}</p>`,
  author: { name: 'Equipo editorial Guía TV', id: 'guiatv-editorial' },
  seo: {
    metaTitle: 'Guía útil y revisada | Guía TV',
    metaDescription: 'Información verificada y útil para elegir qué ver en televisión y streaming.',
  },
  categories: [{ name: 'Series', slug: 'series' }],
};

test('approval rejects content with no cine/series/TV/streaming signal', () => {
  assert.throws(
    () =>
      assertEditorialPostCanBeApproved({
        ...validPost,
        categories: [{ name: 'Economía', slug: 'economia' }],
        title: 'Informe trimestral de resultados económicos',
        excerpt: 'Un resumen de indicadores macroeconómicos del último trimestre publicado hoy.',
        content: `<p>${'datos macroeconómicos y resultados financieros trimestrales '.repeat(90)}</p>`,
      }),
    /relevancia editorial/i
  );
});

test('public editorial filter requires both publish status and explicit approval', () => {
  assert.deepEqual(PUBLIC_EDITORIAL_FILTER, {
    status: 'publish',
    reviewState: 'approved',
  });
});

test('approval rejects missing authorship and low-value content', () => {
  assert.throws(
    () => assertEditorialPostCanBeApproved({ ...validPost, author: undefined, content: '<p>Breve.</p>' }),
    /author|contenido/i
  );
});

test('approval records reviewer and publishes in one auditable transition', () => {
  const now = new Date('2026-08-31T12:00:00.000Z');
  assert.deepEqual(buildEditorialApproval(validPost, 'editora@guia.test', now), {
    status: 'publish',
    reviewState: 'approved',
    reviewedBy: 'editora@guia.test',
    reviewedAt: now,
    publishedAt: now,
  });
});

test('approval requires a named reviewer distinct from content generation', () => {
  assert.throws(() => buildEditorialApproval(validPost, '', new Date()), /reviewer/i);
});
