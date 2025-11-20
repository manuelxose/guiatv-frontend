"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageRepository = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("../../shared/utils/logger");
class LocalStorageRepository {
    constructor(basePath) {
        this.log = logger_1.logger.child('LocalStorage');
        this.basePath = (0, path_1.resolve)(basePath || process.env.STORAGE_LOCAL_PATH || (0, path_1.join)(process.cwd(), 'tmp-storage'));
        this.ensureBasePath().catch((error) => this.log.warn('Failed to ensure local storage path', { error }));
        this.log.info('LocalStorageRepository initialized', { basePath: this.basePath });
    }
    async ensureBasePath() {
        await fs_1.promises.mkdir(this.basePath, { recursive: true });
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
        await fs_1.promises.mkdir((0, path_1.dirname)(full), { recursive: true });
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
        const keys = [];
        const walk = async (dir, rel) => {
            const entries = await fs_1.promises.readdir(dir, { withFileTypes: true }).catch(() => []);
            for (const entry of entries) {
                const relPath = rel ? `${rel}/${entry.name}` : entry.name;
                const fullPath = (0, path_1.join)(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(fullPath, relPath);
                }
                else {
                    keys.push(relPath);
                }
            }
        };
        await walk(this.basePath, '');
        return prefix ? keys.filter((k) => k.startsWith(prefix)) : keys;
    }
    async getSignedUrl(filePath) {
        return `/storage/${filePath}`;
    }
}
exports.LocalStorageRepository = LocalStorageRepository;
//# sourceMappingURL=LocalStorageRepository.js.map