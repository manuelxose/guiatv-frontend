import { logger } from '../shared/utils/logger';
import { connectMongoDB, mongoose as mongooseInstance } from './mongodb';

// Lightweight local type aliases to avoid compile-time coupling while
// preserving clearer intent in the container implementation.
type ICacheRepository = any;
type IChannelRepository = any;
type IProgramRepository = any;

export class Container {
  private static instance: Container;
  private dependencies: Map<string, any> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('Container already initialized');
      return;
    }

    logger.info('Initializing DI Container...');
    const start = Date.now();

    await this.initializeDatabase();
    const cache = await this.initializeCache();
    await this.registerRepositories(cache);
    await this.registerServices();
    await this.registerUseCases();
    await this.registerControllers();

    this.initialized = true;
    logger.info('DI Container initialized successfully', { totalMs: Date.now() - start });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await connectMongoDB();

      this.dependencies.set('mongoose', mongooseInstance);
      const nativeDb = mongooseInstance.connection.db;
      this.dependencies.set('mongoDb', nativeDb);

      logger.info('MongoDB (mongoose) initialized and registered in container');
    } catch (e) {
      logger.error('Failed to initialize MongoDB (mongoose)', { error: e });
      throw e;
    }
  }

  private async initializeCache(): Promise<ICacheRepository> {
    const cacheType = process.env.CACHE_TYPE || 'memory';
    const redisUrl = process.env.REDIS_URL;

    let cache: ICacheRepository;

    if (cacheType === 'redis' && redisUrl) {
      logger.info('Initializing Redis cache', { url: redisUrl });
      const { CacheFactory } = await import('../infrastructure/cache/CacheFactory');
      cache = CacheFactory.create({
        type: 'redis',
        redisUrl,
        redisOptions: {
          maxRetries: 10,
          connectTimeout: 10000,
        },
      });

      if (typeof (cache as any).connect === 'function') {
        try {
          const skipConnect = process.env.SKIP_CACHE_CONNECT === '1' || process.env.SKIP_CACHE_CONNECT === 'true';
          if (!skipConnect) {
            const cacheConnectTimeout = Number(process.env.CACHE_CONNECT_TIMEOUT_MS) || 8000;
            logger.info('Attempting Redis connect', { timeoutMs: cacheConnectTimeout });
            await Promise.race([
              (cache as any).connect(),
              new Promise((_, rej) =>
                setTimeout(() => rej(new Error(`Redis connect timed out after ${cacheConnectTimeout}ms`)), cacheConnectTimeout)
              ),
            ]);
            logger.info('Redis cache connected');
          } else {
            logger.info('Skipping cache connect due to SKIP_CACHE_CONNECT');
          }
        } catch (error) {
          logger.error('Failed to connect Redis, falling back to in-memory', error as Error);
          const { InMemoryCache } = await import('../infrastructure/cache/InMemoryCache');
          cache = new InMemoryCache();
        }
      }
    } else {
      logger.info('Using in-memory cache');
      const { InMemoryCache } = await import('../infrastructure/cache/InMemoryCache');
      cache = new InMemoryCache();
    }

    this.dependencies.set('cacheRepository', cache);
    return cache;
  }

  private async registerRepositories(cache: ICacheRepository): Promise<void> {
    const { MongoChannelRepository } = await import('../infrastructure/repositories/MongoChannelRepository');
    const { MongoProgramRepository } = await import('../infrastructure/repositories/MongoProgramRepository');

    const channelRepository = new MongoChannelRepository();
    this.dependencies.set('channelRepository', channelRepository);

    const programRepository = new MongoProgramRepository();
    this.dependencies.set('programRepository', programRepository);

    // Cache Repository (already stored by initializeCache, ensure consistent key)
    this.dependencies.set('cacheRepository', cache);

    const storageAdapter = (process.env.STORAGE_ADAPTER || 'local').toLowerCase();
    if (storageAdapter === 's3') {
      const { S3StorageRepository } = await import('../infrastructure/storage/S3StorageRepository');
      const bucket = process.env.AWS_S3_BUCKET || process.env.STORAGE_BUCKET;
      if (!bucket) {
        throw new Error('AWS_S3_BUCKET is required when STORAGE_ADAPTER=s3');
      }
      const repo = new S3StorageRepository(bucket, process.env.AWS_REGION);
      this.dependencies.set('storageRepository', repo);
    } else if (storageAdapter === 'local') {
      const { LocalStorageRepository } = await import('../infrastructure/storage/LocalStorageRepository');
      const repo = new LocalStorageRepository(process.env.STORAGE_LOCAL_PATH);
      this.dependencies.set('storageRepository', repo);
    } else {
      throw new Error('Unsupported STORAGE_ADAPTER. Use "s3" or "local".');
    }

    logger.info('Repositories registered');
  }

  private async registerServices(): Promise<void> {
    const { ChannelService } = await import('../domain/services/ChannelService');
    const { ProgramService } = await import('../domain/services/ProgramService');

    const channelRepository = this.get<IChannelRepository>('channelRepository');
    const channelService = new ChannelService(channelRepository);
    this.dependencies.set('channelService', channelService);

    const programService = new ProgramService();
    this.dependencies.set('programService', programService);

    logger.info('Services registered');
  }

  private async registerUseCases(): Promise<void> {
    const channelRepository = this.get<IChannelRepository>('channelRepository');
    const programRepository = this.get<IProgramRepository>('programRepository');
    const cacheRepository = this.get<ICacheRepository>('cacheRepository');
    const channelService = this.get<any>('channelService');
    const programService = this.get<any>('programService');

    const { GetAllChannels } = await import('../application/use-cases/GetAllChannels');
    const { GetChannelById } = await import('../application/use-cases/GetChannelById');
    const { GetProgramsByDate } = await import('../application/use-cases/GetProgramsByDate');
    const { GetChannelPrograms } = await import('../application/use-cases/GetChannelPrograms');
    const { SyncProgramData } = await import('../application/use-cases/SyncProgramData');
    const { XMLParser } = await import('../infrastructure/parsers/XMLParser');
    const { ProgramDataParser } = await import('../infrastructure/parsers/ProgramDataParser');
    const { SyncEPGData } = await import('../application/use-cases/SyncEPGData');
    const { PrecomputeSchedule } = await import('../application/use-cases/PrecomputeSchedule');
    const { CleanOldPrograms } = await import('../application/use-cases/CleanOldPrograms');
    const { GetNowPlaying } = await import('../application/use-cases/GetNowPlaying');

    const getAllChannels = new GetAllChannels(channelRepository, cacheRepository, channelService);
    this.dependencies.set('getAllChannels', getAllChannels);

    const getChannelById = new GetChannelById(channelRepository, cacheRepository);
    this.dependencies.set('getChannelById', getChannelById);

    const getProgramsByDate = new GetProgramsByDate(programRepository, cacheRepository);
    this.dependencies.set('getProgramsByDate', getProgramsByDate);

    const getChannelPrograms = new GetChannelPrograms(programRepository, cacheRepository, programService);
    this.dependencies.set('getChannelPrograms', getChannelPrograms);

    const syncProgramData = new SyncProgramData(programRepository, cacheRepository);
    this.dependencies.set('syncProgramData', syncProgramData);

    const storageRepository = this.get<any>('storageRepository');

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

    const getNowPlaying = new GetNowPlaying(channelRepository, programRepository);
    this.dependencies.set('getNowPlaying', getNowPlaying);

    logger.info('Use Cases registered');
  }

  private async registerControllers(): Promise<void> {
    const getAllChannels = this.get<any>('getAllChannels');
    const getChannelById = this.get<any>('getChannelById');
    const getProgramsByDate = this.get<any>('getProgramsByDate');
    const getChannelPrograms = this.get<any>('getChannelPrograms');
    const programService = this.get<any>('programService');

    const { ChannelController } = await import('../presentation/controllers/ChannelController');
    const { ProgramController } = await import('../presentation/controllers/ProgramController');
    const { ScheduleController } = await import('../presentation/controllers/ScheduleController');
    const { AdminController } = await import('../presentation/controllers/AdminController');
    const { SSRController } = await import('../presentation/controllers/SSRController');

    const channelController = new ChannelController(getAllChannels, getChannelById);
    this.dependencies.set('channelController', channelController);

    const programController = new ProgramController(getProgramsByDate, getChannelPrograms, getChannelById);
    this.dependencies.set('programController', programController);

    const scheduleController = new ScheduleController(getProgramsByDate, getAllChannels, programService);
    this.dependencies.set('scheduleController', scheduleController);

    const adminController = new AdminController(this.get('syncEPGData'), this.get('precomputeSchedule'), this.get('cleanOldPrograms'), this.get('cacheRepository'));
    this.dependencies.set('adminController', adminController);

    const ssrController = new SSRController(this.get('getNowPlaying'));
    this.dependencies.set('ssrController', ssrController);

    logger.info('Controllers registered');
  }

  get<T>(key: string): T {
    const dependency = this.dependencies.get(key);

    if (!dependency) {
      throw new Error(`Dependency '${key}' not found in container`);
    }

    return dependency as T;
  }

  has(key: string): boolean {
    return this.dependencies.has(key);
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up container...');

    const cache = this.dependencies.get('cacheRepository');
    if (cache && typeof (cache as any).disconnect === 'function') {
      try {
        await (cache as any).disconnect();
      } catch (e) {
        logger.warn('Error while disconnecting cache', { error: e });
      }
    }

    if (cache && typeof (cache as any).destroy === 'function') {
      try {
        (cache as any).destroy();
      } catch (e) {
        logger.warn('Error while destroying cache', { error: e });
      }
    }

    this.dependencies.clear();
    this.initialized = false;

    logger.info('Container cleaned up');
  }
}

export function createContainer(): Container {
  return Container.getInstance();
}
