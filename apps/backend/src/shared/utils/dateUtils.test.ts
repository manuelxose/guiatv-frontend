import test from 'node:test';
import assert from 'node:assert/strict';
import { DateUtils } from './dateUtils';

test('parseDateAlias accepts ISO calendar dates and normalizes them to YYYYMMDD', () => {
  assert.equal(DateUtils.parseDateAlias('2026-03-26'), '20260326');
});

test('parseDateAlias keeps supporting explicit YYYYMMDD input', () => {
  assert.equal(DateUtils.parseDateAlias('20260326'), '20260326');
});

test('parseDateAlias still resolves aliases such as today', () => {
  const value = DateUtils.parseDateAlias('today');
  assert.match(value, /^\d{8}$/);
});
