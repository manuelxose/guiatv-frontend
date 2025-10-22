// src/v2/infrastructure/storage/CloudStorageRepository.ts

import { Storage, Bucket } from '@google-cloud/storage';
import { logger } from '../../shared/utils/logger';
import { IStorageRepository } from '@v2/domain/repositories/IStorageRepository';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
}

export interface DownloadOptions {
  encoding?: BufferEncoding;
}

export class CloudStorageRepository implements IStorageRepository {
  private readonly storage: Storage;
  private readonly bucket: Bucket;
  private readonly storageLogger = logger.child('CloudStorage');

  constructor(bucketName: string) {
    this.storage = new Storage();
    this.bucket = this.storage.bucket(bucketName);
    this.storageLogger.info('CloudStorageRepository initialized', {
      bucketName,
    });
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.storageLogger.error(
        'Error checking file existence',
        error as Error,
        { filePath }
      );
      return false;
    }
  }

  async upload(
    filePath: string,
    content: Buffer | string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const file = this.bucket.file(filePath);

      const uploadOptions: any = {
        contentType: options?.contentType || 'application/octet-stream',
        metadata: {
          metadata: options?.metadata || {},
        },
      };

      if (options?.public) {
        uploadOptions.public = true;
      }

      await file.save(
        typeof content === 'string' ? Buffer.from(content) : content,
        uploadOptions
      );

      this.storageLogger.info('File uploaded successfully', { filePath });

      return options?.public ? file.publicUrl() : filePath;
    } catch (error) {
      this.storageLogger.error('Failed to upload file', error as Error, {
        filePath,
      });
      throw error;
    }
  }

  async download(
    filePath: string,
    options?: DownloadOptions
  ): Promise<Buffer | string> {
    try {
      const file = this.bucket.file(filePath);
      const [content] = await file.download();

      this.storageLogger.info('File downloaded successfully', {
        filePath,
        size: content.length,
      });

      return options?.encoding ? content.toString(options.encoding) : content;
    } catch (error) {
      this.storageLogger.error('Failed to download file', error as Error, {
        filePath,
      });
      throw error;
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      this.storageLogger.info('File deleted successfully', { filePath });
    } catch (error) {
      this.storageLogger.error('Failed to delete file', error as Error, {
        filePath,
      });
      throw error;
    }
  }

  async getMetadata(filePath: string): Promise<Record<string, any>> {
    try {
      const file = this.bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      this.storageLogger.error('Failed to get metadata', error as Error, {
        filePath,
      });
      throw error;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({ prefix });
      return files.map((file) => file.name);
    } catch (error) {
      this.storageLogger.error('Failed to list files', error as Error, {
        prefix,
      });
      throw error;
    }
  }

  async getSignedUrl(
    filePath: string,
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      const file = this.bucket.file(filePath);
      const expires = Date.now() + expiresInMinutes * 60 * 1000;

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires,
      });

      this.storageLogger.info('Generated signed URL', {
        filePath,
        expiresInMinutes,
      });

      return signedUrl;
    } catch (error) {
      this.storageLogger.error(
        'Failed to generate signed URL',
        error as Error,
        { filePath }
      );
      throw error;
    }
  }

  async createWriteStream(
    filePath: string,
    options?: UploadOptions
  ): Promise<any> {
    const file = this.bucket.file(filePath);

    return file.createWriteStream({
      contentType: options?.contentType || 'application/octet-stream',
      metadata: {
        metadata: options?.metadata || {},
      },
      public: options?.public || false,
    });
  }

  async createReadStream(filePath: string): Promise<any> {
    const file = this.bucket.file(filePath);
    return file.createReadStream();
  }
}
