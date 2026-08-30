import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAffiliateText } from './affiliateText';

test('normalizeAffiliateText lowercases, trims and collapses whitespace', () => {
  assert.equal(normalizeAffiliateText('  Movistar   Plus  '), 'movistar plus');
});

test('normalizeAffiliateText strips accents', () => {
  assert.equal(normalizeAffiliateText('Atrésplayer'), 'atresplayer');
});

test('normalizeAffiliateText treats "Movistar+"/"M+"/"Movistar Plus" as distinct but each internally stable', () => {
  assert.equal(normalizeAffiliateText('Movistar+'), 'movistar+');
  assert.equal(normalizeAffiliateText('M+'), 'm+');
  assert.equal(normalizeAffiliateText('movistar+'), normalizeAffiliateText('Movistar+'));
  assert.equal(normalizeAffiliateText(' M+ '), normalizeAffiliateText('M+'));
});

test('normalizeAffiliateText handles empty/undefined input safely', () => {
  assert.equal(normalizeAffiliateText(''), '');
  assert.equal(normalizeAffiliateText(undefined as unknown as string), '');
});
