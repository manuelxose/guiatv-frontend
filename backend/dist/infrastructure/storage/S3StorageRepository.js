"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageRepository = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = require("../../shared/utils/logger");
function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
class S3StorageRepository {
    constructor(bucket, region) {
        this.log = logger_1.logger.child('S3Storage');
        this.bucket = bucket;
        this.region = region || process.env.AWS_REGION || 'us-east-1';
        this.client = new client_s3_1.S3Client({ region: this.region });
        this.log.info('S3StorageRepository initialized', { bucket: this.bucket, region: this.region });
    }
    ensureBucket() {
        if (!this.bucket) {
            throw new Error('S3 bucket is not configured');
        }
    }
    publicUrl(key) {
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    async exists(filePath) {
        this.ensureBucket();
        try {
            const cmd = new client_s3_1.HeadObjectCommand({ Bucket: this.bucket, Key: filePath });
            await this.client.send(cmd);
            return true;
        }
        catch (error) {
            if (error?.$metadata?.httpStatusCode === 404) {
                return false;
            }
            this.log.error('exists error', error, { filePath });
            return false;
        }
    }
    async upload(filePath, content, options) {
        this.ensureBucket();
        const Body = typeof content === 'string' ? Buffer.from(content) : content;
        const ContentType = options?.contentType || 'application/octet-stream';
        try {
            const cmd = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
                Body,
                ContentType,
                Metadata: options?.metadata,
                ACL: options?.public ? 'public-read' : undefined,
            });
            await this.client.send(cmd);
            return options?.public ? this.publicUrl(filePath) : filePath;
        }
        catch (error) {
            this.log.error('upload failed', error, { filePath });
            throw error;
        }
    }
    async download(filePath, options) {
        this.ensureBucket();
        try {
            const cmd = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: filePath });
            const res = await this.client.send(cmd);
            const body = res.Body;
            const buf = await streamToBuffer(body);
            return options?.encoding ? buf.toString(options.encoding) : buf;
        }
        catch (error) {
            this.log.error('download failed', error, { filePath });
            throw error;
        }
    }
    async delete(filePath) {
        this.ensureBucket();
        try {
            const cmd = new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: filePath });
            await this.client.send(cmd);
        }
        catch (error) {
            this.log.error('delete failed', error, { filePath });
            throw error;
        }
    }
    async getMetadata(filePath) {
        this.ensureBucket();
        try {
            const cmd = new client_s3_1.HeadObjectCommand({ Bucket: this.bucket, Key: filePath });
            const res = await this.client.send(cmd);
            return {
                contentLength: res.ContentLength,
                contentType: res.ContentType,
                lastModified: res.LastModified,
                metadata: res.Metadata,
            };
        }
        catch (error) {
            this.log.error('getMetadata failed', error, { filePath });
            throw error;
        }
    }
    async list(prefix) {
        this.ensureBucket();
        const keys = [];
        let continuationToken;
        try {
            do {
                const cmd = new client_s3_1.ListObjectsV2Command({
                    Bucket: this.bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                });
                const res = await this.client.send(cmd);
                keys.push(...(res.Contents || []).map((c) => c.Key).filter(Boolean));
                continuationToken = res.NextContinuationToken;
            } while (continuationToken);
            return keys;
        }
        catch (error) {
            this.log.error('list failed', error, { prefix });
            throw error;
        }
    }
    async getSignedUrl(filePath, expiresInMinutes = 60) {
        this.ensureBucket();
        const expiresInSeconds = Math.max(60, expiresInMinutes * 60);
        const cmd = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: filePath });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn: expiresInSeconds });
    }
}
exports.S3StorageRepository = S3StorageRepository;
//# sourceMappingURL=S3StorageRepository.js.map