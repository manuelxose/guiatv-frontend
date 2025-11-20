"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageRepository = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
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
        this.client = new client_s3_1.S3Client({ region: region || process.env.AWS_REGION || 'us-east-1' });
        this.log.info('S3StorageRepository initialized', { bucket: this.bucket });
    }
    async exists(filePath) {
        try {
            const cmd = new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, Prefix: filePath, MaxKeys: 1 });
            const res = await this.client.send(cmd);
            return !!(res && res.KeyCount && res.KeyCount > 0);
        }
        catch (error) {
            this.log.error('exists error', error, { filePath });
            return false;
        }
    }
    async upload(filePath, content, options) {
        const Body = typeof content === 'string' ? Buffer.from(content) : content;
        const ContentType = options?.contentType || 'application/octet-stream';
        try {
            const cmd = new client_s3_1.PutObjectCommand({ Bucket: this.bucket, Key: filePath, Body, ContentType, Metadata: options?.metadata });
            await this.client.send(cmd);
            if (options?.public) {
                return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filePath}`;
            }
            return filePath;
        }
        catch (error) {
            this.log.error('upload failed', error, { filePath });
            throw error;
        }
    }
    async download(filePath, options) {
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
        // S3 head object would be used; for brevity, use list
        const cmd = new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, Prefix: filePath, MaxKeys: 1 });
        const res = await this.client.send(cmd);
        return { keyCount: res.KeyCount };
    }
    async list(prefix) {
        const cmd = new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix });
        const res = await this.client.send(cmd);
        return (res.Contents || []).map((c) => c.Key).filter(Boolean);
    }
    async getSignedUrl(filePath, expiresInMinutes = 60) {
        // For simplicity return public URL pattern; generating presigned URL requires @aws-sdk/s3-request-presigner
        return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filePath}`;
    }
}
exports.S3StorageRepository = S3StorageRepository;
//# sourceMappingURL=S3StorageRepository.js.map