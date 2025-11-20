"use strict";
// src/v2/infrastructure/cache/RedisCache.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const redis_1 = require("redis");
class RedisCache {
    constructor(redisUrl, options) {
        this.redisUrl = redisUrl;
        this.options = options;
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: this.redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    const maxRetries = this.options?.maxRetries || 10;
                    if (retries >= maxRetries) {
                        return new Error('Redis max retries reached');
                    }
                    return Math.min(retries * 50, 2000);
                },
                connectTimeout: this.options?.connectTimeout || 10000,
            },
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('[RedisCache] Connecting to Redis...');
        });
        this.client.on('ready', () => {
            console.log('[RedisCache] Redis connection ready');
            this.isConnected = true;
        });
        this.client.on('error', (err) => {
            console.error('[RedisCache] Redis error:', err);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            console.log('[RedisCache] Redis connection closed');
            this.isConnected = false;
        });
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await this.client.connect();
            this.isConnected = true;
        }
        catch (error) {
            console.error('[RedisCache] Failed to connect:', error);
            // Do not throw to avoid breaking initialization flow; caller can decide fallback
            this.isConnected = false;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.quit();
            this.isConnected = false;
        }
        catch (error) {
            console.error('[RedisCache] Error disconnecting:', error);
            await this.client.disconnect();
        }
    }
    async get(key) {
        try {
            if (!this.isConnected) {
                console.warn('[RedisCache] Not connected, skipping get');
                return null;
            }
            const value = await this.client.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            console.error(`[RedisCache] Error getting key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds = 300) {
        try {
            if (!this.isConnected) {
                console.warn('[RedisCache] Not connected, skipping set');
                return;
            }
            const serialized = JSON.stringify(value);
            await this.client.setEx(key, ttlSeconds, serialized);
        }
        catch (error) {
            console.error(`[RedisCache] Error setting key ${key}:`, error);
            // No lanzar error para no romper el flujo de la aplicación
        }
    }
    async delete(key) {
        try {
            if (!this.isConnected) {
                console.warn('[RedisCache] Not connected, skipping delete');
                return;
            }
            await this.client.del(key);
        }
        catch (error) {
            console.error(`[RedisCache] Error deleting key ${key}:`, error);
        }
    }
    async clear(pattern) {
        try {
            if (!this.isConnected) {
                console.warn('[RedisCache] Not connected, skipping clear');
                return;
            }
            if (!pattern) {
                await this.client.flushDb();
                return;
            }
            // Usar SCAN para evitar bloquear Redis con KEYS en producción
            const keys = await this.scanKeys(pattern);
            if (keys.length > 0) {
                // Borrar en lotes de 100 para evitar comandos muy grandes
                const batchSize = 100;
                for (let i = 0; i < keys.length; i += batchSize) {
                    const batch = keys.slice(i, i + batchSize);
                    await this.client.del(batch);
                }
            }
        }
        catch (error) {
            console.error(`[RedisCache] Error clearing pattern ${pattern}:`, error);
        }
    }
    async scanKeys(pattern) {
        const keys = [];
        let cursor = '0';
        do {
            const result = await this.client.scan(cursor, {
                MATCH: pattern,
                COUNT: 100,
            });
            cursor = result.cursor;
            keys.push(...result.keys);
        } while (cursor !== '0');
        return keys;
    }
    // Métodos adicionales útiles para producción
    async exists(key) {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error(`[RedisCache] Error checking existence of ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            if (!this.isConnected) {
                return -1;
            }
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error(`[RedisCache] Error getting TTL of ${key}:`, error);
            return -1;
        }
    }
    async mget(keys) {
        try {
            if (!this.isConnected || keys.length === 0) {
                return keys.map(() => null);
            }
            const values = await this.client.mGet(keys);
            return values.map((v) => v ? JSON.parse(v) : null);
        }
        catch (error) {
            console.error('[RedisCache] Error in mget:', error);
            return keys.map(() => null);
        }
    }
    async mset(entries) {
        try {
            if (!this.isConnected || entries.length === 0) {
                return;
            }
            // Usar pipeline para operaciones batch eficientes
            const pipeline = this.client.multi();
            entries.forEach(({ key, value, ttl }) => {
                const serialized = JSON.stringify(value);
                if (ttl) {
                    pipeline.setEx(key, ttl, serialized);
                }
                else {
                    pipeline.set(key, serialized);
                }
            });
            await pipeline.exec();
        }
        catch (error) {
            console.error('[RedisCache] Error in mset:', error);
        }
    }
    // Health check para monitoreo
    async ping() {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            console.error('[RedisCache] Ping failed:', error);
            return false;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=RedisCache.js.map