/** M03-L1: builder integration on a scratch MongoDB — shadow must leave the built airings and the catalogue byte-identical to off. */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { TvReadModelBuilder } from './TvReadModelBuilder';
import { catalogueLinkSnapshot, resetCatalogueLinkStats } from './CatalogueLinkShadow';
import { MediaCatalogModel } from '@/infrastructure/database/models/MediaCatalogEntry.model';
import { TVReadAiringModel } from '@/infrastructure/database/models/TVReadAiring.model';

const prog = (id: string, title: string, tmdbId: number, hour: number, mediaId?: string, category = 'Cine') => ({
  id, channelId: 'la_1', canonicalChannelId: 'la_1', title, normalizedTitle: title.toLowerCase(), titleAliases: [],
  startTime: new Date(Date.UTC(2026, 9, 23, hour)), endTime: new Date(Date.UTC(2026, 9, 23, hour + 1)), duration: 60,
  tmdbId, mediaId, genre: category, sourceFeed: '', editorialCategory: category,
});

test('shadow mode: same airings as off, zero catalogue writes, counters recorded', { skip: !process.env.TEST_MONGO_URI }, async () => {
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName: `guiatv_test_m03l1_${process.pid}` });
  const saved = process.env.EPG_CATALOGUE_LINK_MODE;
  try {
    await mongoose.connection.dropDatabase();
    await MediaCatalogModel.create({ tmdbId: 949, tmdbType: 'movie', contentType: 'movie', title: 'Heat', originalTitle: 'Heat', normalizedTitle: 'heat', normalizedIdentity: 'movie:heat:1995', year: '1995', metadataSource: 'tmdb' });
    const catalogueBefore = JSON.stringify(await MediaCatalogModel.find().sort({ _id: 1 }).lean());
    const programs = [prog('a', 'Heat', 949, 10), prog('b', 'Sin catálogo', 7, 12), prog('c', 'Otra', 8, 14, 'ffffffffffffffffffffffff')];
    const builder = new TvReadModelBuilder({ findByDate: async () => programs } as any, { clear: async () => undefined } as any);
    const built = async () => {
      await builder.rebuildDate('20261023');
      return JSON.stringify((await TVReadAiringModel.find().sort({ id: 1 }).lean()).map(({ _id, createdAt, updatedAt, generatedAt, ...rest }: any) => rest));
    };

    resetCatalogueLinkStats();
    delete process.env.EPG_CATALOGUE_LINK_MODE;
    const off = await built();
    assert.equal(catalogueLinkSnapshot().runs, 0);

    process.env.EPG_CATALOGUE_LINK_MODE = 'shadow';
    const shadow = await built();
    assert.equal(shadow, off);
    assert.equal(JSON.stringify(await MediaCatalogModel.find().sort({ _id: 1 }).lean()), catalogueBefore);
    const s = catalogueLinkSnapshot();
    assert.equal(s.runs, 1);
    assert.deepEqual([s.lastRun!.evaluated, s.lastRun!.linkable, s.lastRun!.rejected.missing_catalogue_row, s.lastRun!.rejected.conflicting_media_id, s.lastRun!.queries], [3, 1, 1, 1, 1]);
    assert.equal(JSON.parse(shadow).length, 3);
    assert.ok(!JSON.parse(shadow).some((a: any) => a.program.mediaId && a.program.tmdbId === 949), 'derived link must not be persisted');
  } finally {
    if (saved === undefined) delete process.env.EPG_CATALOGUE_LINK_MODE; else process.env.EPG_CATALOGUE_LINK_MODE = saved;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
