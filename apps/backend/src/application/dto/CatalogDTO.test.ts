import assert from 'node:assert/strict';
import test from 'node:test';
import { CATALOG_PLATFORM_NAME_MAP } from './CatalogDTO';

test('HBO Max resolves by its current name and by the pre-rebrand "Max"', () => {
  assert.equal(CATALOG_PLATFORM_NAME_MAP.get('hbo max')?.key, 'max');
  assert.equal(CATALOG_PLATFORM_NAME_MAP.get('max')?.name, 'HBO Max');
});
