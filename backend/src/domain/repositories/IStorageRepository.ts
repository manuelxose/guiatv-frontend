// src/v2/domain/repositories/IStorageRepository.ts

/**
 * Optional parameters to customize uploads.
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
}

/**
 * Optional parameters to customize downloads.
 */
export interface DownloadOptions {
  encoding?: BufferEncoding;
}

/**
 * Storage abstraction used by the application layer to persist assets.
 */
export interface IStorageRepository {
  /**
   * Checks whether a given path exists in the storage backend.
   */
  exists(filePath: string): Promise<boolean>;

  /**
   * Uploads content to a target path.
   *
   * @returns The public or internal URL of the uploaded asset.
   */
  upload(
    filePath: string,
    content: Buffer | string,
    options?: UploadOptions
  ): Promise<string>;

  /**
   * Downloads the content at the given path.
   */
  download(
    filePath: string,
    options?: DownloadOptions
  ): Promise<Buffer | string>;

  /**
   * Removes a file from storage.
   */
  delete(filePath: string): Promise<void>;

  /**
   * Retrieves backend-specific metadata (size, content type, etc.).
   */
  getMetadata(filePath: string): Promise<Record<string, any>>;

  /**
   * Lists available objects under a prefix.
   */
  list(prefix?: string): Promise<string[]>;

  /**
   * Creates a time-bounded signed URL for temporary access.
   */
  getSignedUrl(filePath: string, expiresInMinutes?: number): Promise<string>;
}
