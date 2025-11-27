"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TMDBService = void 0;
const axios_1 = __importDefault(require("axios"));
const node_https_1 = __importDefault(require("node:https"));
const logger_1 = require("../../shared/utils/logger");
class TMDBService {
    constructor(apiKey) {
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.logger = logger_1.logger.child('TMDBService');
        this.cache = new Map();
        this.apiKey = apiKey;
        const allowSelfSigned = process.env.TMDB_ALLOW_SELF_SIGNED === '1' ||
            process.env.TMDB_ALLOW_SELF_SIGNED?.toLowerCase() === 'true' ||
            process.env.NODE_ENV !== 'production'; // default to permissive in non-prod to dodge corp proxies
        this.http = axios_1.default.create({
            baseURL: this.baseUrl,
            httpsAgent: allowSelfSigned
                ? new node_https_1.default.Agent({ rejectUnauthorized: false })
                : undefined,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                Accept: 'application/json',
            },
            // Reuse connections to avoid repeated TLS handshakes
            timeout: 8000,
        });
        if (allowSelfSigned) {
            this.logger.warn('TMDB self-signed certificate acceptance enabled via TMDB_ALLOW_SELF_SIGNED');
        }
    }
    getCacheKey(type, query, year) {
        return `${type}:${query}:${year ?? ''}`.toLowerCase();
    }
    async searchMovie(query, year) {
        const cacheKey = this.getCacheKey('movie', query, year);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey) ?? null;
        }
        try {
            const params = {
                query,
                language: 'es-ES',
                page: 1,
                include_adult: false,
            };
            if (year) {
                params.year = year;
            }
            const response = await this.http.get('/search/movie', { params });
            const results = response.data.results;
            if (results && results.length > 0) {
                const result = results[0];
                this.cache.set(cacheKey, result);
                return result;
            }
            this.cache.set(cacheKey, null);
            return null;
        }
        catch (error) {
            this.cache.set(cacheKey, null);
            this.logger.warn(`Failed to search movie: ${query}`, { error: error.message });
            return null;
        }
    }
    async searchSeries(query) {
        const cacheKey = this.getCacheKey('series', query);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey) ?? null;
        }
        try {
            const response = await this.http.get('/search/tv', {
                params: {
                    query,
                    language: 'es-ES',
                    page: 1,
                    include_adult: false,
                },
            });
            const results = response.data.results;
            if (results && results.length > 0) {
                const result = results[0];
                this.cache.set(cacheKey, result);
                return result;
            }
            this.cache.set(cacheKey, null);
            return null;
        }
        catch (error) {
            this.cache.set(cacheKey, null);
            this.logger.warn(`Failed to search series: ${query}`, { error: error.message });
            return null;
        }
    }
    getImageUrl(path, size = 'w500') {
        if (!path)
            return undefined;
        return `https://image.tmdb.org/t/p/${size}${path}`;
    }
}
exports.TMDBService = TMDBService;
//# sourceMappingURL=TMDBService.js.map