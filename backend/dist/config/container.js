"use strict";
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
const mongodb_1 = require("./mongodb");
const initializeMongoCollections_1 = require("../infrastructure/database/initializeMongoCollections");
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
        await this.initializeDatabase();
        const cache = await this.initializeCache();
        await this.registerRepositories(cache);
        await this.registerServices();
        await this.registerUseCases();
        await this.registerControllers();
        this.initialized = true;
        logger_1.logger.info('DI Container initialized successfully', { totalMs: Date.now() - start });
    }
    async initializeDatabase() {
        try {
            await (0, mongodb_1.connectMongoDB)();
            this.dependencies.set('mongoose', mongodb_1.mongoose);
            const nativeDb = mongodb_1.mongoose.connection.db;
            this.dependencies.set('mongoDb', nativeDb);
            await (0, initializeMongoCollections_1.ensureMongoCollectionsAndIndexes)();
            logger_1.logger.info('MongoDB (mongoose) initialized and registered in container');
        }
        catch (e) {
            logger_1.logger.error('Failed to initialize MongoDB (mongoose)', { error: e });
            throw e;
        }
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
            if (typeof cache.connect === 'function') {
                try {
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
        this.dependencies.set('cacheRepository', cache);
        return cache;
    }
    async registerRepositories(cache) {
        const { MongoChannelRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/MongoChannelRepository')));
        const { MongoProgramRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/MongoProgramRepository')));
        const { MongoUserRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/repositories/MongoUserRepository')));
        const channelRepository = new MongoChannelRepository();
        this.dependencies.set('channelRepository', channelRepository);
        const programRepository = new MongoProgramRepository();
        this.dependencies.set('programRepository', programRepository);
        const userRepository = new MongoUserRepository();
        this.dependencies.set('userRepository', userRepository);
        // Cache Repository (already stored by initializeCache, ensure consistent key)
        this.dependencies.set('cacheRepository', cache);
        const storageAdapter = (process.env.STORAGE_ADAPTER || 'local').toLowerCase();
        if (storageAdapter === 's3') {
            const { S3StorageRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/storage/S3StorageRepository')));
            const bucket = process.env.AWS_S3_BUCKET || process.env.STORAGE_BUCKET;
            if (!bucket) {
                throw new Error('AWS_S3_BUCKET is required when STORAGE_ADAPTER=s3');
            }
            const repo = new S3StorageRepository(bucket, process.env.AWS_REGION);
            this.dependencies.set('storageRepository', repo);
        }
        else if (storageAdapter === 'local') {
            const { LocalStorageRepository } = await Promise.resolve().then(() => __importStar(require('../infrastructure/storage/LocalStorageRepository')));
            const repo = new LocalStorageRepository(process.env.STORAGE_LOCAL_PATH);
            this.dependencies.set('storageRepository', repo);
        }
        else {
            throw new Error('Unsupported STORAGE_ADAPTER. Use "s3" or "local".');
        }
        logger_1.logger.info('Repositories registered');
    }
    async registerServices() {
        const { ChannelService } = await Promise.resolve().then(() => __importStar(require('../domain/services/ChannelService')));
        const { ProgramService } = await Promise.resolve().then(() => __importStar(require('../domain/services/ProgramService')));
        const { TMDBService } = await Promise.resolve().then(() => __importStar(require('../infrastructure/external/TMDBService')));
        const { AuthService } = await Promise.resolve().then(() => __importStar(require('../domain/services/AuthService')));
        const channelRepository = this.get('channelRepository');
        const channelService = new ChannelService(channelRepository);
        this.dependencies.set('channelService', channelService);
        const programService = new ProgramService();
        this.dependencies.set('programService', programService);
        // Use env var or fallback to the known token (temporary)
        const tmdbApiKey = process.env.TMDB_API_KEY || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNmE2MGE5YmRkZmZhZmU1YmMzZjZmNzAwZjIxZDBiMyIsInN1YiI6IjY1OGZmOWJlNDFhNTYxNjY3NTA0NzhmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.A6Pj5IuTllkQRXivh_KMmlHrKAnkh6NvJTiaEPYBAO8';
        const tmdbService = new TMDBService(tmdbApiKey);
        this.dependencies.set('tmdbService', tmdbService);
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
        const authService = new AuthService(googleClientId, jwtSecret, this.get('userRepository'));
        this.dependencies.set('authService', authService);
        logger_1.logger.info('Services registered');
    }
    async registerUseCases() {
        const channelRepository = this.get('channelRepository');
        const programRepository = this.get('programRepository');
        const cacheRepository = this.get('cacheRepository');
        const channelService = this.get('channelService');
        const tmdbService = this.get('tmdbService');
        const { GetAllChannels } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetAllChannels')));
        const { GetChannelById } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetChannelById')));
        const { GetPrograms } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetPrograms')));
        const { GetProgramLayouts } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetProgramLayouts')));
        const { GetProgramById } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetProgramById')));
        const { SyncProgramData } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/SyncProgramData')));
        const { XMLParser } = await Promise.resolve().then(() => __importStar(require('../infrastructure/parsers/XMLParser')));
        const { ProgramDataParser } = await Promise.resolve().then(() => __importStar(require('../infrastructure/parsers/ProgramDataParser')));
        const { SyncEPGData } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/SyncEPGData')));
        const { PrecomputeSchedule } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/PrecomputeSchedule')));
        const { CleanOldPrograms } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/CleanOldPrograms')));
        const { GetNowPlaying } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/GetNowPlaying')));
        const { ResetSystem } = await Promise.resolve().then(() => __importStar(require('../application/use-cases/ResetSystem')));
        const getAllChannels = new GetAllChannels(channelRepository, cacheRepository, channelService);
        this.dependencies.set('getAllChannels', getAllChannels);
        const getChannelById = new GetChannelById(channelRepository, cacheRepository);
        this.dependencies.set('getChannelById', getChannelById);
        const getPrograms = new GetPrograms(programRepository, channelRepository, cacheRepository);
        this.dependencies.set('getPrograms', getPrograms);
        const getProgramLayouts = new GetProgramLayouts(cacheRepository, getPrograms);
        this.dependencies.set('getProgramLayouts', getProgramLayouts);
        const getProgramById = new GetProgramById(programRepository);
        this.dependencies.set('getProgramById', getProgramById);
        const syncProgramData = new SyncProgramData(programRepository, cacheRepository);
        this.dependencies.set('syncProgramData', syncProgramData);
        const storageRepository = this.get('storageRepository');
        const xmlParser = new XMLParser();
        this.dependencies.set('xmlParser', xmlParser);
        const programParser = new ProgramDataParser();
        this.dependencies.set('programParser', programParser);
        const syncEPGData = new SyncEPGData(channelRepository, programRepository, cacheRepository, storageRepository, xmlParser, programParser, tmdbService);
        this.dependencies.set('syncEPGData', syncEPGData);
        const precomputeSchedule = new PrecomputeSchedule(getPrograms, this.get('getAllChannels'), storageRepository, cacheRepository);
        this.dependencies.set('precomputeSchedule', precomputeSchedule);
        const cleanOldPrograms = new CleanOldPrograms(programRepository);
        this.dependencies.set('cleanOldPrograms', cleanOldPrograms);
        const getNowPlaying = new GetNowPlaying(channelRepository, programRepository);
        this.dependencies.set('getNowPlaying', getNowPlaying);
        const resetSystem = new ResetSystem(cacheRepository, storageRepository, syncEPGData, precomputeSchedule);
        this.dependencies.set('resetSystem', resetSystem);
        logger_1.logger.info('Use Cases registered');
    }
    async registerControllers() {
        const getAllChannels = this.get('getAllChannels');
        const getChannelById = this.get('getChannelById');
        const getPrograms = this.get('getPrograms');
        const getProgramLayouts = this.get('getProgramLayouts');
        const getProgramById = this.get('getProgramById');
        const { ChannelController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/ChannelController')));
        const { ProgramController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/ProgramController')));
        const { ScheduleController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/ScheduleController')));
        const { LayoutController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/LayoutController')));
        const { AdminController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/AdminController')));
        const { SSRController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/SSRController')));
        const { AuthController } = await Promise.resolve().then(() => __importStar(require('../presentation/controllers/AuthController')));
        const channelController = new ChannelController(getAllChannels, getChannelById);
        this.dependencies.set('channelController', channelController);
        const programController = new ProgramController(getPrograms, getChannelById, getProgramById);
        this.dependencies.set('programController', programController);
        const scheduleController = new ScheduleController(getPrograms, getAllChannels);
        this.dependencies.set('scheduleController', scheduleController);
        const layoutController = new LayoutController(getProgramLayouts);
        this.dependencies.set('layoutController', layoutController);
        const adminController = new AdminController(this.get('syncEPGData'), this.get('precomputeSchedule'), this.get('cleanOldPrograms'), this.get('cacheRepository'), this.get('resetSystem'));
        this.dependencies.set('adminController', adminController);
        const ssrController = new SSRController(this.get('getNowPlaying'));
        this.dependencies.set('ssrController', ssrController);
        const authController = new AuthController(this.get('authService'));
        this.dependencies.set('authController', authController);
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
        const cache = this.dependencies.get('cacheRepository');
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
function createContainer() {
    return Container.getInstance();
}
//# sourceMappingURL=container.js.map