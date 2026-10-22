/** M02-B: one malformed catalogue row (empty normalizedTitle) used to make the whole batch lookup return [] — the real preflight read 0 rows of 17k. */
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMediaCatalogRepository } from './MongoMediaCatalogRepository';
import { MediaCatalogModel } from '@/infrastructure/database/models/MediaCatalogEntry.model';

test('batch lookups skip an invalid row instead of hiding every valid one', { skip: !process.env.TEST_MONGO_URI }, async () => {
  await mongoose.connect(process.env.TEST_MONGO_URI!, { dbName: `guiatv_test_m02b_${process.pid}` });
  try {
    await mongoose.connection.dropDatabase();
    const repo = new MongoMediaCatalogRepository();
    await repo.upsert({ tmdbId: 949, tmdbType: 'movie', contentType: 'movie', title: 'Heat', originalTitle: 'Heat', year: '1995', metadataSource: 'tmdb' });
    const [good] = await MediaCatalogModel.find({ tmdbId: 949 }).lean();
    await MediaCatalogModel.collection.insertOne({ ...good, _id: new mongoose.Types.ObjectId(), tmdbId: 950, normalizedTitle: '', normalizedIdentity: 'movie::1995' });
    assert.deepEqual((await repo.findManyByTmdbIds('movie', [949, 950])).map((e) => e.tmdbId), [949]);
    assert.equal((await repo.findByNormalizedTitles([good.normalizedTitle, ''])).length, 1);
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
