#!/usr/bin/env node

/** Operational TV acceptance check using the configured Mongo/Valkey/API. */
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const mongoUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB_NAME || 'guiatv';
const redisUrl = process.env.VALKEY_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const apiBase = (process.env.GUIATV_API_BASE || 'http://127.0.0.1:4000').replace(/\/$/, '');
const maxEpgAgeHours = Math.max(1, Number(process.env.TV_EPG_MAX_AGE_HOURS || 36));
const failures = [];

function madridDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}${get('month')}${get('day')}`;
}

function planStats(plan) {
  const stages = [];
  const indexes = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.stage) stages.push(node.stage);
    if (node.indexName) indexes.push(node.indexName);
    Object.values(node).filter((value) => value && typeof value === 'object').forEach(visit);
  };
  visit(plan.queryPlanner?.winningPlan);
  return { stages: [...new Set(stages)], indexes: [...new Set(indexes)], docsExamined: plan.executionStats?.totalDocsExamined ?? null, keysExamined: plan.executionStats?.totalKeysExamined ?? null, executionMs: plan.executionStats?.executionTimeMillis ?? null };
}

function normalizeToken(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function request(path) {
  const started = performance.now();
  const response = await fetch(`${apiBase}${path}`);
  return { status: response.status, ms: Math.round((performance.now() - started) * 100) / 100, body: await response.json() };
}

async function main() {
  const date = madridDate();
  const report = { date, mongo: {}, redis: {}, epg: {}, api: {}, chatbot: {} };
  const mongo = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });

  try {
    await mongo.connect();
    const db = mongo.db(mongoDbName);
    await db.command({ ping: 1 });
    report.mongo.connected = true;
    const collections = new Set((await db.listCollections().toArray()).map((entry) => entry.name));
    report.mongo.collections = [...collections].filter((name) => ['channels', 'tv_read_airings', 'epg_source_snapshots'].includes(name));
    for (const required of ['channels', 'tv_read_airings', 'epg_source_snapshots']) if (!collections.has(required)) failures.push(`Mongo collection missing: ${required}`);

    const channels = db.collection('channels');
    const airings = db.collection('tv_read_airings');
    const snapshots = db.collection('epg_source_snapshots');
    report.mongo.channelCounts = Object.fromEntries((await channels.aggregate([{ $match: { active: true } }, { $group: { _id: '$type', count: { $sum: 1 } } }]).toArray()).map((row) => [row._id || 'unknown', row.count]));
    const groupRows = await airings.aggregate([{ $match: { date } }, { $group: { _id: '$channel.group', channels: { $addToSet: '$channel.id' }, airings: { $sum: 1 } } }, { $project: { _id: 1, airings: 1, channels: { $size: '$channels' } } }]).toArray();
    report.mongo.today = { totalAirings: await airings.countDocuments({ date }), uniqueChannels: (await airings.distinct('channel.id', { date })).length, groups: Object.fromEntries(groupRows.map((row) => [row._id || 'unknown', { airings: row.airings, channels: row.channels }])) };
    const operationalRows = await airings.aggregate([
      { $match: { date } },
      {
        $group: {
          _id: null,
          payChannels: { $addToSet: { $cond: [{ $eq: ['$channel.access', 'pay'] }, '$channel.id', null] } },
          cableChannels: { $addToSet: { $cond: [{ $eq: ['$channel.distribution', 'cable'] }, '$channel.id', null] } },
          movistarChannels: { $addToSet: { $cond: [{ $eq: ['$channel.operator', 'Movistar Plus+'] }, '$channel.id', null] } },
          sportsChannels: { $addToSet: { $cond: [{ $in: ['sports', { $ifNull: ['$channel.contentFacets', []] }] }, '$channel.id', null] } },
        },
      },
      {
        $project: {
          _id: 0,
          payChannels: { $size: { $setDifference: ['$payChannels', [null]] } },
          cableChannels: { $size: { $setDifference: ['$cableChannels', [null]] } },
          movistarChannels: { $size: { $setDifference: ['$movistarChannels', [null]] } },
          sportsChannels: { $size: { $setDifference: ['$sportsChannels', [null]] } },
        },
      },
    ]).toArray();
    report.mongo.today.operationalCoverage = operationalRows[0] || { payChannels: 0, cableChannels: 0, movistarChannels: 0, sportsChannels: 0 };
    if (!report.mongo.today.operationalCoverage.payChannels) failures.push('No channels classified with pay access for today');
    if (!report.mongo.today.operationalCoverage.cableChannels) failures.push('No channels classified with cable distribution for today');
    if (!report.mongo.today.operationalCoverage.movistarChannels) failures.push('No channels classified with Movistar Plus+ operator identity for today');
    if (!report.mongo.today.operationalCoverage.sportsChannels) failures.push('No channels classified with sports content facets for today');

    const representatives = ['tcm', 'axn', 'calle_13', 'syfy', 'amc', 'm_hits', 'm_estrenos', 'm_vamos', 'eurosport'];
    report.mongo.representativeChannels = {};
    for (const id of representatives) report.mongo.representativeChannels[id] = await channels.findOne({ $or: [{ id }, { normalizedName: id }, { aliases: id }] }, { projection: { _id: 0, id: 1, name: 1, normalizedName: 1, type: 1, active: 1 } });
    report.mongo.representativeAirings = Object.fromEntries(await Promise.all(
      ['tcm', 'axn', 'm_hits', 'm_estrenos', 'm_vamos'].map(async (id) => [id, await airings.countDocuments({ date, 'channel.id': id })])
    ));

    const sourceRows = await snapshots.find({ date }).sort({ updatedAt: -1 }).toArray();
    const canonicalTokens = new Set();
    for (const row of await channels.find({ active: true }, { projection: { id: 1, normalizedName: 1, aliases: 1, sourceIds: 1 } }).toArray()) {
      [row.id, row.normalizedName, ...(row.aliases || []), ...(row.sourceIds || [])].forEach((value) => {
        const token = normalizeToken(value);
        if (token) canonicalTokens.add(token);
      });
    }
    report.epg = {
      sourceCount: sourceRows.length,
      sources: sourceRows.map((row) => {
        const rawChannels = row.channels || [];
        const matchedChannels = rawChannels.filter((channel) => [channel.id, channel.displayName].some((value) => canonicalTokens.has(normalizeToken(value)))).length;
        return { sourceUrl: row.sourceUrl, channels: row.stats?.channelsCount ?? rawChannels.length, programmes: row.stats?.programmesCount ?? row.programmes?.length ?? 0, matchedChannels, mappingCoverage: rawChannels.length ? Math.round((matchedChannels / rawChannels.length) * 10000) / 100 : 0, updatedAt: row.updatedAt };
      }),
    };
    if (!sourceRows.length) failures.push(`No EPG snapshot for ${date}`);
    const freshestSourceMs = Math.max(...sourceRows.map((row) => new Date(row.updatedAt || 0).getTime()).filter(Number.isFinite), 0);
    report.epg.freshestAgeHours = freshestSourceMs
      ? Math.round(((Date.now() - freshestSourceMs) / 3_600_000) * 100) / 100
      : null;
    report.epg.maxAcceptedAgeHours = maxEpgAgeHours;
    if (!freshestSourceMs || report.epg.freshestAgeHours > maxEpgAgeHours) {
      failures.push(`EPG sources are stale or undated (maximum accepted age: ${maxEpgAgeHours}h)`);
    }

    const base = { date, 'trustDecision.consumerSuppressed': { $ne: true }, 'program.titleResolutionState': { $nin: ['generic_unresolved', 'generic_suppressed'] } };
    const now = new Date().toISOString();
    const plans = {
      day: [base, { 'channel.sortOrder': 1, 'airing.start': 1 }],
      now: [{ ...base, 'airing.start': { $lte: now }, 'airing.end': { $gt: now } }, { 'channel.sortOrder': 1, 'airing.start': 1 }],
      cable: [{ ...base, 'channel.group': 'cable' }, { 'channel.sortOrder': 1, 'airing.start': 1 }],
      tcm: [{ ...base, 'channel.id': 'tcm' }, { 'airing.start': 1 }],
    };
    report.mongo.queryPlans = {};
    for (const [name, [query, sort]] of Object.entries(plans)) report.mongo.queryPlans[name] = planStats(await airings.find(query).sort(sort).limit(120).explain('executionStats'));
  } catch (error) {
    report.mongo.connected = false;
    failures.push(`Mongo validation failed: ${error.message}`);
  } finally {
    await mongo.close().catch(() => {});
  }

  let redis;
  try {
    redis = createClient({ url: redisUrl });
    await redis.connect();
    report.redis.connected = (await redis.ping()) === 'PONG';
    const key = `tv:operational-validation:${process.pid}`;
    await redis.set(key, JSON.stringify({ date, ok: true }), { EX: 60 });
    report.redis.roundTrip = (await redis.get(key)) ? 'ok' : 'failed';
    report.redis.ttlSeconds = await redis.ttl(key);
    await redis.del(key);
    if (report.redis.roundTrip !== 'ok') failures.push('Valkey round-trip returned no value');
  } catch (error) {
    report.redis.connected = false;
    failures.push(`Valkey validation failed: ${error.message}`);
  } finally {
    await redis?.quit().catch(() => {});
  }

  try {
    const health = await request('/v2/health');
    const tcm = await request(`/v2/tv/read?view=search&q=TCM&limit=2&validation=${Date.now()}`);
    const tcmRepeat = await request(`/v2/tv/read?view=search&q=TCM&limit=2`);
    const axn = await request('/v2/tv/read?view=search&q=AXN&limit=2');
    const movistar = await request('/v2/tv/read?view=night&group=movistar&limit=5');
    const channelDirectory = await request('/v2/tv/read/channels?date=today');
    const payDirectory = await request('/v2/tv/read/channels?date=today&group=cable');
    const schedule = await request('/v2/tv/read/schedule?date=today&group=tdt&itemsPerChannel=48');
    report.api = {
      health: { status: health.status, ms: health.ms },
      tcm: { status: tcm.status, ms: tcm.ms, items: tcm.body?.data?.items?.length || 0 },
      tcmRepeat: { status: tcmRepeat.status, ms: tcmRepeat.ms, cached: tcmRepeat.body?.data?.meta?.cached === true },
      axn: { status: axn.status, ms: axn.ms, items: axn.body?.data?.items?.length || 0 },
      movistarTonight: { status: movistar.status, ms: movistar.ms, items: movistar.body?.data?.items?.length || 0 },
      channelDirectory: { status: channelDirectory.status, ms: channelDirectory.ms, channels: channelDirectory.body?.data?.channels?.length || 0 },
      payDirectory: { status: payDirectory.status, ms: payDirectory.ms, channels: payDirectory.body?.data?.channels?.length || 0 },
      schedule: {
        status: schedule.status,
        ms: schedule.ms,
        channels: schedule.body?.data?.meta?.totalChannels || 0,
        items: schedule.body?.data?.meta?.totalItems || 0,
        truncatedChannels: schedule.body?.data?.meta?.truncatedChannels ?? null,
      },
    };
    if ([health, tcm, axn, movistar, channelDirectory, payDirectory, schedule].some((result) => result.status !== 200)) failures.push('One or more TV API checks returned a non-200 status');
    if (!report.api.tcm.items || !report.api.axn.items || !report.api.movistarTonight.items) failures.push('Representative API response has no TV items');
    if (!report.api.channelDirectory.channels || !report.api.payDirectory.channels) failures.push('Channel directory completeness check returned no channels');
    if (!report.api.schedule.channels || !report.api.schedule.items) failures.push('Channel-grouped schedule returned no guide coverage');
    report.chatbot = { canonicalReadModelAvailable: true, deterministicGroundingTests: 'covered by backend test suite', note: 'Authenticated answer comparison requires a user session; this validator never generates credentials.' };
  } catch (error) {
    failures.push(`API validation failed: ${error.message}`);
  }

  report.status = failures.length ? 'FAILED' : 'PASSED';
  report.failures = failures;
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => { console.error(`Operational validation crashed: ${error.message}`); process.exitCode = 1; });
