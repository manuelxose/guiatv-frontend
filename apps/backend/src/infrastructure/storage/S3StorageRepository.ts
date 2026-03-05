import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { IStorageRepository, UploadOptions, DownloadOptions } from '@/domain/repositories/IStorageRepository';
import { logger } from '../../shared/utils/logger';

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export class S3StorageRepository implements IStorageRepository {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private log = logger.child('S3Storage');

  constructor(bucket: string, region?: string) {
    this.bucket = bucket;
    this.region = region || process.env.AWS_REGION || 'us-east-1';
    this.client = new S3Client({ region: this.region });
    this.log.info('S3StorageRepository initialized', { bucket: this.bucket, region: this.region });
  }

  private ensureBucket(): void {
    if (!this.bucket) {
      throw new Error('S3 bucket is not configured');
    }
  }

  private publicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(filePath: string): Promise<boolean> {
    this.ensureBucket();
    try {
      const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: filePath });
      await this.client.send(cmd);
      return true;
    } catch (error: any) {
      if (error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      this.log.error('exists error', error as Error, { filePath });
      return false;
    }
  }

  async upload(filePath: string, content: Buffer | string, options?: UploadOptions): Promise<string> {
    this.ensureBucket();
    const Body = typeof content === 'string' ? Buffer.from(content) : content;
    const ContentType = options?.contentType || 'application/octet-stream';

    try {
      const cmd = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body,
        ContentType,
        Metadata: options?.metadata,
        ACL: options?.public ? 'public-read' : undefined,
      });
      await this.client.send(cmd);
      return options?.public ? this.publicUrl(filePath) : filePath;
    } catch (error) {
      this.log.error('upload failed', error as Error, { filePath });
      throw error;
    }
  }

  async download(filePath: string, options?: DownloadOptions): Promise<Buffer | string> {
    this.ensureBucket();
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: filePath });
      const res = await this.client.send(cmd);
      const body = res.Body as Readable;
      const buf = await streamToBuffer(body);
      return options?.encoding ? buf.toString(options.encoding) : buf;
    } catch (error) {
      this.log.error('download failed', error as Error, { filePath });
      throw error;
    }
  }

  async delete(filePath: string): Promise<void> {
    this.ensureBucket();
    try {
      const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: filePath });
      await this.client.send(cmd);
    } catch (error) {
      this.log.error('delete failed', error as Error, { filePath });
      throw error;
    }
  }

  async getMetadata(filePath: string): Promise<Record<string, any>> {
    this.ensureBucket();
    try {
      const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: filePath });
      const res = await this.client.send(cmd);
      return {
        contentLength: res.ContentLength,
        contentType: res.ContentType,
        lastModified: res.LastModified,
        metadata: res.Metadata,
      };
    } catch (error) {
      this.log.error('getMetadata failed', error as Error, { filePath });
      throw error;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    this.ensureBucket();
    const keys: string[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const cmd = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });
        const res = await this.client.send(cmd);
        keys.push(...(res.Contents || []).map((c) => c.Key!).filter(Boolean));
        continuationToken = res.NextContinuationToken;
      } while (continuationToken);

      return keys;
    } catch (error) {
      this.log.error('list failed', error as Error, { prefix });
      throw error;
    }
  }

  async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
    this.ensureBucket();
    const expiresInSeconds = Math.max(60, expiresInMinutes * 60);
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: filePath });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }
}
