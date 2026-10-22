/**
 * Phase 3C: certification of owner-authorised AI-reviewed identities. No HTTP endpoint exists for
 * any of this; run it on the server shell (database commands) or anywhere (offline commands).
 *
 * Offline (no database):
 *   node dist/scripts/content-certify.js owner-keygen <dir>                  the OWNER runs this on their own machine; the private key never leaves it
 *   node dist/scripts/content-certify.js manifest --day <traces>:<verdicts> [--day …] --ledger <ledger.jsonl> --sheet <sheet.csv>
 *       [--probe <probes.json>] [--tmdb <tmdb-checks.json> …] [--size N] [--allow-indexed-legacy] [--evidence-produced YYYYMMDD] [--warning <text> …] [--out manifest.json] [--admit-out admit.jsonl] [--pool-out pool.json] [--now ISO]
 *                                                                           builds the bounded canary manifest (≤ 25) and the admit file
 *   node dist/scripts/content-certify.js authorize --manifest <m.json> --private-key <owner-private.pem> --owner <name> --statement <text>
 *       [--id oa_…] [--execute-days 7] [--valid-days 30] --out <authorization.json>        OWNER ONLY: signs exactly this manifest
 *   node dist/scripts/content-certify.js verify --manifest <m.json> --authorization <a.json> --public-key <owner-public.pem> [--admit <admit.jsonl>]
 *
 * Database (read-only unless --apply / revoke):
 *   node dist/scripts/content-certify.js certify --manifest … --authorization … --admit … --ledger … --sheet … [--apply]
 *                                                                           dry run by default: every refusal reason per identity, no write
 *   node dist/scripts/content-certify.js status --manifest <m.json>         state of every manifest identity (reads)
 *   node dist/scripts/content-certify.js revoke <entityId> --by <name> --reason <text>
 *   node dist/scripts/content-certify.js revoke-batch --manifest <m.json> --by <name> --reason <text>
 *   node dist/scripts/content-certify.js rollback-batch --manifest <m.json> [--apply]   removes the batch's provisional candidates (revoke first)
 *   node dist/scripts/content-certify.js baseline [--out before.json] [--compare before.json [--structural]] [--exact]
 *                                                                           collections, indexes and document counts of the connected database (reads, estimated counts unless --exact);
 *                                                                           with --compare prints exactly what changed since (--structural: ignores other collections' traffic-driven counts); exit 2 if anything did
 *   node dist/scripts/content-certify.js allowlist --manifest <m.json> --approved-by <person> --out <canary.json>
 *                                                                           the CONTENT_ENTITY_CANARY_FILE for a fully certified batch (reads only; all or nothing). Writing flags stays a separate approval
 *   node dist/scripts/content-certify.js rehearse --manifest … --day … --ledger … --sheet …   SCRATCH database only (guiatv_scratch_*): the full lifecycle, measured
 *       [--phase3d <fixtures dir> [--phase3d-out <dir>]]                    also enriches the batch from fixtures, joins broadcasts and writes the per-film quality report
 *
 * Phase 3D (metadata enrichment and the per-film report; the copy is validated against the media catalogue, never invented):
 *   node dist/scripts/content-certify.js enrich --manifest <m.json> [--apply] [--refresh-catalogue] [--force] [--invalidate]   (--invalidate is also a dry run until --apply)
 *                                                                           dry run by default: the plan or refusal reason per film, nothing written. --apply copies the catalogue's TMDB facts
 *                                                                           onto the stored entities (needs the write flags; identity and attestations are untouched). --refresh-catalogue first
 *                                                                           calls TMDB through MediaCatalogService for rows never fully fetched (needs --apply and TMDB_API_KEY). --invalidate withdraws the copy
 *   node dist/scripts/content-certify.js quality-report --manifest <m.json> --legacy <legacy-snapshot.json> [--out <dir>]
 *                                                                           reads only: per film, enrichment, evidence-joined broadcasts, legacy consolidation decision and publication quality
 *
 * `certify --apply` and `revoke*` need CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES=<database name>.
 * `certify` needs CONTENT_OWNER_PUBLIC_KEY_FILE. Everything else runs under the read-only guard.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { authorizationSignatureValid, CERTIFICATION_HARD_CAP, keyIdOf, sha256, SignedOwnerAuthorization, signOwnerAuthorization } from '../domain/services/contentCertification';
import {
  MongoContentAttestationRepository, MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository,
} from '../infrastructure/repositories/MongoContentIdentityRepositories';
import { buildCanaryAllowlist, ContentCertificationService, CertifyRequest, createCertificationReader, loadReviewEvidence, verdictDigest } from '../application/services/ContentCertification';
import {
  admitLines, authorizationTemplate, buildCanaryManifest, CanaryManifest, DayInput, LegacyProbe, manifestProblems,
} from '../application/services/ContentCanaryManifest';
import { PublicContentEntityService } from '../application/services/PublicContentEntityService';
import { ContentIdentityService } from '../application/services/ContentIdentityService';
import { captureBaseline, diffBaselines, rehearseWriteCanary } from '../application/services/ContentCanaryRehearsal';
import { ContentEntityEnrichment, MediaCatalogEnrichmentSource } from '../application/services/ContentEntityEnrichment';
import { enrichmentRehearsal, type EnrichmentFixtures } from '../application/services/ContentEnrichmentRehearsal';
import { EntityBroadcastService } from '../application/services/EntityBroadcastService';
import { filmReport, renderFilmReportMarkdown, summarizeFilmReports, type LegacySnapshot } from '../application/services/ContentEntityReport';
import { MongoMediaCatalogRepository } from '../infrastructure/repositories/MongoMediaCatalogRepository';
import { rollbackProvisional } from '../application/services/ContentIdentityRollback';
import type { EvidenceVerdict, TmdbSearchCheck } from '../application/services/ContentIdentityEvidence';
import type { IdentityTrace } from '../application/services/ContentIdentityIngestion';
import { readContentIdentityFlags } from '../shared/config/contentEntities';
import { installReadOnlyGuard } from './readOnlyGuard';

const option = (args: string[], name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const options = (args: string[], name: string) => args.flatMap((a, i) => (args[i - 1] === name ? [a] : []));
const need = (value: string | undefined, usage: string): string => {
  if (!value) throw new Error(`usage: ${usage}`);
  return value;
};
const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;
const jsonLines = <T>(file: string): T[] => fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l) as T);

function loadDays(args: string[]): DayInput[] {
  return options(args, '--day').map((pair) => {
    const [traces, verdicts] = pair.split(':');
    const day = /(\d{8})/.exec(path.basename(verdicts))?.[1];
    if (!day) throw new Error(`cannot read the day from ${verdicts}: name the verdicts file verdicts-YYYYMMDD.jsonl`);
    return { day, traces: jsonLines<IdentityTrace>(traces).filter((t) => t.candidateId), verdicts: jsonLines<EvidenceVerdict>(verdicts) };
  });
}

const loadReview = (args: string[]) => loadReviewEvidence(
  fs.readFileSync(need(option(args, '--ledger'), '--ledger <ledger.jsonl>'), 'utf8'),
  fs.readFileSync(need(option(args, '--sheet'), '--sheet <sheet.csv>'), 'utf8')
);

function loadAdmitVerdicts(file: string, manifest: CanaryManifest): Map<string, EvidenceVerdict> {
  const lines = jsonLines<EvidenceVerdict>(file);
  const byId = new Map(lines.map((v) => [v.candidateId, v] as const));
  const sameSet = lines.length === manifest.entities.length && manifest.entities.every((e) => byId.has(e.candidateId));
  const sameDigests = manifest.entities.every((e) => byId.get(e.candidateId) && verdictDigest(byId.get(e.candidateId)!) === e.verdictSha256);
  if (!sameSet || !sameDigests) throw new Error('the admit file is not exactly the manifest batch (a line is missing, extra or changed)');
  return byId;
}

function offline(command: string, args: string[]): boolean {
  if (command === 'owner-keygen') {
    const dir = need(args[0], 'owner-keygen <dir>');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'owner-private.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
    fs.writeFileSync(path.join(dir, 'owner-public.pem'), publicPem, { flag: 'wx' });
    console.log(JSON.stringify({ keyId: keyIdOf(publicPem), private: path.join(dir, 'owner-private.pem'), public: path.join(dir, 'owner-public.pem'), note: 'keep the private key off the server and out of the repository; configure only the public key (CONTENT_OWNER_PUBLIC_KEY_FILE)' }, null, 2));
    return true;
  }
  if (command === 'manifest') {
    const probeFile = option(args, '--probe');
    const now = option(args, '--now') ? new Date(option(args, '--now') as string) : new Date();
    const days = loadDays(args);
    if (!days.length) throw new Error('usage: manifest --day <traces.jsonl>:<verdicts-YYYYMMDD.jsonl> [--day …] --ledger … --sheet …');
    const built = buildCanaryManifest({ days, review: loadReview(args), probes: probeFile ? readJson<LegacyProbe[]>(probeFile) : undefined, tmdbChecks: options(args, '--tmdb').flatMap((f) => readJson<TmdbSearchCheck[]>(f)), size: Number(option(args, '--size')) || CERTIFICATION_HARD_CAP, now, allowIndexedLegacy: args.includes('--allow-indexed-legacy'), evidenceProducedDay: option(args, '--evidence-produced'), extraWarnings: options(args, '--warning') });
    const out = option(args, '--out');
    if (out) fs.writeFileSync(out, JSON.stringify(built.manifest, null, 2) + '\n');
    const admit = option(args, '--admit-out');
    if (admit) fs.writeFileSync(admit, admitLines(built.manifest.entities, built.verdicts));
    const poolOut = option(args, '--pool-out');
    if (poolOut) fs.writeFileSync(poolOut, JSON.stringify(built.poolItems.map((p) => ({ candidateId: p.verdict.candidateId, title: p.verdict.title, path: p.verdict.path })), null, 2) + '\n');
    const m = built.manifest;
    console.log(JSON.stringify({ digest: m.digest, selected: m.entities.length, ceiling: m.ceiling, pool: m.pool, notSelected: m.notSelected.length, problems: manifestProblems(m, now) }, null, 2));
    return true;
  }
  if (command === 'authorize') {
    const manifest = readJson<CanaryManifest>(need(option(args, '--manifest'), '--manifest <m.json>'));
    const bad = manifestProblems(manifest, new Date());
    if (bad.length) throw new Error(`refusing to sign a manifest with problems: ${bad.join(', ')}`);
    const now = new Date();
    const payload = authorizationTemplate(manifest, {
      owner: need(option(args, '--owner'), '--owner <name>'), now, executeDays: Number(option(args, '--execute-days')) || 7, validDays: Number(option(args, '--valid-days')) || 30,
      statement: need(option(args, '--statement'), '--statement <the owner\'s own words>'), id: option(args, '--id') ?? `oa_${crypto.randomBytes(8).toString('hex')}`,
    });
    const signed = signOwnerAuthorization(payload, fs.readFileSync(need(option(args, '--private-key'), '--private-key <owner-private.pem>'), 'utf8'));
    fs.writeFileSync(need(option(args, '--out'), '--out <authorization.json>'), JSON.stringify(signed, null, 2) + '\n');
    console.log(JSON.stringify({ authorizationId: payload.authorizationId, keyId: signed.keyId, executeBy: payload.executeBy, items: payload.batch.items.length }));
    return true;
  }
  if (command === 'verify') {
    const manifest = readJson<CanaryManifest>(need(option(args, '--manifest'), '--manifest'));
    const auth = readJson<SignedOwnerAuthorization>(need(option(args, '--authorization'), '--authorization'));
    const problems = [...manifestProblems(manifest, new Date())];
    if (!authorizationSignatureValid(auth, fs.readFileSync(need(option(args, '--public-key'), '--public-key'), 'utf8'))) problems.push('authorization_signature');
    if (auth.payload.batch.manifestDigest !== manifest.digest) problems.push('authorization_for_another_manifest');
    if (Date.now() > Date.parse(auth.payload.executeBy)) problems.push('authorization_expired');
    const admit = option(args, '--admit');
    if (admit && sha256(fs.readFileSync(admit)) !== manifest.admitSha256) problems.push('admit_file_differs');
    console.log(JSON.stringify({ ok: !problems.length, problems }, null, 2));
    process.exitCode = problems.length ? 2 : 0;
    return true;
  }
  return false;
}

async function database(command: string, args: string[]) {
  const writes = command === 'revoke' || command === 'revoke-batch' || ((command === 'certify' || command === 'rollback-batch' || command === 'enrich') && args.includes('--apply'));
  if (command === 'enrich' && args.includes('--refresh-catalogue') && !args.includes('--apply')) throw new Error('--refresh-catalogue calls TMDB and writes the catalogue: it needs --apply');
  const guard = writes || command === 'rehearse' ? null : installReadOnlyGuard();
  await connectMongoDB();
  try {
    const flags = readContentIdentityFlags(process.env, mongoose.connection.db?.databaseName);
    if (writes && !flags.writes) throw new Error('writes need CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES=<database name>');
    const entities = new MongoContentEntityRepository();
    const slugs = new MongoContentSlugRepository();
    const attestations = new MongoContentAttestationRepository();
    const keyFile = process.env.CONTENT_OWNER_PUBLIC_KEY_FILE;
    const ownerPublicKeyPem = keyFile && fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8') : undefined;
    const service = new ContentCertificationService(entities, slugs, attestations, { ownerPublicKeyPem, actor: 'certify-cli' });

    if (command === 'revoke') {
      const r = await service.revoke(need(args[0], 'revoke <entityId> --by <name> --reason <text>'), need(option(args, '--by'), '--by <name>'), need(option(args, '--reason'), '--reason <text>'));
      return console.log(JSON.stringify({ outcome: r.outcome, entityId: r.entity.entityId, status: r.entity.status }));
    }
    if (command === 'baseline') {
      const now = await captureBaseline(mongoose.connection.db!, args.includes('--exact'));
      if (option(args, '--out')) fs.writeFileSync(option(args, '--out') as string, JSON.stringify(now, null, 2) + '\n');
      const before = option(args, '--compare');
      const changed = before ? diffBaselines(readJson(before), now, args.includes('--structural')) : {};
      console.log(JSON.stringify({ database: mongoose.connection.db!.databaseName, collections: Object.keys(now.collections).length, indexes: Object.values(now.collections).reduce((n, c) => n + c.indexes, 0), digest: now.digest, ...(before ? { changed } : {}) }, null, 2));
      process.exitCode = Object.keys(changed).length ? 2 : 0;
      return;
    }
    const manifest = readJson<CanaryManifest>(need(option(args, '--manifest'), '--manifest <m.json>'));
    const idsOf = async () => Promise.all(manifest.entities.map(async (e) => ({ e, entity: await entities.findLiveByTmdb(e.tmdb) })));

    if (command === 'allowlist') {
      const reader = new PublicContentEntityService(new ContentIdentityService(entities, slugs, new MongoContentTitleKeyRepository()), createCertificationReader(attestations, () => ownerPublicKeyPem));
      const built = await buildCanaryAllowlist(manifest, { entities, certification: service, reader }, need(option(args, '--approved-by'), '--approved-by <person>'), new Date());
      if (built.allowlist) fs.writeFileSync(need(option(args, '--out'), '--out <canary.json>'), JSON.stringify(built.allowlist, null, 2) + '\n');
      console.log(JSON.stringify({ written: Boolean(built.allowlist), entries: built.allowlist?.entities.length ?? 0, refused: built.refused }, null, 2));
      process.exitCode = built.allowlist ? 0 : 2;
      return;
    }
    if (command === 'status') {
      const rows = [];
      for (const { e, entity } of await idsOf()) {
        rows.push({ candidateId: e.candidateId, canonicalPath: e.canonicalPath, entityId: entity?.entityId ?? null, status: entity?.status ?? 'not_written', certification: entity ? (await service.stateOf(entity)).state : 'none' });
      }
      return console.log(JSON.stringify({ digest: manifest.digest, rows }, null, 2));
    }
    if (command === 'revoke-batch') {
      const by = need(option(args, '--by'), '--by'); const reason = need(option(args, '--reason'), '--reason');
      const out = [];
      for (const { e, entity } of await idsOf()) {
        if (!entity?.certification) { out.push({ candidateId: e.candidateId, outcome: 'not_certified' }); continue; }
        out.push({ candidateId: e.candidateId, outcome: (await service.revoke(entity.entityId, by, reason)).outcome });
      }
      return console.log(JSON.stringify(out, null, 2));
    }
    if (command === 'rollback-batch') {
      const ids = (await idsOf()).flatMap(({ entity }) => (entity ? [entity.entityId] : []));
      return console.log(JSON.stringify(await rollbackProvisional({ apply: writes, entityIds: ids }), null, 2));
    }
    if (command === 'enrich') {
      const apply = args.includes('--apply');
      const invalidate = args.includes('--invalidate');
      let refresher: ConstructorParameters<typeof MediaCatalogEnrichmentSource>[1];
      if (args.includes('--refresh-catalogue')) {
        if (!process.env.TMDB_API_KEY) throw new Error('--refresh-catalogue needs TMDB_API_KEY');
        const { TMDBService } = await import('../infrastructure/external/TMDBService');
        const { MediaCatalogService } = await import('../application/services/MediaCatalogService');
        refresher = new MediaCatalogService(new MongoMediaCatalogRepository(), new TMDBService(process.env.TMDB_API_KEY, null), null);
      }
      const enrichment = new ContentEntityEnrichment(entities, new MediaCatalogEnrichmentSource(new MongoMediaCatalogRepository(), refresher));
      const rows: Array<Record<string, unknown>> = [];
      for (const { e, entity } of await idsOf()) {
        if (!entity) { rows.push({ candidateId: e.candidateId, outcome: 'entity_not_written' }); continue; }
        if (invalidate) { rows.push({ candidateId: e.candidateId, entityId: entity.entityId, outcome: apply ? await enrichment.invalidate(entity.entityId) : entity.metadata?.enrichment ? 'would_clear' : 'nothing_to_clear' }); continue; }
        const r = await enrichment.enrich(entity.entityId, new Date(), { apply, force: args.includes('--force') });
        rows.push({
          candidateId: e.candidateId, entityId: entity.entityId, outcome: r.outcome,
          ...(r.outcome === 'refused' ? { reasons: r.plan.reasons } : {}),
          ...((r.outcome === 'written' || r.outcome === 'would_write') ? { warnings: r.plan.warnings, kept: r.plan.kept } : {}),
        });
      }
      const refused = rows.filter((r) => ['refused', 'entity_not_written', 'concurrent_modification'].includes(String(r.outcome))).length;
      console.log(JSON.stringify({ dryRun: !writes, digest: manifest.digest, batch: manifest.entities.length, refused, rows }, null, 2));
      process.exitCode = refused ? 2 : 0;
      return;
    }
    if (command === 'quality-report') {
      const legacy = readJson<LegacySnapshot[]>(need(option(args, '--legacy'), '--legacy <legacy-snapshot.json>'));
      const broadcasts = new EntityBroadcastService();
      const films = [];
      for (const { e, entity } of await idsOf()) {
        const found = entity ? await broadcasts.forEntity(entity) : undefined;
        films.push(filmReport({
          candidateId: e.candidateId, title: e.title, canonicalPath: e.canonicalPath, entity,
          enrichment: entity ? { outcome: entity.metadata?.enrichment ? 'enriched' : 'not_enriched' } : { outcome: 'entity_not_written' },
          selection: found?.selection, legacy: legacy.find((l) => l.path === e.canonicalPath), registryClean: entity ? entity.canonicalPath === e.canonicalPath : undefined,
        }));
      }
      const report = { generatedAt: new Date().toISOString(), digest: manifest.digest, summary: summarizeFilmReports(films), films };
      const out = option(args, '--out');
      if (out) {
        fs.mkdirSync(out, { recursive: true });
        fs.writeFileSync(path.join(out, 'film-quality-report.json'), JSON.stringify(report, null, 2) + '\n');
        fs.writeFileSync(path.join(out, 'film-quality-report.md'), renderFilmReportMarkdown(films, `Film quality report (${report.generatedAt})`));
      }
      return console.log(JSON.stringify({ digest: report.digest, summary: report.summary }, null, 2));
    }
    if (command === 'rehearse') {
      const days = loadDays(args);
      const review = loadReview(args);
      const verdicts = new Map(manifest.entities.map((e) => [e.candidateId, days.flatMap((d) => d.verdicts).find((v) => v.candidateId === e.candidateId)!] as const));
      const noise = manifest.notSelected.slice(0, 20).map((n) => ({ candidateId: n.candidateId, title: n.title }));
      const fixturesDir = option(args, '--phase3d');
      const fixtures: EnrichmentFixtures | undefined = fixturesDir ? {
        catalog: readJson(path.join(fixturesDir, 'catalog.json')), airings: readJson(path.join(fixturesDir, 'airings.json')), legacy: readJson(path.join(fixturesDir, 'legacy-snapshot.json')),
      } : undefined;
      const report = await rehearseWriteCanary({ manifest, verdicts, review, noise, afterServed: fixtures ? enrichmentRehearsal(fixtures) : undefined });
      const outDir = option(args, '--phase3d-out');
      const artefact = (report as { phase3d?: { films: Parameters<typeof renderFilmReportMarkdown>[0]; summary: unknown; evaluatedAt: string } }).phase3d;
      if (outDir && artefact) {
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'film-quality-report.json'), JSON.stringify({ basis: 'scratch rehearsal on fixtures (committed TMDB checks + public API snapshot); no production database read', digest: manifest.digest, ...artefact }, null, 2) + '\n');
        fs.writeFileSync(path.join(outDir, 'film-quality-report.md'), renderFilmReportMarkdown(artefact.films, `Film quality report: scratch rehearsal at ${artefact.evaluatedAt}`));
      }
      console.log(JSON.stringify({ ...report, phase3d: artefact ? { summary: artefact.summary, evaluatedAt: artefact.evaluatedAt } : undefined }, null, 2));
      process.exitCode = report.ok ? 0 : 2;
      return;
    }
    if (command !== 'certify') throw new Error('unknown command (see file header)');

    const problems = manifestProblems(manifest, new Date());
    const auth = readJson<SignedOwnerAuthorization>(need(option(args, '--authorization'), '--authorization'));
    if (auth.payload.batch.manifestDigest !== manifest.digest) problems.push('authorization_for_another_manifest');
    const verdicts = loadAdmitVerdicts(need(option(args, '--admit'), '--admit <admit.jsonl>'), manifest);
    const review = loadReview(args);
    const report: Array<Record<string, unknown>> = [];
    for (const { e, entity } of await idsOf()) {
      if (!entity) { report.push({ candidateId: e.candidateId, outcome: 'refused', reasons: ['entity_not_written'] }); continue; }
      const req: CertifyRequest = { entityId: entity.entityId, verdict: verdicts.get(e.candidateId)!, review, authorization: auth };
      const reasons = entity.canonicalPath === e.canonicalPath ? await service.check(req) : ['canonical_path_differs_from_manifest'];
      if (problems.length || reasons.length) { report.push({ candidateId: e.candidateId, entityId: entity.entityId, outcome: 'refused', reasons: [...problems, ...reasons] }); continue; }
      if (!writes) { report.push({ candidateId: e.candidateId, entityId: entity.entityId, outcome: 'would_certify' }); continue; }
      try { report.push({ candidateId: e.candidateId, entityId: entity.entityId, outcome: (await service.certify(req)).outcome }); }
      catch (error) { report.push({ candidateId: e.candidateId, entityId: entity.entityId, outcome: 'refused', reasons: [String((error as Error).message)] }); }
    }
    const refused = report.filter((r) => r.outcome === 'refused').length;
    console.log(JSON.stringify({ dryRun: !writes, digest: manifest.digest, batch: manifest.entities.length, refused, report }, null, 2));
    process.exitCode = refused ? 2 : 0;
  } finally {
    await disconnectMongoDB();
    if (guard) console.error(`read-only guard: ${JSON.stringify(guard.summary())}`);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (offline(command, args)) return;
  await database(command, args);
}

main().catch((error) => {
  console.error(String(error?.message || error));
  if (process.env.CERTIFY_STACK) console.error(error?.stack);
  process.exit(1);
});
