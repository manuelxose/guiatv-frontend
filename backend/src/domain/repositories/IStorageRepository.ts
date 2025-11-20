// src/v2/domain/repositories/IStorageRepository.ts

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
}

export interface DownloadOptions {
  encoding?: BufferEncoding;
}

export interface IStorageRepository {
  exists(filePath: string): Promise<boolean>;

  upload(
    filePath: string,
    content: Buffer | string,
    options?: UploadOptions
  ): Promise<string>;

  download(
    filePath: string,
    options?: DownloadOptions
  ): Promise<Buffer | string>;

  delete(filePath: string): Promise<void>;

  getMetadata(filePath: string): Promise<Record<string, any>>;

  list(prefix?: string): Promise<string[]>;

  getSignedUrl(filePath: string, expiresInMinutes?: number): Promise<string>;
}
