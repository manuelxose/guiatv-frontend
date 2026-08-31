import '../config/bootstrap';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { connectMongoDB, disconnectMongoDB } from '../config/mongodb';
import { EDITORIAL_SEED_POSTS } from '../application/data/editorialSeedData';
import { planLegacyEditorialMigration } from '../application/services/EditorialLegacyMigrationPolicy';
import { BlogPostModel } from '../infrastructure/database/models/BlogPost.model';
import { logger } from '../shared/utils/logger';

const migrationLogger = logger.child('migrate-editorial-review');
const FIELDS = ['status', 'origin', 'reviewState', 'reviewedBy', 'reviewedAt', 'reviewNotes'] as const;

interface BackupRow {
  id: string;
  values: Record<string, unknown>;
  present: string[];
}

interface BackupFile {
  migration: 'editorial-review-v1';
  createdAt: string;
  rows: BackupRow[];
}

function optionValue(prefix: string): string | undefined {
  return process.argv.slice(2).find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function rollback(path: string): Promise<void> {
  const backup = JSON.parse(await readFile(resolve(path), 'utf8')) as BackupFile;
  if (backup.migration !== 'editorial-review-v1') throw new Error('Unsupported backup file');
  for (const row of backup.rows) {
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    for (const field of FIELDS) {
      if (row.present.includes(field)) $set[field] = row.values[field];
      else $unset[field] = 1;
    }
    await BlogPostModel.updateOne({ _id: row.id }, { $set, $unset }).exec();
  }
  migrationLogger.info('Editorial review migration rolled back', { rows: backup.rows.length, path });
}

async function migrate(apply: boolean, backupPath: string): Promise<void> {
  const curatedSlugs = new Set(EDITORIAL_SEED_POSTS.map((post) => post.slug));
  const posts = await BlogPostModel.find({}).lean().exec();
  const planned = posts.flatMap((post) => {
    const plan = planLegacyEditorialMigration(post, curatedSlugs);
    return plan ? [{ post, plan }] : [];
  });

  migrationLogger.info('Editorial review migration plan', {
    mode: apply ? 'apply' : 'dry-run', totalPosts: posts.length, changes: planned.length,
    publish: planned.filter(({ plan }) => plan.status === 'publish').length,
    quarantine: planned.filter(({ plan }) => plan.status === 'draft').length,
  });
  if (!apply || planned.length === 0) return;

  const backup: BackupFile = {
    migration: 'editorial-review-v1',
    createdAt: new Date().toISOString(),
    rows: planned.map(({ post }) => ({
      id: String(post._id),
      values: Object.fromEntries(FIELDS.filter((field) => field in post).map((field) => [field, (post as any)[field]])),
      present: FIELDS.filter((field) => field in post),
    })),
  };
  await mkdir(dirname(backupPath), { recursive: true });
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx', mode: 0o600 });

  for (const { post, plan } of planned) {
    await BlogPostModel.updateOne({ _id: post._id }, { $set: plan }).exec();
  }
  migrationLogger.info('Editorial review migration applied', { changes: planned.length, backupPath });
}

async function run(): Promise<void> {
  await connectMongoDB();
  try {
    const rollbackPath = optionValue('--rollback=');
    if (rollbackPath) return await rollback(rollbackPath);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = resolve(optionValue('--backup=') || `artifacts/migrations/editorial-review-${stamp}.json`);
    await migrate(process.argv.includes('--apply'), backupPath);
  } finally {
    await disconnectMongoDB();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  migrationLogger.error('Editorial review migration failed', { error });
  process.exit(1);
});
