import { promises as fs } from 'fs';
import { join } from 'path';
import { IStorageRepository, UploadOptions, DownloadOptions } from '@v2/domain/repositories/IStorageRepository';
import { logger } from '../../shared/utils/logger';

export class LocalStorageRepository implements IStorageRepository {
  private basePath: string;
  private log = logger.child('LocalStorage');

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'tmp-storage');
    this.log.info('LocalStorageRepository initialized', { basePath: this.basePath });
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
    await fs.mkdir(join(full, '..'), { recursive: true });
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
    const dir = this.basePath;
    // simple listing: not recursive
    const files = await fs.readdir(dir).catch(() => []);
    return files.filter((f) => (prefix ? f.startsWith(prefix) : true));
  }

  async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
    return `/storage/${filePath}`;
  }
}
