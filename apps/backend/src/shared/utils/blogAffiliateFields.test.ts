import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAffiliatePlacementMode,
  normalizeLowercaseKeys,
  normalizeOfferIds,
} from './blogAffiliateFields';

test('normalizeAffiliatePlacementMode defaults to auto when the field is missing (posts written before this field existed)', () => {
  assert.equal(normalizeAffiliatePlacementMode(undefined), 'auto');
  assert.equal(normalizeAffiliatePlacementMode(undefined, 'manual'), 'manual');
});

test('normalizeAffiliatePlacementMode accepts each known mode, case-insensitively', () => {
  assert.equal(normalizeAffiliatePlacementMode('AUTO'), 'auto');
  assert.equal(normalizeAffiliatePlacementMode(' manual '), 'manual');
  assert.equal(normalizeAffiliatePlacementMode('off'), 'off');
});

test('normalizeAffiliatePlacementMode falls back rather than throwing on an unrecognized value — to the existing document value when there is one, otherwise auto', () => {
  assert.equal(normalizeAffiliatePlacementMode('sometimes'), 'auto');
  assert.equal(normalizeAffiliatePlacementMode('sometimes', 'manual'), 'manual');
});

test('normalizeLowercaseKeys lowercases, trims, dedupes and preserves first-seen order', () => {
  assert.deepEqual(normalizeLowercaseKeys(['Netflix', ' netflix ', 'Smart-TV']), ['netflix', 'smart-tv']);
});

test('normalizeLowercaseKeys accepts a comma-separated string (admin form free-text input)', () => {
  assert.deepEqual(normalizeLowercaseKeys('Netflix, Smart-TV ,, Netflix'), ['netflix', 'smart-tv']);
});

test('normalizeLowercaseKeys keeps the existing value when the field is omitted from the payload, and clears it when explicitly empty', () => {
  assert.deepEqual(normalizeLowercaseKeys(undefined, ['netflix']), ['netflix']);
  assert.deepEqual(normalizeLowercaseKeys([], ['netflix']), []);
});

test('normalizeOfferIds trims and dedupes but preserves case (opaque ids, not free-text keys)', () => {
  assert.deepEqual(normalizeOfferIds(['Offer-A', ' Offer-B ', 'Offer-A']), ['Offer-A', 'Offer-B']);
});

test('normalizeOfferIds accepts a comma-separated string and keeps the existing value when omitted', () => {
  assert.deepEqual(normalizeOfferIds('offer-1, offer-2'), ['offer-1', 'offer-2']);
  assert.deepEqual(normalizeOfferIds(undefined, ['offer-1']), ['offer-1']);
});
