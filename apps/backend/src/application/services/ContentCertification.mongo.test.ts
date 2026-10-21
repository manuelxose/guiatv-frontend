/**
 * Phase 3C lifecycle on a throwaway MongoDB database (`guiatv_test_3c_<pid>`, dropped after):
 * certification, idempotency, revocation, crash recovery, conflict, tamper, expiry, public reads.
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27119 npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import { ContentAttestationModel } from '@/infrastructure/database/models/ContentAttestation.model';
import { ContentEntityModel } from '@/infrastructure/database/models/ContentEntity.model';
import {
  MongoContentAttestationRepository, MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository,
} from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import type { AttestationRecord } from '@/domain/services/contentCertification';
import { mayBeIndexable } from '@/domain/services/contentIdentity';
import { ContentIdentityService } from './ContentIdentityService';
import { PublicContentEntityService } from './PublicContentEntityService';
import { ContentCertificationService, createCertificationReader } from './ContentCertification';
import { grant, NOW, ownerKeys, reviewFor, verdictFor } from './ContentCertification.fixtures';

const keys = ownerKeys();
const entities = new MongoContentEntityRepository();
const slugs = new MongoContentSlugRepository();
const attestations = new MongoContentAttestationRepository();
const identity = new ContentIdentityService(entities, slugs, new MongoContentTitleKeyRepository());
let clock = NOW;
const now = () => clock;
const service = (over: Partial<ConstructorParameters<typeof ContentCertificationService>[3]> = {}, repo = entities) =>
  new ContentCertificationService(repo, slugs, attestations, { ownerPublicKeyPem: keys.publicPem, now, ...over });
const reader = createCertificationReader(attestations, () => keys.publicPem, now);
const publicRead = new PublicContentEntityService(identity, reader);

let n = 0;
/** A candidate exactly as the admission gate stores it, plus the verdict, ledger and grant that cover it. */
async function seed(title = `pelicula_${++n}`) {
  const tmdbId = 5000 + n;
  const v = verdictFor(title, tmdbId);
  const { entity } = await identity.createEntity({
    title, normalizedTitle: title, kind: 'movie', year: 2001, externalIds: { tmdb: { type: 'movie', id: tmdbId } },
    matching: { method: 'tmdb_exact', confidence: 0.9, decidedAt: NOW, decidedBy: 'ingest', assurance: 'independently_supported' },
  }, [v.path!]);
  const review = reviewFor([v.candidateId]);
  return { entity, v, review, authorization: grant(keys, [v], {}, `oa_${String(n).padStart(16, '0')}`), req: (over = {}) => ({ entityId: entity.entityId, verdict: v, review, authorization: grant(keys, [v], {}, `oa_${String(n).padStart(16, '0')}`), ...over }) };
}
const records = (entityId: string) => attestations.listForEntity(entityId);

test('3C lifecycle on scratch MongoDB', { skip: !process.env.TEST_MONGO_URI }, async (t) => {
  const dbName = `guiatv_test_3c_${process.pid}`;
  const previous = process.env.CONTENT_ENTITIES_ENABLED;
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName });
  try {
    assert.ok(dbName.startsWith('guiatv_test_'));
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await mongoose.connection.dropDatabase();
    await ensureMongoCollectionsAndIndexes();

    await t.test('certify: candidate -> active/ai_attested, pinned, audited, readable, never indexable, never "verified by a person"', async () => {
      const s = await seed();
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'not_found', 'a candidate is never public');
      assert.deepEqual(await service().check(s.req()), [], 'dry run: no reasons');
      assert.equal(await ContentEntityModel.countDocuments({ certification: { $exists: true } }), 0, 'the dry run wrote nothing');
      const r = await service().certify(s.req());
      assert.equal(r.outcome, 'certified');
      const e = (await entities.findById(s.entity.entityId))!;
      assert.equal(e.status, 'active');
      assert.equal(e.matching.method, 'ai_attested');
      assert.equal(e.matching.decidedBy, `attestation:${r.attestation.body.attestationId}`);
      assert.equal(e.matching.assurance, 'independently_supported');
      assert.equal(e.certification?.hash, r.attestation.hash);
      assert.equal(e.indexability.state, 'noindex');
      assert.equal(mayBeIndexable(e), false);
      assert.equal(r.attestation.body.type === 'attestation' && r.attestation.body.reviewBasis, 'ai');
      assert.equal(r.attestation.body.type === 'attestation' && r.attestation.body.review.reviewers.every((x) => x.kind === 'ai'), true);
      await assert.rejects(identity.verifyEntity(e.entityId, 'AI Sonnet 5.5 A', 'x'), /reviewer_required/);
      await assert.rejects(identity.verifyEntity(e.entityId, 'manuelxose', 'x'), /invalid_transition/, 'a certified entity is not a candidate for manual verification');
      const read = await publicRead.resolve(s.v.path!);
      assert.equal(read.status, 'canonical');
      assert.equal((await service().stateOf(e)).state, 'certified');
    });

    await t.test('idempotent: a replay changes nothing; another grant over a certified entity is refused', async () => {
      const s = await seed();
      const first = await service().certify(s.req());
      const version = (await entities.findById(s.entity.entityId))!.version;
      const again = await service().certify(s.req());
      assert.equal(again.outcome, 'already_certified');
      assert.equal(again.attestation.hash, first.attestation.hash);
      assert.equal((await records(s.entity.entityId)).length, 1);
      assert.equal((await entities.findById(s.entity.entityId))!.version, version);
      await assert.rejects(service().certify(s.req({ authorization: grant(keys, [s.v], {}, 'oa_ffffffffffffffff') })), /already_certified/);
    });

    await t.test('refusals leave no trace: nothing is stored when any reason applies', async () => {
      const s = await seed();
      const bad = verdictFor(s.v.key, 5000 + n, { contradictions: ['tmdb_conflict'] });
      await assert.rejects(service().certify(s.req({ verdict: bad, authorization: grant(keys, [bad]) })), /certification_refused.*verdict_contradictions/);
      await assert.rejects(service().certify(s.req({ review: reviewFor([s.v.candidateId], { second: false }) })), /review_second_missing/);
      await assert.rejects(service().certify(s.req({ authorization: grant(ownerKeys(), [s.v]) })), /authorization_signature/);
      await assert.rejects(service({ ownerPublicKeyPem: undefined }).certify(s.req()), /authorization_signature/);
      assert.equal((await records(s.entity.entityId)).length, 0);
      assert.equal((await entities.findById(s.entity.entityId))!.status, 'candidate');
    });

    await t.test('ambiguous canonical ownership is refused: the registry must say this entity owns the path', async () => {
      const s = await seed();
      // The registry is insert-only, so another owner can only appear through corruption; certification must see it.
      await mongoose.connection.collection('content_slugs').updateOne({ _id: s.v.path as never }, { $set: { entityId: 'ce_01ZZZZZZZZZZZZZZZZZZZZZZZZ' } });
      await assert.rejects(service().certify(s.req()), /canonical_(ownership_ambiguous|registry_mismatch)/);
      assert.equal((await records(s.entity.entityId)).length, 0);
    });

    await t.test('revocation: back to candidate, read fails closed at once, history kept, same grant cannot re-certify, a new one can', async () => {
      const s = await seed();
      await service().certify(s.req());
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'canonical');
      await assert.rejects(service().revoke(s.entity.entityId, 'claude', 'wrong work'), /reviewer_required/, 'a named person, not an automation name');
      await assert.rejects(service().revoke(s.entity.entityId, 'Ana García', 'x'), /reason_required/);
      const r = await service().revoke(s.entity.entityId, 'Ana García', 'wrong work found in review');
      assert.equal(r.outcome, 'revoked');
      assert.equal(r.entity.status, 'candidate');
      assert.equal(r.entity.certification, undefined);
      assert.equal(r.entity.matching.method, 'tmdb_exact');
      assert.equal(r.entity.matching.decidedBy, 'ingest');
      assert.equal(r.entity.matching.assurance, 'independently_supported');
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'not_found');
      assert.equal((await service().revoke(s.entity.entityId, 'Ana García', 'again')).outcome, 'already_revoked');
      assert.deepEqual((await records(s.entity.entityId)).map((x) => x.body.type), ['attestation', 'revocation']);
      await assert.rejects(service().certify(s.req()), /certification_revoked/);
      const re = await service().certify(s.req({ authorization: grant(keys, [s.v], {}, 'oa_aaaaaaaaaaaaaaaa') }));
      assert.equal(re.outcome, 'certified');
      assert.deepEqual((await records(s.entity.entityId)).map((x) => `${x.seq}:${x.body.type}`), ['0:attestation', '1:revocation', '2:attestation']);
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'canonical');
    });

    await t.test('a certified entity cannot be merged or removed without revoking first', async () => {
      const s = await seed();
      await service().certify(s.req());
      await assert.rejects(identity.transition(s.entity.entityId, 'removed', { reason: 'x' }), /certified_entity/);
      await service().revoke(s.entity.entityId, 'Ana García', 'withdrawn by the owner');
      assert.equal((await identity.transition(s.entity.entityId, 'removed', { reason: 'withdrawn' })).status, 'removed');
    });

    await t.test('crash after the attestation, before the promotion: pending serves nothing, the same call finishes it', async () => {
      const s = await seed();
      const flaky = Object.create(entities) as MongoContentEntityRepository;
      flaky.certify = async () => { throw new Error('connection lost'); };
      await assert.rejects(service({}, flaky).certify(s.req()), /connection lost/);
      const e = (await entities.findById(s.entity.entityId))!;
      assert.equal(e.status, 'candidate');
      assert.equal((await records(s.entity.entityId)).length, 1);
      assert.equal((await service().stateOf(e)).state, 'pending');
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'not_found');
      const r = await service().certify(s.req());
      assert.equal(r.outcome, 'certified');
      assert.equal((await records(s.entity.entityId)).length, 1, 'the stored attestation is reused, not duplicated');
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'canonical');
      // pending under another grant is a conflict, not a silent second attestation
      const t2 = await seed();
      await assert.rejects(service({}, flaky).certify(t2.req()), /connection lost/);
      await assert.rejects(service().certify(t2.req({ authorization: grant(keys, [t2.v], {}, 'oa_bbbbbbbbbbbbbbbb') })), /certification_pending/);
    });

    await t.test('crash after the revocation record, before the demotion: reads already fail closed; revoke again finishes', async () => {
      const s = await seed();
      await service().certify(s.req());
      const flaky = Object.create(entities) as MongoContentEntityRepository;
      flaky.revokeCertification = async () => { throw new Error('connection lost'); };
      await assert.rejects(service({}, flaky).revoke(s.entity.entityId, 'Ana García', 'operator error found'), /connection lost/);
      assert.equal((await entities.findById(s.entity.entityId))!.status, 'active', 'still pinned');
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'not_found', 'but not served: the chain says revoked');
      const r = await service().revoke(s.entity.entityId, 'Ana García', 'operator error found');
      assert.equal(r.outcome, 'revoked');
      assert.equal(r.entity.status, 'candidate');
      assert.equal((await records(s.entity.entityId)).length, 2);
    });

    await t.test('concurrent certification: one attestation, no duplicate, no lost update', async () => {
      const s = await seed();
      const results = await Promise.allSettled([service().certify(s.req()), service().certify(s.req()), service().certify(s.req())]);
      const ok = results.filter((r) => r.status === 'fulfilled');
      assert.ok(ok.length >= 1);
      for (const r of results) if (r.status === 'rejected') assert.match(String(r.reason), /concurrent_modification|certification_pending/);
      assert.equal((await records(s.entity.entityId)).length, 1);
      assert.equal((await entities.findById(s.entity.entityId))!.status, 'active');
      // and the loser can simply try again
      assert.equal((await service().certify(s.req())).outcome, 'already_certified');
    });

    await t.test('tamper, expiry, key loss and a moved path all fail closed on the next read', async () => {
      const s = await seed();
      await service().certify(s.req());
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'canonical');
      // key not configured
      const noKey = new PublicContentEntityService(identity, createCertificationReader(attestations, () => undefined, now));
      assert.equal((await noKey.resolve(s.v.path!)).status, 'not_found');
      // a service built without a certification reader never serves an AI-attested entity
      assert.equal((await new PublicContentEntityService(identity).resolve(s.v.path!)).status, 'not_found');
      // expired
      const expired = new PublicContentEntityService(identity, createCertificationReader(attestations, () => keys.publicPem, () => new Date('2027-01-01T00:00:00Z')));
      assert.equal((await expired.resolve(s.v.path!)).status, 'not_found');
      // tampered record (the collection has no update path in code; this is a hand edit)
      const before = await ContentAttestationModel.collection.findOne({ entityId: s.entity.entityId });
      await ContentAttestationModel.collection.updateOne({ entityId: s.entity.entityId }, { $set: { 'body.validUntil': '2999-01-01T00:00:00Z' } });
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'not_found');
      await ContentAttestationModel.collection.replaceOne({ entityId: s.entity.entityId }, before!);
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'canonical', 'restored');
      // the pin edited by hand
      await ContentEntityModel.collection.updateOne({ entityId: s.entity.entityId }, { $set: { 'certification.seq': 7 } });
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'not_found');
      await ContentEntityModel.collection.updateOne({ entityId: s.entity.entityId }, { $set: { 'certification.seq': 0 } });
      assert.equal((await publicRead.resolve(s.v.path!)).status, 'canonical');
    });

    await t.test('the audit collection is insert-only: no row can be overwritten through the repository', async () => {
      const s = await seed();
      const first = await service().certify(s.req());
      const forged: AttestationRecord = { ...first.attestation, hash: 'a'.repeat(64) };
      const res = await attestations.insert(forged);
      assert.equal(res.inserted, false);
      assert.equal((await records(s.entity.entityId))[0].hash, first.attestation.hash);
      assert.equal(typeof (attestations as unknown as Record<string, unknown>).update, 'undefined');
      assert.equal(typeof (attestations as unknown as Record<string, unknown>).delete, 'undefined');
    });
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (previous === undefined) delete process.env.CONTENT_ENTITIES_ENABLED; else process.env.CONTENT_ENTITIES_ENABLED = previous;
  }
});
