// mongosh, read-only: counts that must be identical before and after the 2D-2E replay. Prints no settings.
//   mongosh --quiet "$MONGODB_URI" baseline.js
const d = db.getSiblingDB(process.env.MONGODB_DB_NAME);
const cols = d.getCollectionNames().sort();
let indexes = 0;
for (const c of cols) indexes += d.getCollection(c).getIndexes().length;
print(JSON.stringify({
  at: new Date().toISOString(),
  collections: cols.length,
  indexes,
  content: cols.filter((c) => c.startsWith('content_')),
  airingIndexes: d.tv_read_airings.getIndexes().length,
  airingEntityRefs: d.tv_read_airings.countDocuments({ 'program.entityId': { $exists: true } }),
  airingPathRefs: d.tv_read_airings.countDocuments({ 'program.canonicalPath': { $exists: true } }),
  day20261020: d.tv_read_airings.countDocuments({ date: '20261020' }),
  mongodUptimeS: d.adminCommand({ serverStatus: 1 }).uptime,
}));
