"use strict";
// src/v2/infrastructure/storage/CloudStorageRepository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudStorageRepository = void 0;
const logger_1 = require("../../shared/utils/logger");
class CloudStorageRepository {
    constructor(bucketName) {
        this.storageLogger = logger_1.logger.child('CloudStorage');
        // If running with the Storage emulator, set apiEndpoint so @google-cloud/storage
        // connects to the emulator instead of production.
        // Dynamically require to avoid hard dependency on @google-cloud/storage at build time.
        // If not installed, throw a descriptive error when used.
        let StoragePkg;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            StoragePkg = require('@google-cloud/storage');
        }
        catch (e) {
            throw new Error('Module @google-cloud/storage is not installed. Install it or use STORAGE_ADAPTER=s3|local');
        }
        const { Storage } = StoragePkg;
        const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
        this.storage = emulatorHost ? new Storage({ apiEndpoint: emulatorHost }) : new Storage();
        this.bucket = this.storage.bucket(bucketName);
        this.storageLogger.info('CloudStorageRepository initialized', {
            bucketName,
        });
    }
    async exists(filePath) {
        try {
            const file = this.bucket.file(filePath);
            const [exists] = await file.exists();
            return exists;
        }
        catch (error) {
            this.storageLogger.error('Error checking file existence', error, { filePath });
            return false;
        }
    }
    async upload(filePath, content, options) {
        try {
            const file = this.bucket.file(filePath);
            const uploadOptions = {
                contentType: options?.contentType || 'application/octet-stream',
                metadata: {
                    metadata: options?.metadata || {},
                },
            };
            if (options?.public) {
                uploadOptions.public = true;
            }
            await file.save(typeof content === 'string' ? Buffer.from(content) : content, uploadOptions);
            this.storageLogger.info('File uploaded successfully', { filePath });
            return options?.public ? file.publicUrl() : filePath;
        }
        catch (error) {
            this.storageLogger.error('Failed to upload file', error, {
                filePath,
            });
            throw error;
        }
    }
    async download(filePath, options) {
        try {
            const file = this.bucket.file(filePath);
            const [content] = await file.download();
            this.storageLogger.info('File downloaded successfully', {
                filePath,
                size: content.length,
            });
            return options?.encoding ? content.toString(options.encoding) : content;
        }
        catch (error) {
            this.storageLogger.error('Failed to download file', error, {
                filePath,
            });
            throw error;
        }
    }
    async delete(filePath) {
        try {
            const file = this.bucket.file(filePath);
            await file.delete();
            this.storageLogger.info('File deleted successfully', { filePath });
        }
        catch (error) {
            this.storageLogger.error('Failed to delete file', error, {
                filePath,
            });
            throw error;
        }
    }
    async getMetadata(filePath) {
        try {
            const file = this.bucket.file(filePath);
            const [metadata] = await file.getMetadata();
            return metadata;
        }
        catch (error) {
            this.storageLogger.error('Failed to get metadata', error, {
                filePath,
            });
            throw error;
        }
    }
    async list(prefix) {
        try {
            const [files] = await this.bucket.getFiles({ prefix });
            return files.map((file) => file.name);
        }
        catch (error) {
            this.storageLogger.error('Failed to list files', error, {
                prefix,
            });
            throw error;
        }
    }
    async getSignedUrl(filePath, expiresInMinutes = 60) {
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
        }
        catch (error) {
            this.storageLogger.error('Failed to generate signed URL', error, { filePath });
            throw error;
        }
    }
    async createWriteStream(filePath, options) {
        const file = this.bucket.file(filePath);
        return file.createWriteStream({
            contentType: options?.contentType || 'application/octet-stream',
            metadata: {
                metadata: options?.metadata || {},
            },
            public: options?.public || false,
        });
    }
    async createReadStream(filePath) {
        const file = this.bucket.file(filePath);
        return file.createReadStream();
    }
}
exports.CloudStorageRepository = CloudStorageRepository;
//# sourceMappingURL=CloudStorageRepository.js.map