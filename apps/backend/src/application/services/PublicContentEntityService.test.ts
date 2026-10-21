import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicContentEntityService } from './PublicContentEntityService';
import type { ContentEntityRecord } from '@/domain/repositories/IContentIdentityRepository';

const entity = {
  entityId: 'entity-1', kind: 'movie', title: 'Película', canonicalPath: '/peliculas/pelicula',
  status: 'active', matching: { method: 'manual', decidedBy: 'Ana García' },
  lifecycle: { changedBy: 'Ana García' },
  metadata: { synopsis: { value: 'Sinopsis', source: 'editorial' } },
  externalIds: { tmdb: { id: 42 } }, indexability: { state: 'noindex' },
} as unknown as ContentEntityRecord;

test('public entity reads whitelist fields and require a named manual review', async () => {
  let record = entity;
  const service = new PublicContentEntityService({ resolvePath: async () => ({ status: 'canonical', entity: record }) });
  assert.deepEqual(await service.resolve('/peliculas/pelicula'), {
    status: 'canonical', entity: { entityId: 'entity-1', kind: 'movie', title: 'Película', canonicalPath: '/peliculas/pelicula', synopsis: 'Sinopsis' },
  });
  for (const decidedBy of ['system', '', 'codex']) {
    record = { ...entity, matching: { ...entity.matching, decidedBy } };
    assert.deepEqual(await service.resolve('/peliculas/pelicula'), { status: 'not_found' });
  }
  record = { ...entity, matching: { ...entity.matching, method: 'tmdb' as never } };
  assert.deepEqual(await service.resolve('/peliculas/pelicula'), { status: 'not_found' });
  record = { ...entity, lifecycle: undefined };
  assert.deepEqual(await service.resolve('/peliculas/pelicula'), { status: 'not_found' });
});

test('redirect target must itself resolve to the same verified canonical entity', async () => {
  const service = new PublicContentEntityService({ resolvePath: async (path) => path === '/peliculas/old'
    ? { status: 'redirect', location: entity.canonicalPath!, entityId: entity.entityId }
    : { status: 'canonical', entity } });
  assert.equal((await service.resolve('/peliculas/old')).status, 'redirect');
  const broken = new PublicContentEntityService({ resolvePath: async () => ({ status: 'redirect', location: '/peliculas/loop', entityId: 'other' }) });
  assert.equal((await broken.resolve('/peliculas/old')).status, 'integrity_error');
});
