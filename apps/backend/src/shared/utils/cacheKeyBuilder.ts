import { GetProgramsRequest } from '../../application/use-cases/GetPrograms';

/**
 * Utility to centralize cache key generation across layers.
 */
export class CacheKeyBuilder {
  /**
   * Builds a deterministic cache key for program queries.
   */
  static forPrograms(request: GetProgramsRequest): string {
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
