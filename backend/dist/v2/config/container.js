"use strict";
// src/v2/config/container.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
exports.createContainer = createContainer;
const logger_1 = require("../shared/utils/logger");
// Mongo configuration (mongoose) lazy import
const mongodb_1 = require("../../config/mongodb");
class Container {
    constructor() {
        this.dependencies = new Map();
        this.initialized = false;
    }
    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
    async initialize() {
        if (this.initialized) {
            logger_1.logger.info('Container already initialized');
            return;
        }
        logger_1.logger.info('Initializing DI Container...');
        const start = Date.now();
        // 1. Inicializar DB (Mongo por defecto)
        const db = await this.initializeDatabase();
        // 2. Inicializar Cache
        const cache = await this.initializeCache();
        logger_1.logger.info('Container: Firebase + Cache init completed', { elapsedMs: Date.now() - start });
        // 3. Registrar Repositories
        await this.registerRepositories(db, cache);
        // 4. Registrar Services
        await this.registerServices();
        // 5. Registrar Use Cases
        await this.registerUseCases();
        // 6. Registrar Controllers
        await this.registerControllers();
        this.initialized = true;
        logger_1.logger.info('DI Container initialized successfully', { totalMs: Date.now() - start });
    }
    async initializeDatabase() {
        const adapter = (process.env.DB_ADAPTER || 'mongo').toLowerCase();
        if (adapter === 'mongo') {
            try {
                // Initialize mongoose connection for repositories which use Mongoose models
                await (0, mongodb_1.connectMongoDB)();
                // Register both mongoose instance and native Db for consumers
                this.dependencies.set('mongoose', mongodb_1.mongoose);
                const nativeDb = mongodb_1.mongoose.connection.db;
                this.dependencies.set('mongoDb', nativeDb);
                logger_1.logger.info('MongoDB (mongoose) initialized and registered in container');
                return mongodb_1.mongoose;
            }
            catch (e) {
                logger_1.logger.error('Failed to initialize MongoDB (mongoose)', { error: e });
                throw e;
            }
        }
        // If a different adapter is requested, fail fast: Firestore support removed.
        throw new Error('Only MongoDB adapter is supported. Set DB_ADAPTER=mongo or unset DB_ADAPTER.');
    }
    async initializeCache() {
        const cacheType = process.env.CACHE_TYPE || 'memory';
        const redisUrl = process.env.REDIS_URL;
        let cache;
        if (cacheType === 'redis' && redisUrl) {
            logger_1.logger.info('Initializing Redis cache', { url: redisUrl });
            const { CacheFactory } = await Promise.resolve().then(() => __importStar(require('../infrastructure/cache/CacheFactory')));
            cache = CacheFactory.create({
                type: 'redis',
                redisUrl,
                redisOptions: {
                    maxRetries: 10,
                    connectTimeout: 10000,
                },
            });
            // Conectar Redis
            // If the returned cache exposes a `connect` method, try to connect but
            // don't throw — fall back silently to in-memory if connection fails.
            if (typeof cache.connect === 'function') {
                try {
                    // Avoid attempting to connect when running in the Functions emulator
                    // discovery phase. Honor an explicit env var to skip connections.
                    const skipConnect = process.env.SKIP_CACHE_CONNECT === '1' || process.env.SKIP_CACHE_CONNECT === 'true';
                    if (!skipConnect) {
                        const cacheConnectTimeout = Number(process.env.CACHE_CONNECT_TIMEOUT_MS) || 8000;
                        logger_1.logger.info('Attempting Redis connect', { timeoutMs: cacheConnectTimeout });
                        await Promise.race([
                            cache.connect(),
                            new Promise((_, rej) => setTimeout(() => rej(new Error(`Redis connect timed out after ${cacheConnectTimeout}ms`)), cacheConnectTimeout)),
                        ]);
                        logger_1.logger.info('Redis cache connected');
                    }
                    else {
                        logger_1.logger.info('Skipping cache connect due to SKIP_CACHE_CONNECT');
                    }
                }
                catch (error) {
                    logger_1.logger.error('Failed to connect Redis, falling back to in-memory', error);
                    const { InMemoryCache } = await Promise.resolve().then(() => __importStar(require('../infrastructure/cache/InMemoryCache')));
                    cache = new InMemoryCache();
                }
            }
        }
        else {
            logger_1.logger.info('Using in-memory cache');
            const { InMemoryCache } = await Promise.resolve().then(() => __importStar(require('../infrastructure/cache/InMemoryCache')));
            cache = new InMemoryCache();
        }
        // Store under `cacheRepository` key to match consumers below
        this.dependencies.set('cacheRepository', cache);
        return cache;
    }
    async registerRepositories(db, cache) {
        // Register repositories depending on DB_ADAPTER
        const adapter = (process.env.DB_ADAPTER || 'mongo').toLowerCase();
        if (adapter === 'mongo') {
            const { MongoChannelRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/MongoChannelRepository')));
            const { MongoProgramRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/MongoProgramRepository')));
            const channelRepository = new MongoChannelRepository();
            this.dependencies.set('channelRepository', channelRepository);
            const programRepository = new MongoProgramRepository();
            this.dependencies.set('programRepository', programRepository);
        }
        else {
            // Other adapters (legacy Firestore support removed). Attempt to load
            // Firestore-backed repositories if present, but call constructors
            // without passing a DB object to match the runtime stubs.
            const { FirestoreChannelRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/FirestoreChannelRepository')));
            const { FirestoreProgramRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/FirestoreProgramRepository')));
            const channelRepository = new FirestoreChannelRepository();
            this.dependencies.set('channelRepository', channelRepository);
            const programRepository = new FirestoreProgramRepository();
            this.dependencies.set('programRepository', programRepository);
        }
        // Cache Repository (already stored by initializeCache, ensure consistent key)
        this.dependencies.set('cacheRepository', cache);
        // Storage Repository selection
        const storageAdapter = (process.env.STORAGE_ADAPTER || 'gcs').toLowerCase();
        if (storageAdapter === 's3') {
            const { S3StorageRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/storage/S3StorageRepository')));
            const bucket = process.env.AWS_S3_BUCKET || process.env.STORAGE_BUCKET || 'guia-tv-8fe3c';
            const repo = new S3StorageRepository(bucket, process.env.AWS_REGION);
            this.dependencies.set('storageRepository', repo);
        }
        else if (storageAdapter === 'local') {
            const { LocalStorageRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/storage/LocalStorageRepository')));
            const repo = new LocalStorageRepository(process.env.STORAGE_LOCAL_PATH);
            this.dependencies.set('storageRepository', repo);
        }
        else {
            const { CloudStorageRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/CloudStorageRepository')));
            const storageRepository = new CloudStorageRepository(process.env.STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com');
            this.dependencies.set('storageRepository', storageRepository);
        }
        logger_1.logger.info('Repositories registered');
    }
    async registerServices() {
        const { ChannelService } = await Promise.resolve().then(() => __importStar(require('../domain/services/ChannelService')));
        const { ProgramService } = await Promise.resolve().then(() => __importStar(require('../domain/services/ProgramService')));
        const channelRepository = this.get('channelRepository');
        const channelService = new ChannelService(channelRepository);
        this.dependencies.set('channelService', channelService);
        const programService = new ProgramService();
        this.dependencies.set('programService', programService);
        logger_1.logger.info('Services registered');
    }
    async registerUseCases() {
        const channelRepository = this.get('channelRepository');
        const programRepository = this.get('programRepository');
        const cacheRepository = this.get('cacheRepository');
        const channelService = this.get('channelService');
        const programService = this.get('programService');
        const { GetAllChannels } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetAllChannels')));
        const { GetChannelById } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetChannelById')));
        const { GetProgramsByDate } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetProgramsByDate')));
        const { GetChannelPrograms } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetChannelPrograms')));
        const { SyncProgramData } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/SyncProgramData')));
        const { XMLParser } = await Promise.resolve().then(() => __importStar(require('../infrastructure/parsers/XMLParser')));
        const { ProgramDataParser } = await Promise.resolve().then(() => __importStar(require('../infrastructure/parsers/ProgramDataParser')));
        const { SyncEPGData } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/SyncEPGData')));
        const { PrecomputeSchedule } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/PrecomputeSchedule')));
        const { CleanOldPrograms } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/CleanOldPrograms')));
        // Channel Use Cases
        const getAllChannels = new GetAllChannels(channelRepository, cacheRepository, channelService);
        this.dependencies.set('getAllChannels', getAllChannels);
        const getChannelById = new GetChannelById(channelRepository, cacheRepository);
        this.dependencies.set('getChannelById', getChannelById);
        // Program Use Cases
        const getProgramsByDate = new GetProgramsByDate(programRepository, cacheRepository);
        this.dependencies.set('getProgramsByDate', getProgramsByDate);
        const getChannelPrograms = new GetChannelPrograms(programRepository, cacheRepository, programService);
        this.dependencies.set('getChannelPrograms', getChannelPrograms);
        const syncProgramData = new SyncProgramData(programRepository, cacheRepository);
        this.dependencies.set('syncProgramData', syncProgramData);
        // ETL Use Cases — use the storage repository already registered in registerRepositories
        const storageRepository = this.get('storageRepository');
        const xmlParser = new XMLParser();
        this.dependencies.set('xmlParser', xmlParser);
        const programParser = new ProgramDataParser();
        this.dependencies.set('programParser', programParser);
        const syncEPGData = new SyncEPGData(channelRepository, programRepository, cacheRepository, storageRepository, xmlParser, programParser);
        this.dependencies.set('syncEPGData', syncEPGData);
        const precomputeSchedule = new PrecomputeSchedule(this.get('getProgramsByDate'), this.get('getAllChannels'), programService, storageRepository);
        this.dependencies.set('precomputeSchedule', precomputeSchedule);
        const cleanOldPrograms = new CleanOldPrograms(programRepository);
        this.dependencies.set('cleanOldPrograms', cleanOldPrograms);
        logger_1.logger.info('Use Cases registered');
    }
    async registerControllers() {
        const getAllChannels = this.get('getAllChannels');
        const getChannelById = this.get('getChannelById');
        const getProgramsByDate = this.get('getProgramsByDate');
        const getChannelPrograms = this.get('getChannelPrograms');
        const programService = this.get('programService');
        const { ChannelController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/ChannelController')));
        const { ProgramController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/ProgramController')));
        const { ScheduleController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/ScheduleController')));
        const { AdminController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/AdminController')));
        // Channel Controller
        const channelController = new ChannelController(getAllChannels, getChannelById);
        this.dependencies.set('channelController', channelController);
        // Program Controller
        const programController = new ProgramController(getProgramsByDate, getChannelPrograms, getChannelById);
        this.dependencies.set('programController', programController);
        // Schedule Controller
        const scheduleController = new ScheduleController(getProgramsByDate, getAllChannels, programService);
        this.dependencies.set('scheduleController', scheduleController);
        // Admin Controller
        const adminController = new AdminController(this.get('syncEPGData'), this.get('precomputeSchedule'), this.get('cleanOldPrograms'), this.get('cacheRepository'));
        this.dependencies.set('adminController', adminController);
        logger_1.logger.info('Controllers registered');
    }
    get(key) {
        const dependency = this.dependencies.get(key);
        if (!dependency) {
            throw new Error(`Dependency '${key}' not found in container`);
        }
        return dependency;
    }
    has(key) {
        return this.dependencies.has(key);
    }
    async cleanup() {
        logger_1.logger.info('Cleaning up container...');
        const cache = this.dependencies.get('cache');
        // Avoid relying on concrete class identity; instead check for
        // lifecycle methods and call them if present.
        if (cache && typeof cache.disconnect === 'function') {
            try {
                await cache.disconnect();
            }
            catch (e) {
                logger_1.logger.warn('Error while disconnecting cache', { error: e });
            }
        }
        if (cache && typeof cache.destroy === 'function') {
            try {
                cache.destroy();
            }
            catch (e) {
                logger_1.logger.warn('Error while destroying cache', { error: e });
            }
        }
        this.dependencies.clear();
        this.initialized = false;
        logger_1.logger.info('Container cleaned up');
    }
}
exports.Container = Container;
// Export a factory helper instead of creating or initializing the container
// at module import time. Callers should obtain the instance and call
// `initialize()` when they actually handle a request or when running the
// scheduled task. Example:
// const container = createContainer();
// await container.initialize();
function createContainer() {
    return Container.getInstance();
}
//# sourceMappingURL=container.js.map