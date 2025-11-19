"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageRepository = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("../../shared/utils/logger");
class LocalStorageRepository {
    constructor(basePath) {
        this.log = logger_1.logger.child('LocalStorage');
        this.basePath = basePath || process.env.STORAGE_LOCAL_PATH || (0, path_1.join)(process.cwd(), 'tmp-storage');
        this.log.info('LocalStorageRepository initialized', { basePath: this.basePath });
    }
    resolvePath(filePath) {
        return (0, path_1.join)(this.basePath, filePath);
    }
    async exists(filePath) {
        try {
            const full = this.resolvePath(filePath);
            await fs_1.promises.access(full);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async upload(filePath, content, options) {
        const full = this.resolvePath(filePath);
        await fs_1.promises.mkdir((0, path_1.join)(full, '..'), { recursive: true });
        await fs_1.promises.writeFile(full, typeof content === 'string' ? Buffer.from(content) : content);
        return options?.public ? `/storage/${filePath}` : filePath;
    }
    async download(filePath, options) {
        const full = this.resolvePath(filePath);
        const data = await fs_1.promises.readFile(full);
        return options?.encoding ? data.toString(options.encoding) : data;
    }
    async delete(filePath) {
        const full = this.resolvePath(filePath);
        await fs_1.promises.unlink(full).catch(() => { });
    }
    async getMetadata(filePath) {
        const full = this.resolvePath(filePath);
        const stat = await fs_1.promises.stat(full);
        return { size: stat.size, mtime: stat.mtime };
    }
    async list(prefix) {
        const dir = this.basePath;
        // simple listing: not recursive
        const files = await fs_1.promises.readdir(dir).catch(() => []);
        return files.filter((f) => (prefix ? f.startsWith(prefix) : true));
    }
    async getSignedUrl(filePath, expiresInMinutes = 60) {
        return `/storage/${filePath}`;
    }
}
exports.LocalStorageRepository = LocalStorageRepository;
//# sourceMappingURL=LocalStorageRepository.js.map