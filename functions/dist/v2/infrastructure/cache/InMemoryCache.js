"use strict";
// src/v2/infrastructure/cache/InMemoryCache.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCache = void 0;
class InMemoryCache {
    constructor(cleanupIntervalMs = 60000) {
        this.cache = new Map();
        // Limpieza automática cada minuto
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds = 300) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, {
            value,
            expiresAt,
        });
    }
    async delete(key) {
        this.cache.delete(key);
    }
    async clear(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        // Convertir patrón simple (ej: "programs:*") a regex
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const keysToDelete = [];
        this.cache.forEach((_, key) => {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => this.cache.delete(key));
    }
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        this.cache.forEach((entry, key) => {
            if (now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => this.cache.delete(key));
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
    // Métodos útiles para debugging/testing
    size() {
        return this.cache.size;
    }
    keys() {
        return Array.from(this.cache.keys());
    }
    // In-memory cache is always 'connected' in the sense it is usable
    getConnectionStatus() {
        return true;
    }
}
exports.InMemoryCache = InMemoryCache;
//# sourceMappingURL=InMemoryCache.js.map