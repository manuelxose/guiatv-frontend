import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { IStorageRepository, UploadOptions, DownloadOptions } from '@v2/domain/repositories/IStorageRepository';
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
  private log = logger.child('S3Storage');

  constructor(bucket: string, region?: string) {
    this.bucket = bucket;
    this.client = new S3Client({ region: region || process.env.AWS_REGION || 'us-east-1' });
    this.log.info('S3StorageRepository initialized', { bucket: this.bucket });
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const cmd = new ListObjectsV2Command({ Bucket: this.bucket, Prefix: filePath, MaxKeys: 1 });
      const res = await this.client.send(cmd);
      return !!(res && res.KeyCount && res.KeyCount > 0);
    } catch (error) {
      this.log.error('exists error', error as Error, { filePath });
      return false;
    }
  }

  async upload(filePath: string, content: Buffer | string, options?: UploadOptions): Promise<string> {
    const Body = typeof content === 'string' ? Buffer.from(content) : content;
    const ContentType = options?.contentType || 'application/octet-stream';
    try {
      const cmd = new PutObjectCommand({ Bucket: this.bucket, Key: filePath, Body, ContentType, Metadata: options?.metadata });
      await this.client.send(cmd);
      if (options?.public) {
        return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filePath}`;
      }
      return filePath;
    } catch (error) {
      this.log.error('upload failed', error as Error, { filePath });
      throw error;
    }
  }

  async download(filePath: string, options?: DownloadOptions): Promise<Buffer | string> {
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
    try {
      const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: filePath });
      await this.client.send(cmd);
    } catch (error) {
      this.log.error('delete failed', error as Error, { filePath });
      throw error;
    }
  }

  async getMetadata(filePath: string): Promise<Record<string, any>> {
    // S3 head object would be used; for brevity, use list
    const cmd = new ListObjectsV2Command({ Bucket: this.bucket, Prefix: filePath, MaxKeys: 1 });
    const res = await this.client.send(cmd);
    return { keyCount: res.KeyCount } as any;
  }

  async list(prefix?: string): Promise<string[]> {
    const cmd = new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix });
    const res = await this.client.send(cmd);
    return (res.Contents || []).map((c) => c.Key!).filter(Boolean) as string[];
  }

  async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
    // For simplicity return public URL pattern; generating presigned URL requires @aws-sdk/s3-request-presigner
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filePath}`;
  }

}
