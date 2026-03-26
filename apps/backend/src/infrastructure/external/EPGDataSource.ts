// src/v2/infrastructure/external/EPGDataSource.ts

import axios from 'axios';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';
import { logger } from '../../shared/utils/logger';
import { isTdtChannelsSourceUrl } from '../../shared/config/epgSources';

export interface EPGDataSourceOptions {
  url: string;
  timeout?: number;
  compressed?: boolean;
}

export class EPGDataSource {
  private readonly dataLogger = logger.child('EPGDataSource');

  constructor(private readonly options: EPGDataSourceOptions) {}

  private buildRequestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      Accept: 'application/xml,text/xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    };

    if (isTdtChannelsSourceUrl(this.options.url)) {
      headers.Referer = 'https://www.tdtchannels.com/';
      headers.Origin = 'https://www.tdtchannels.com';
    }

    return headers;
  }

  async fetchRaw(): Promise<Buffer> {
    try {
      this.dataLogger.info('Fetching EPG data', { url: this.options.url });

      const response = await axios.get(this.options.url, {
        responseType: 'arraybuffer',
        timeout: this.options.timeout || 30000,
        headers: this.buildRequestHeaders(),
      });

      const buffer = Buffer.from(response.data);

      this.dataLogger.info('EPG data fetched successfully', {
        size: buffer.length,
        compressed: this.options.compressed,
      });

      return buffer;
    } catch (error) {
      this.dataLogger.error('Failed to fetch EPG data', error as Error);
      throw error;
    }
  }

  async fetchAndDecompress(): Promise<string> {
    if (!this.options.compressed) {
      const buffer = await this.fetchRaw();
      return buffer.toString('utf-8');
    }

    try {
      this.dataLogger.info('Fetching and decompressing EPG data');

      const buffer = await this.fetchRaw();
      const readable = Readable.from(buffer);
      const gunzip = zlib.createGunzip();

      const chunks: Buffer[] = [];
      const writable = new (require('stream').Writable)({
        write(chunk: Buffer, encoding: string, callback: () => void) {
          void encoding;
          chunks.push(chunk);
          callback();
        },
      });

      await pipeline(readable, gunzip, writable);

      const decompressed = Buffer.concat(chunks).toString('utf-8');

      this.dataLogger.info('EPG data decompressed successfully', {
        originalSize: buffer.length,
        decompressedSize: decompressed.length,
      });

      return decompressed;
    } catch (error) {
      this.dataLogger.error('Failed to decompress EPG data', error as Error);
      throw error;
    }
  }

  async fetchWithRetry(maxRetries: number = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.dataLogger.info('Fetch attempt', { attempt, maxRetries });
        return await this.fetchAndDecompress();
      } catch (error) {
        lastError = error as Error;
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
