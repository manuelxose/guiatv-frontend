import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'guiatv';
const poolSize = Number(process.env.MONGODB_POOL_SIZE) || 10;
const connectTimeoutMS = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 10000;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;

  client = new MongoClient(uri, {
    maxPoolSize: poolSize,
    connectTimeoutMS,
    serverSelectionTimeoutMS: connectTimeoutMS,
  });

  await client.connect();
  return client;
}

export async function getMongoDb(): Promise<Db> {
  if (db) return db;
  const c = await getMongoClient();
  db = c.db(dbName);
  return db;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    try {
      // cast to any to avoid spurious TS inference issues in some toolchains
      await (client as any).close();
    } finally {
      client = null;
      db = null;
    }
  }
}
