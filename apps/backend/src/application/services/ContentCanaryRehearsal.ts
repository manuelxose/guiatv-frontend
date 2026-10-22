/**
 * Phase 3C: rehearses the whole write-canary lifecycle against a SCRATCH database, with the real
 * ingestion (admitted scope), the real certification service and the real public read, then rolls it
 * back. Refuses any database that is not named like a throwaway one. The owner key is ephemeral:
 * a rehearsal proves the mechanism, never an authorisation.
 *
 * Every step is compared with a baseline of the whole database (collections, indexes, counts), so
 * "the canary writes this and nothing else" is a measured fact, not a claim.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { canonicalJson, sha256, signOwnerAuthorization } from '@/domain/services/contentCertification';
import { ContentIdentityIngestion, IdentityObservation } from './ContentIdentityIngestion';
import { ContentIdentityService } from './ContentIdentityService';
import { buildCanaryAllowlist, ContentCertificationService, createCertificationReader, ReviewEvidence } from './ContentCertification';
import { authorizationTemplate, CanaryManifest, manifestProblems } from './ContentCanaryManifest';
import type { EvidenceVerdict } from './ContentIdentityEvidence';
import { EntityPublicReadPolicy } from './EntityPublicReadPolicy';
import { PublicContentEntityService } from './PublicContentEntityService';
import { rollbackProvisional } from './ContentIdentityRollback';
import { ensureMongoCollectionsAndIndexes } from '@/infrastructure/database/initializeMongoCollections';
import {
  MongoAiringEntityRefWriter, MongoContentAttestationRepository, MongoContentEntityRepository, MongoContentSlugRepository,
  MongoContentTitleKeyRepository, MongoIdentityEvidenceSource,
} from '@/infrastructure/repositories/MongoContentIdentityRepositories';

export const SCRATCH_DB = /^guiatv_(test|scratch|rehearsal)_[A-Za-z0-9_]+$/;

export interface Baseline { collections: Record<string, { documents: number; indexes: number }>; digest: string }

/** `exact: false` uses collection metadata for counts (instant, approximate): the read-only production baseline. */
export async function captureBaseline(db: mongoose.mongo.Db, exact = true): Promise<Baseline> {
  const collections: Baseline['collections'] = {};
  for (const { name } of (await db.listCollections().toArray()).sort((a, b) => a.name.localeCompare(b.name))) {
    collections[name] = { documents: exact ? await db.collection(name).countDocuments() : await db.collection(name).estimatedDocumentCount(), indexes: (await db.collection(name).indexes()).length };
  }
  return { collections, digest: sha256(canonicalJson(collections)) };
}

/**
 * Collections whose document or index count differs, with before and after; a created or dropped collection counts.
 * `structural` is for a live database: other collections' document counts move with normal traffic, so only
 * the collection set, every index count and the `content_*` documents are compared.
 */
export function diffBaselines(a: Baseline, b: Baseline, structural = false) {
  const out: Record<string, { documents: [number, number]; indexes: [number, number] }> = {};
  for (const name of new Set([...Object.keys(a.collections), ...Object.keys(b.collections)])) {
    const x = a.collections[name] ?? { documents: 0, indexes: 0 };
    const y = b.collections[name] ?? { documents: 0, indexes: 0 };
    const countsMatter = !structural || name.startsWith('content_');
    if ((countsMatter && x.documents !== y.documents) || x.indexes !== y.indexes || !a.collections[name] !== !b.collections[name]) out[name] = { documents: [x.documents, y.documents], indexes: [x.indexes, y.indexes] };
  }
  return out;
}

export interface RehearsalCheck { step: string; ok: boolean; detail: string }

export interface RehearsalInput {
  manifest: CanaryManifest;
  verdicts: ReadonlyMap<string, EvidenceVerdict>;
  review: ReviewEvidence;
  /** Admission-eligible films outside the batch: present in the day's airings, never written. */
  noise: Array<{ candidateId: string; title: string }>;
  now?: Date;
  /**
   * Phase 3D: runs against the certified, served batch before it is revoked (catalogue enrichment, broadcasts,
   * quality). It adds its own checks and artefact, and must leave the scratch database as it found it, apart
   * from changes the rollback removes, so the closing baseline comparison still holds.
   */
  afterServed?: (ctx: RehearsalContext) => Promise<{ checks: RehearsalCheck[]; artefact: unknown }>;
}

export interface RehearsalContext {
  db: mongoose.mongo.Db;
  manifest: CanaryManifest;
  now: Date;
  entities: MongoContentEntityRepository;
  certify: ContentCertificationService;
  /** `movie:<id>` to the stored entity id. */
  entityIds: ReadonlyMap<string, string>;
  baseline: () => Promise<Baseline>;
}

function observation(candidateId: string, title: string, seq: number, mediaId: string): IdentityObservation {
  const [, , tmdbRef, year] = candidateId.split('|');
  return { airingId: `rehearsal-${seq}`, title, editorialCategory: 'Cine', tmdbId: Number(tmdbRef.split(':')[1]), mediaId, ...(year ? { year: Number(year) } : {}), minutes: 100 };
}

export async function rehearseWriteCanary(input: RehearsalInput) {
  const db = mongoose.connection.db;
  if (!db || !SCRATCH_DB.test(db.databaseName)) throw new Error(`rehearsal refuses database "${db?.databaseName}": it must be a throwaway database (guiatv_scratch_*, guiatv_rehearsal_* or guiatv_test_*)`);
  const now = input.now ?? new Date();
  const checks: RehearsalCheck[] = [];
  const check = (step: string, ok: boolean, detail: string) => { checks.push({ step, ok, detail }); };
  const before = { CONTENT_ENTITIES_ENABLED: process.env.CONTENT_ENTITIES_ENABLED, CONTENT_OWNER_PUBLIC_KEY_FILE: process.env.CONTENT_OWNER_PUBLIC_KEY_FILE };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-rehearsal-'));
  const N = input.manifest.entities.length;
  try {
    const problems = manifestProblems(input.manifest, now);
    check('manifest valid', problems.length === 0, problems.join(',') || `${N} entities, digest ${input.manifest.digest.slice(0, 12)}`);
    await db.dropDatabase();
    // Production already has the application collections; start from that state, flag off.
    delete process.env.CONTENT_ENTITIES_ENABLED;
    await ensureMongoCollectionsAndIndexes();
    const empty = await captureBaseline(db);
    process.env.CONTENT_ENTITIES_ENABLED = 'true';
    await ensureMongoCollectionsAndIndexes();
    const afterBoot = await captureBaseline(db);
    const boot = diffBaselines(empty, afterBoot);
    check('enabling the flag only creates the empty identity collections', Object.keys(boot).every((n) => n.startsWith('content_')) && Object.values(boot).every((d) => d.documents[1] === 0), Object.keys(boot).join(','));

    // Legacy evidence: the catalogue rows the production run reads (title + TMDB work) for the batch and the noise.
    const items = [...input.manifest.entities.map((e) => ({ candidateId: e.candidateId, title: e.title })), ...input.noise];
    const media = items.map(() => new mongoose.Types.ObjectId());
    await db.collection('media_catalog').insertMany(items.map((it, i) => {
      const [, , tmdbRef, year] = it.candidateId.split('|');
      return { _id: media[i], tmdbId: Number(tmdbRef.split(':')[1]), tmdbType: tmdbRef.split(':')[0], title: it.title, year: year || undefined, contentType: 'movie', normalizedTitle: it.title.toLowerCase(), normalizedIdentity: it.title.toLowerCase(), metadataSource: 'tmdb' };
    }));
    const observations = items.map((it, i) => observation(it.candidateId, it.title, i, String(media[i])));
    const seeded = await captureBaseline(db);

    const entities = new MongoContentEntityRepository();
    const slugs = new MongoContentSlugRepository();
    const titleKeys = new MongoContentTitleKeyRepository();
    const attestations = new MongoContentAttestationRepository();
    const identity = new ContentIdentityService(entities, slugs, titleKeys, 'canary');
    const ports = { entities, slugs, titleKeys, evidence: new MongoIdentityEvidenceSource(), airingRefs: new MongoAiringEntityRefWriter() };
    const admit = new Set(input.manifest.entities.map((e) => e.candidateId));
    const run = (mode: 'shadow' | 'write', day: string) => new ContentIdentityIngestion(ports, identity, { mode, airingRefs: false, maxCreates: N, actor: 'canary', admit, scope: 'admitted' }).run(day, observations);

    // 1. Dry run (shadow) writes nothing.
    await run('shadow', '20261022');
    const afterShadow = await captureBaseline(db);
    check('dry run writes nothing', afterShadow.digest === seeded.digest, `baseline ${afterShadow.digest.slice(0, 12)}`);

    // 2. Write run: exactly the batch.
    const report = await run('write', '20261022');
    const afterWrite = await captureBaseline(db);
    const delta = diffBaselines(seeded, afterWrite);
    const docs = (n: string) => (delta[n]?.documents[1] ?? 0) - (delta[n]?.documents[0] ?? 0);
    check('write run creates exactly the batch', report.writes.entities === N && docs('content_entities') === N && docs('content_slugs') === N && docs('content_title_keys') === N, `entities ${docs('content_entities')}, slugs ${docs('content_slugs')}, title keys ${docs('content_title_keys')} of ${N}`);
    check('nothing outside content_entities/slugs/title_keys changed', Object.keys(delta).every((n) => ['content_entities', 'content_slugs', 'content_title_keys'].includes(n)), Object.keys(delta).join(','));
    check('noise is out of scope', (report.reasons.out_of_scope ?? 0) === input.noise.length, `out_of_scope ${report.reasons.out_of_scope ?? 0} of ${input.noise.length}`);
    const stored = await mongoose.connection.collection('content_entities').find({}).toArray();
    check('every stored entity is a provisional candidate with the assurance marker', stored.length === N && stored.every((e) => e.status === 'candidate' && e.matching.assurance === 'independently_supported' && e.indexability.state === 'noindex'), `${stored.length} stored`);
    const paths = new Map(stored.map((e) => [`${e.externalIds.tmdb.type}:${e.externalIds.tmdb.id}`, e.canonicalPath]));
    check('stored canonical paths equal the manifest', input.manifest.entities.every((e) => paths.get(`${e.tmdb.type}:${e.tmdb.id}`) === e.canonicalPath), `${paths.size} paths`);

    // 3. Idempotency: replay the same day and the next one.
    await run('write', '20261022');
    await run('write', '20261023');
    check('idempotent: replays change nothing', (await captureBaseline(db)).digest === afterWrite.digest, 'two replays');

    // 4. Certification with an ephemeral owner key.
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const keyFile = path.join(dir, 'owner-public.pem');
    fs.writeFileSync(keyFile, publicPem);
    process.env.CONTENT_OWNER_PUBLIC_KEY_FILE = keyFile;
    const authorization = signOwnerAuthorization(authorizationTemplate(input.manifest, {
      owner: 'manuelxose', now: new Date(now.getTime() - 60_000), executeDays: 1, validDays: 30, id: 'oa_0000000000000000', statement: 'REHEARSAL ONLY: ephemeral key, scratch database.',
    }), privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());
    const certify = new ContentCertificationService(entities, slugs, attestations, { ownerPublicKeyPem: publicPem, now: () => now, actor: 'rehearsal' });
    const reader = new PublicContentEntityService(identity, createCertificationReader(attestations, () => publicPem, () => now));
    const premature = await buildCanaryAllowlist(input.manifest, { entities, certification: certify, reader }, 'manuelxose', now);
    check('no allowlist exists for an uncertified batch', premature.allowlist === null && premature.refused.length === N && premature.refused.every((r) => r.reason === 'certification_none'), `${premature.refused.length} refusals`);
    const byTmdb = new Map(stored.map((e) => [`${e.externalIds.tmdb.type}:${e.externalIds.tmdb.id}`, e.entityId as string]));
    const request = (e: CanaryManifest['entities'][number]) => ({ entityId: byTmdb.get(`${e.tmdb.type}:${e.tmdb.id}`)!, verdict: input.verdicts.get(e.candidateId)!, review: input.review, authorization });
    const dry: string[] = [];
    for (const e of input.manifest.entities) dry.push(...(await certify.check(request(e))));
    check('certification dry run has no refusal reason', dry.length === 0, dry.join(',') || 'all clear');
    check('certification dry run writes nothing', (await captureBaseline(db)).digest === afterWrite.digest, 'baseline unchanged');
    for (const e of input.manifest.entities) await certify.certify(request(e));
    const certified = await captureBaseline(db);
    check('certification adds only attestation records', Object.keys(diffBaselines(afterWrite, certified)).every((n) => n === 'content_attestations') && certified.collections.content_attestations.documents === N, `${certified.collections.content_attestations.documents} attestations`);
    for (const e of input.manifest.entities) await certify.certify(request(e));
    check('idempotent: re-certification changes nothing', (await captureBaseline(db)).digest === certified.digest, 'second pass');

    // 5. Public read through the canary policy: the batch is served, a stranger is not.
    const allowlist = path.join(dir, 'canary.json');
    const built = await buildCanaryAllowlist(input.manifest, { entities, certification: certify, reader }, 'manuelxose', now);
    check('the allowlist builder accepts the certified batch', built.allowlist?.entities.length === N, built.refused.map((r) => `${r.candidateId}:${r.reason}`).join(',') || `${N} entries`);
    fs.writeFileSync(allowlist, JSON.stringify(built.allowlist ?? { version: 1, entities: [] }));
    const policy = new EntityPublicReadPolicy({ env: { CONTENT_ENTITY_PUBLIC_READ_ENABLED: 'true', CONTENT_ENTITY_PUBLIC_READ_SCOPE: 'canary', CONTENT_ENTITY_CANARY_FILE: allowlist, CONTENT_ENTITY_CANARY_MAX: String(N) } as NodeJS.ProcessEnv, now: () => now.getTime() });
    const served: string[] = [];
    for (const e of input.manifest.entities) {
      const d = policy.decide(e.canonicalPath);
      const r = await reader.resolve(e.canonicalPath);
      if (d.action === 'entity' && r.status === 'canonical') served.push(e.canonicalPath);
    }
    check('the whole batch is served by the canary policy', served.length === N, `${served.length}/${N}`);
    const stranger = input.noise[0] ? `/peliculas/${input.noise[0].title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '/peliculas/no-existe';
    check('a path outside the batch is not served', policy.decide(stranger).action === 'legacy' && (await reader.resolve(stranger)).status === 'not_found', stranger);

    // 5b. Phase 3D (optional): enrichment, broadcasts and quality on the served batch.
    let phase3d: { checks: RehearsalCheck[]; artefact: unknown } | undefined;
    if (input.afterServed) {
      const beforeHook = await captureBaseline(db);
      phase3d = await input.afterServed({ db, manifest: input.manifest, now, entities, certify, entityIds: byTmdb, baseline: () => captureBaseline(db) });
      checks.push(...phase3d.checks);
      check('the phase 3D step leaves the database as it found it', (await captureBaseline(db)).digest === beforeHook.digest, 'baseline unchanged');
    }

    // 6. Revocation and rollback.
    for (const e of input.manifest.entities) await certify.revoke(byTmdb.get(`${e.tmdb.type}:${e.tmdb.id}`)!, 'Rehearsal Operator', 'rehearsal rollback');
    const unserved = (await Promise.all(input.manifest.entities.map((e) => reader.resolve(e.canonicalPath)))).filter((r) => r.status !== 'not_found').length;
    check('revoked: nothing is served', unserved === 0, `${unserved} still served`);
    const rolled = await rollbackProvisional({ apply: true, entityIds: [...byTmdb.values()] });
    const final = await captureBaseline(db);
    const rest = diffBaselines(seeded, final);
    check('rollback removes the batch', rolled.removed.entities === N && final.collections.content_entities.documents === 0 && final.collections.content_slugs.documents === 0 && final.collections.content_title_keys.documents === 0, JSON.stringify(rolled.removed));
    check('rollback leaves only the audit trail', Object.keys(rest).length === 1 && rest.content_attestations?.documents[1] === 2 * N, `content_attestations ${final.collections.content_attestations.documents} (${N} attestations + ${N} revocations)`);
    return { database: db.databaseName, batch: N, ok: checks.every((c) => c.ok), checks, baselines: { empty: empty.digest, seeded: seeded.digest, afterWrite: afterWrite.digest, certified: certified.digest, final: final.digest }, bootCreates: boot, ...(phase3d ? { phase3d: phase3d.artefact } : {}) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    for (const [k, v] of Object.entries(before)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
}
