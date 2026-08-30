import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedAffiliateDestination, validateAffiliateDestination } from './AffiliateDestinationValidator';

test('AffiliateDestinationValidator accepts an https URL on an allowlisted host', () => {
  const result = validateAffiliateDestination('https://www.netflix.com/es/signup', ['netflix.com']);
  assert.equal(result.safe, true);
  assert.equal(result.hostname, 'www.netflix.com');
});

test('AffiliateDestinationValidator accepts an affiliate-configured URL when its host is allowlisted', () => {
  // Stands in for a resolved AffiliateProgram.attribution.secretRef value at request time.
  const safe = isAllowedAffiliateDestination('https://www.netflix.com/signup?utm_source=guiatv&tag=aff123', ['netflix.com']);
  assert.equal(safe, true);
});

test('AffiliateDestinationValidator rejects a non-https destination', () => {
  const result = validateAffiliateDestination('http://www.netflix.com/es/signup', ['netflix.com']);
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'non_https_protocol');
});

test('AffiliateDestinationValidator rejects a javascript: URL', () => {
  const result = validateAffiliateDestination('javascript:alert(1)', ['netflix.com']);
  assert.equal(result.safe, false);
});

test('AffiliateDestinationValidator rejects a host that is not on the allowlist (open-redirect style bypass)', () => {
  const result = validateAffiliateDestination('https://evil.example/steal?next=https://netflix.com', ['netflix.com']);
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'host_not_allowlisted');
});

test('AffiliateDestinationValidator rejects an unparseable URL', () => {
  const result = validateAffiliateDestination('not a url', ['netflix.com']);
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'invalid_url');
});

test('AffiliateDestinationValidator rejects when the allowlist is empty', () => {
  const result = validateAffiliateDestination('https://www.netflix.com/es/signup', []);
  assert.equal(result.safe, false);
  assert.equal(result.reason, 'empty_allowlist');
});

test('AffiliateDestinationValidator allows a subdomain of an allowlisted host but not a lookalike domain', () => {
  assert.equal(isAllowedAffiliateDestination('https://tv.apple.com/es', ['apple.com']), true);
  assert.equal(isAllowedAffiliateDestination('https://not-apple.com/es', ['apple.com']), false);
  assert.equal(isAllowedAffiliateDestination('https://appleocom.evil/es', ['apple.com']), false);
});
