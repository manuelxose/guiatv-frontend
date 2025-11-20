import { promises as fs } from 'fs';
import { dirname, join, resolve } from 'path';
import { IStorageRepository, UploadOptions, DownloadOptions } from '@/domain/repositories/IStorageRepository';
import { logger } from '../../shared/utils/logger';

export class LocalStorageRepository implements IStorageRepository {
  private basePath: string;
  private log = logger.child('LocalStorage');

  constructor(basePath?: string) {
    this.basePath = resolve(basePath || process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'tmp-storage'));
    this.ensureBasePath().catch((error) => this.log.warn('Failed to ensure local storage path', { error }));
    this.log.info('LocalStorageRepository initialized', { basePath: this.basePath });
  }

  private async ensureBasePath(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  private resolvePath(filePath: string) {
    return join(this.basePath, filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const full = this.resolvePath(filePath);
      await fs.access(full);
      return true;
    } catch (e) {
      return false;
    }
  }

  async upload(filePath: string, content: Buffer | string, options?: UploadOptions): Promise<string> {
    const full = this.resolvePath(filePath);
    await fs.mkdir(dirname(full), { recursive: true });
    await fs.writeFile(full, typeof content === 'string' ? Buffer.from(content) : content);
    return options?.public ? `/storage/${filePath}` : filePath;
  }

  async download(filePath: string, options?: DownloadOptions): Promise<Buffer | string> {
    const full = this.resolvePath(filePath);
    const data = await fs.readFile(full);
    return options?.encoding ? data.toString(options.encoding) : data;
  }

  async delete(filePath: string): Promise<void> {
    const full = this.resolvePath(filePath);
    await fs.unlink(full).catch(() => {});
  }

  async getMetadata(filePath: string): Promise<Record<string, any>> {
    const full = this.resolvePath(filePath);
    const stat = await fs.stat(full);
    return { size: stat.size, mtime: stat.mtime };
  }

  async list(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    const walk = async (dir: string, rel: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath, relPath);
        } else {
          keys.push(relPath);
        }
      }
    };

    await walk(this.basePath, '');
    return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
  }

  async getSignedUrl(filePath: string): Promise<string> {
    return `/storage/${filePath}`;
  }
}
