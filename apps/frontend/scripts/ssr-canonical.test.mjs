// node --test apps/frontend/scripts/ssr-canonical.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalizeCanonical } from './ssr-canonical.mjs';

const baseUrl = 'https://guiaprogramaciontv.com';
const page = (head) => `<html><head><title>x</title>${head}</head><body></body></html>`;
const canonicals = (html) => [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/g)].map((m) => m[1]);
const run = (head, pathname, statusCode = 200) => finalizeCanonical(page(head), { baseUrl, pathname, statusCode });

test('keeps the canonical Angular rendered (legacy match slug → current slug)', () => {
  const { html, fallback } = run(
    `<link rel="canonical" href="${baseUrl}/deportes/futbol/partido/a-b-2026-10-18">`,
    '/deportes/futbol/partido/a-b-2026-10-17'
  );
  assert.deepEqual(canonicals(html), [`${baseUrl}/deportes/futbol/partido/a-b-2026-10-18`]);
  assert.equal(fallback, false);
});

test('adds a self-canonical only to an indexable 200 page without one', () => {
  const { html, fallback } = run('<meta name="robots" content="index, follow">', '/avisolegal');
  assert.deepEqual(canonicals(html), [`${baseUrl}/avisolegal`]);
  assert.equal(fallback, true);
});

test('the fallback uses the path only (query strings are canonicalised away by the caller passing req.path)', () => {
  assert.deepEqual(canonicals(run('', '/canales/la-1').html), [`${baseUrl}/canales/la-1`]);
});

test('noindex pages without a canonical get none (not-found states, CSR shells)', () => {
  const { html, fallback } = run('<meta name="robots" content="noindex, follow">', '/deportes/futbol/partido/x-2026-01-01');
  assert.deepEqual(canonicals(html), []);
  assert.equal(fallback, false);
});

test('error responses carry no canonical, even one the app rendered', () => {
  for (const status of [404, 410, 503]) {
    const { html } = run(`<link rel="canonical" href="${baseUrl}/programas/x">`, '/programas/x', status);
    assert.deepEqual(canonicals(html), [], `status ${status}`);
  }
  assert.deepEqual(canonicals(run('', '/no-existe', 404).html), []);
});

test('never emits more than one canonical; the first (Angular) one is kept', () => {
  const { html } = run(`<link rel="canonical" href="${baseUrl}/a"><link rel="canonical" href="${baseUrl}/b">`, '/b');
  assert.deepEqual(canonicals(html), [`${baseUrl}/a`]);
});

test('redirect statuses are left alone', () => {
  assert.deepEqual(canonicals(run('', '/x', 301).html), []);
});

test('a hostile path cannot break out of the href attribute', () => {
  const { html } = run('', '/x"><script>alert(1)</script>');
  assert.ok(!html.includes('<script>'));
  assert.equal(canonicals(html).length, 1);
});
