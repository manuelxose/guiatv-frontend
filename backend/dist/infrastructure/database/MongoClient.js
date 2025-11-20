"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoClient = getMongoClient;
exports.getMongoDb = getMongoDb;
exports.closeMongo = closeMongo;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'guiatv';
const poolSize = Number(process.env.MONGODB_POOL_SIZE) || 10;
const connectTimeoutMS = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 10000;
let client = null;
let db = null;
async function getMongoClient() {
    if (client)
        return client;
    client = new mongodb_1.MongoClient(uri, {
        maxPoolSize: poolSize,
        connectTimeoutMS,
        serverSelectionTimeoutMS: connectTimeoutMS,
    });
    await client.connect();
    return client;
}
async function getMongoDb() {
    if (db)
        return db;
    const c = await getMongoClient();
    db = c.db(dbName);
    return db;
}
async function closeMongo() {
    if (client) {
        try {
            // cast to any to avoid spurious TS inference issues in some toolchains
            await client.close();
        }
        finally {
            client = null;
            db = null;
        }
    }
}
//# sourceMappingURL=MongoClient.js.map