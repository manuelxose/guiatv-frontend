"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeyBuilder = void 0;
class CacheKeyBuilder {
    static forPrograms(request) {
        const parts = ['programs', request.date];
        if (request.channels && request.channels.length > 0) {
            parts.push(`ch:${[...request.channels].sort().join(',')}`);
        }
        if (request.timeSlot) {
            parts.push(`ts:${request.timeSlot}`);
        }
        if (request.fields) {
            parts.push(`f:${request.fields}`);
        }
        if (request.country) {
            parts.push(`ctry:${request.country}`);
        }
        if (request.channelTypes && request.channelTypes.length > 0) {
            parts.push(`types:${[...request.channelTypes].sort().join(',')}`);
        }
        const page = request.page ?? 1;
        const limit = request.limit ?? 500;
        parts.push(`p:${page}`, `l:${limit}`);
        return parts.join('|');
    }
}
exports.CacheKeyBuilder = CacheKeyBuilder;
//# sourceMappingURL=cacheKeyBuilder.js.map