"use strict";
// src/v2/infrastructure/external/EPGDataSource.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EPGDataSource = void 0;
const axios_1 = __importDefault(require("axios"));
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const zlib_1 = __importDefault(require("zlib"));
const logger_1 = require("../../shared/utils/logger");
class EPGDataSource {
    constructor(options) {
        this.options = options;
        this.dataLogger = logger_1.logger.child('EPGDataSource');
    }
    async fetchRaw() {
        try {
            this.dataLogger.info('Fetching EPG data', { url: this.options.url });
            const response = await axios_1.default.get(this.options.url, {
                responseType: 'arraybuffer',
                timeout: this.options.timeout || 30000,
            });
            const buffer = Buffer.from(response.data);
            this.dataLogger.info('EPG data fetched successfully', {
                size: buffer.length,
                compressed: this.options.compressed,
            });
            return buffer;
        }
        catch (error) {
            this.dataLogger.error('Failed to fetch EPG data', error);
            throw error;
        }
    }
    async fetchAndDecompress() {
        if (!this.options.compressed) {
            const buffer = await this.fetchRaw();
            return buffer.toString('utf-8');
        }
        try {
            this.dataLogger.info('Fetching and decompressing EPG data');
            const buffer = await this.fetchRaw();
            const readable = stream_1.Readable.from(buffer);
            const gunzip = zlib_1.default.createGunzip();
            const chunks = [];
            const writable = new (require('stream').Writable)({
                write(chunk, encoding, callback) {
                    chunks.push(chunk);
                    callback();
                },
            });
            await (0, promises_1.pipeline)(readable, gunzip, writable);
            const decompressed = Buffer.concat(chunks).toString('utf-8');
            this.dataLogger.info('EPG data decompressed successfully', {
                originalSize: buffer.length,
                decompressedSize: decompressed.length,
            });
            return decompressed;
        }
        catch (error) {
            this.dataLogger.error('Failed to decompress EPG data', error);
            throw error;
        }
    }
    async fetchWithRetry(maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.dataLogger.info('Fetch attempt', { attempt, maxRetries });
                return await this.fetchAndDecompress();
            }
            catch (error) {
                lastError = error;
                this.dataLogger.warn('Fetch attempt failed', {
                    attempt,
                    error: lastError.message,
                });
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    this.dataLogger.info('Retrying after delay', { delay });
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error('Failed to fetch EPG data after retries');
    }
}
exports.EPGDataSource = EPGDataSource;
//# sourceMappingURL=EPGDataSource.js.map