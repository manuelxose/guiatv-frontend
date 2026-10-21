/**
 * Content identity operations (2D-2). No HTTP endpoint exists for these; run on the server shell.
 *
 *   node dist/scripts/content-identity.js shadow 20261020 [20261022]   read-only matching report per stored day
 *   node dist/scripts/content-identity.js queue [limit]                 review queue (reads)
 *   node dist/scripts/content-identity.js pathless [limit]              stored entities without a path, by reason (reads)
 *   node dist/scripts/content-identity.js approve <titleKeyId> <entityId> --by <name> [--note <text>]
 *   node dist/scripts/content-identity.js reject <titleKeyId> --by <name> [--note <text>]
 *
 * `approve` and `reject` need the write flags (CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES
 * set to the database name) and a named reviewer.
 */
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { TVReadAiringModel } from '../infrastructure/database/models/TVReadAiring.model';
import { ProgramModel } from '../infrastructure/database/models/Program.model';
import {
  MongoContentEntityRepository,
  MongoContentSlugRepository,
  MongoContentTitleKeyRepository,
} from '../infrastructure/repositories/MongoContentIdentityRepositories';
import { ContentIdentityService } from '../application/services/ContentIdentityService';
import { createContentIdentityIngestion, observationsFromAirings } from '../application/services/ContentIdentityIngestion';
import { readContentIdentityFlags } from '../shared/config/contentEntities';

const option = (args: string[], name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

function* dates(from: string, to: string) {
  const day = new Date(`${from.slice(0, 4)}-${from.slice(4, 6)}-${from.slice(6, 8)}T12:00:00Z`);
  for (let i = 0; i < 31; i++, day.setUTCDate(day.getUTCDate() + 1)) {
    const d = day.toISOString().slice(0, 10).replace(/-/g, '');
    if (d > to) return;
    yield d;
  }
}

async function shadow(from: string, to: string) {
  if (!/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) throw new Error('dates are YYYYMMDD');
  const ingestion = createContentIdentityIngestion('shadow');
  for (const date of dates(from, to)) {
    const airings = await TVReadAiringModel.find({ date }, { id: 1, program: 1, sourceProvenance: 1 }).lean().exec();
    // The EPG year lives on the source programme, not on the airing.
    const programIds = airings.map((a: any) => a.sourceProvenance?.legacyProgramIds?.[0]).filter(Boolean);
    const years = new Map(
      (await ProgramModel.find({ id: { $in: programIds }, year: { $exists: true } }, { id: 1, year: 1 }).lean().exec()).map(
        (p: any) => [p.id, p.year] as const
      )
    );
    const yearByAiring = new Map(airings.map((a: any) => [a.id, years.get(a.sourceProvenance?.legacyProgramIds?.[0])] as const));
    console.log(JSON.stringify(await ingestion.run(date, observationsFromAirings(airings, yearByAiring))));
  }
}

/** `repairable`: a safe path is free and the next run that sees the entity allocates it; every other reason is intentional. */
async function pathless(limit: number) {
  const entities = await new MongoContentEntityRepository().findWithoutCanonicalPath(new Date(), limit);
  const plans = await createContentIdentityIngestion('shadow').planPaths(entities);
  const taken = new Set(
    (await new MongoContentSlugRepository().findByPaths([...plans.values()].flatMap((p) => p.paths))).map((s) => s.path)
  );
  const rows = entities.map((e) => {
    const plan = plans.get(e.entityId)!;
    const reason = plan.paths.some((p) => !taken.has(p)) ? 'repairable' : plan.paths.length ? 'taken' : plan.blocked[0];
    return { entityId: e.entityId, title: e.title, kind: e.kind, year: e.year, tmdb: e.externalIds?.tmdb, reason, refused: plan.blocked };
  });
  const byReason: Record<string, number> = {};
  rows.forEach((r) => (byReason[r.reason] = (byReason[r.reason] ?? 0) + 1));
  console.log(JSON.stringify({ total: rows.length, byReason, rows }, null, 2));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  await connectMongoDB();
  try {
    const flags = readContentIdentityFlags(process.env, mongoose.connection.db?.databaseName);
    const service = new ContentIdentityService(
      new MongoContentEntityRepository(),
      new MongoContentSlugRepository(),
      new MongoContentTitleKeyRepository(),
      'review'
    );
    if (command === 'shadow') return await shadow(args[0], args[1] ?? args[0]);
    if (command === 'pathless') return await pathless(Number(args[0]) || 10_000);
    if (command === 'queue') return console.log(JSON.stringify(await service.reviewQueue(Number(args[0]) || 50), null, 2));
    if (command !== 'approve' && command !== 'reject') throw new Error('usage: shadow|queue|pathless|approve|reject (see file header)');
    if (!flags.writes) throw new Error('review writes need CONTENT_ENTITIES_ENABLED and CONTENT_IDENTITY_WRITES=<database name>');
    const by = option(args, '--by') as string;
    const note = option(args, '--note');
    const ok =
      command === 'approve' ? await service.reviewTitleKey(args[0], args[1], by, note) : await service.rejectTitleKey(args[0], by, note);
    console.log(JSON.stringify({ command, id: args[0], updated: ok }));
  } finally {
    await disconnectMongoDB();
  }
}

main().catch((error) => {
  console.error(String(error?.message || error));
  process.exit(1);
});
