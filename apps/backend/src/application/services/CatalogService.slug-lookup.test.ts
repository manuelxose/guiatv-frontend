/**
 * 2D-2C.2: the slug lookup's airing fetch narrowed by the title token must return what the original title-only
 * query returned. Runs only with TEST_MONGO_URI (throwaway database, dropped afterwards), e.g.:
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27118 npm test
 * Airings carry searchTokens built exactly like TvReadModelBuilder (title, normalized title, category, channel).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { CatalogService } from './CatalogService';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';
import { buildSearchTokens } from '@/shared/utils/tvMetadata';

const mongoUri = process.env.TEST_MONGO_URI;

const airing = (date: string, id: string, title: string, start: string, channel: string, category: string, tokens?: string[]) => ({
  id,
  date,
  program: { title },
  channel: { id: channel.toLowerCase().replace(/\s+/g, '_'), name: channel },
  airing: { start, end: start, date },
  searchTokens: tokens ?? buildSearchTokens([title, title.toLowerCase(), category, channel]),
});

test('slug lookup returns the same airing as the title-only query on realistic EPG rows', { skip: !mongoUri }, async () => {
  await mongoose.connect(mongoUri as string, { dbName: `guiatv_test_2d2c2_${process.pid}` });
  try {
    await TVReadAiringModel.collection.insertMany([
      // Accented title on two channels (the legacy slug drops ñ: "pequeas-coincidencias").
      airing('20261021', 'a-1', 'Pequeñas coincidencias', '2026-10-21T21:00:00.000Z', 'La 1', 'Series'),
      airing('20261021', 'a-2', 'Pequeñas coincidencias', '2026-10-21T08:00:00.000Z', 'Clan', 'Series'),
      // Punctuation and an alternate spelling of the same work.
      airing('20261021', 'p-1', 'C.S.I.: Miami', '2026-10-21T15:00:00.000Z', 'Energy', 'Series'),
      airing('20261021', 'p-2', 'CSI: Miami', '2026-10-21T10:00:00.000Z', 'Energy', 'Series'),
      // Several broadcasts, inserted out of order: the earliest wins.
      airing('20261021', 'm-3', 'La Promesa', '2026-10-21T22:30:00.000Z', 'La 1', 'Series'),
      airing('20261021', 'm-1', 'La Promesa', '2026-10-21T16:00:00.000Z', 'La 1', 'Series'),
      airing('20261021', 'm-2', 'La Promesa', '2026-10-21T18:45:00.000Z', 'TVE Internacional', 'Series'),
      // Generic words: "cine" tags many rows; the title is still found and fetched.
      airing('20261021', 'g-1', 'Cine de barrio', '2026-10-21T16:30:00.000Z', 'La 1', 'Cine'),
      ...Array.from({ length: 40 }, (_, i) => airing('20261021', `cine-${i}`, `Cine ${i}`, `2026-10-21T0${i % 10}:00:00.000Z`, 'Cine Plus', 'Cine')),
      // A title that contains the channel name.
      airing('20261021', 'c-1', 'Telenoticias Telemadrid', '2026-10-21T14:00:00.000Z', 'Telemadrid', 'Informativos'),
      // Historical vs current day.
      airing('20261020', 'h-0', 'Saber y ganar', '2026-10-20T14:00:00.000Z', 'La 2', 'Entretenimiento'),
      airing('20261021', 'h-1', 'Saber y ganar', '2026-10-21T14:00:00.000Z', 'La 2', 'Entretenimiento'),
      // Rows without tokens (not present in production: 0 of 32,351 on 2026-10-20..22).
      airing('20261021', 's-1', 'Doctor Who', '2026-10-21T20:00:00.000Z', 'SyFy', 'Series', []),
    ]);
    const service = new CatalogService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any) as any;
    const original = async (date: string, title: string) =>
      ((await TVReadAiringModel.findOne({ date, 'program.title': title }).sort({ 'airing.start': 1 }).lean().exec()) as any)?.id;

    // [slug, date, titles the slug may resolve to (two spellings share "csi-miami"), expected airing per title]
    const cases: Array<[string, string, Record<string, string>]> = [
      ['pequeas-coincidencias', '20261021', { 'Pequeñas coincidencias': 'a-2' }],
      ['csi-miami', '20261021', { 'C.S.I.: Miami': 'p-1', 'CSI: Miami': 'p-2' }],
      ['la-promesa', '20261021', { 'La Promesa': 'm-1' }],
      ['cine-de-barrio', '20261021', { 'Cine de barrio': 'g-1' }],
      ['telenoticias-telemadrid', '20261021', { 'Telenoticias Telemadrid': 'c-1' }],
      ['saber-y-ganar', '20261020', { 'Saber y ganar': 'h-0' }],
      ['saber-y-ganar', '20261021', { 'Saber y ganar': 'h-1' }],
    ];
    for (const [slug, date, expected] of cases) {
      const found = await service.findTvReadItemBySlug(slug.replace(/-/g, ' '), slug, date);
      const title = found?.program?.title as string;
      assert.ok(title in expected, `${slug} on ${date}: resolved to ${title}`);
      assert.equal(found?.id, expected[title], `${slug} on ${date}`);
      assert.equal(found?.id, await original(date, title), `${slug}: differs from the title-only query`);
    }

    // Rows without tokens are never found (distinct() needs the token), exactly as before this change.
    assert.equal(await service.findTvReadItemBySlug('doctor who', 'doctor-who', '20261021'), null);
  } finally {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  }
});
