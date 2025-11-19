// src/v2/config/container.ts

// Avoid top-level import of firebase-admin; require lazily when initializing Firebase
import { Firestore } from '@google-cloud/firestore';
import { logger } from '../shared/utils/logger';

// Lightweight local type aliases to avoid compile-time coupling while
// preserving clearer intent in the container implementation. Replace with
// proper interfaces if available elsewhere in the codebase.
type ICacheRepository = any;
type IChannelRepository = any;
type IProgramRepository = any;

export class Container {
  private static instance: Container;
  private dependencies: Map<string, any> = new Map();
  private initialized: boolean = false;

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

    // 1. Inicializar Firebase
    const db = this.initializeFirebase();

    // 2. Inicializar Cache
    const cache = await this.initializeCache();
    logger.info('Container: Firebase + Cache init completed', { elapsedMs: Date.now() - start });

    // 3. Registrar Repositories
    await this.registerRepositories(db, cache);

    // 4. Registrar Services
    await this.registerServices();

    // 5. Registrar Use Cases
    await this.registerUseCases();

    // 6. Registrar Controllers
    await this.registerControllers();

    this.initialized = true;
    logger.info('DI Container initialized successfully', { totalMs: Date.now() - start });
  }

  private initializeFirebase(): Firestore {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin') as typeof import('firebase-admin');
    if (!admin.apps || admin.apps.length === 0) {
      admin.initializeApp();
      logger.info('Firebase Admin initialized');
    }

    const db = admin.firestore();

    try {
      db.settings({
        ignoreUndefinedProperties: true,
      });
    } catch (e) {
      logger.warn('Could not set Firestore settings', { error: e });
    }

    this.dependencies.set('firestore', db);
    return db;
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

      // Conectar Redis
      // If the returned cache exposes a `connect` method, try to connect but
      // don't throw — fall back silently to in-memory if connection fails.
      if (typeof (cache as any).connect === 'function') {
        try {
          // Avoid attempting to connect when running in the Functions emulator
          // discovery phase. Honor an explicit env var to skip connections.
          const skipConnect = process.env.SKIP_CACHE_CONNECT === '1' || process.env.SKIP_CACHE_CONNECT === 'true';
          if (!skipConnect) {
            const cacheConnectTimeout = Number(process.env.CACHE_CONNECT_TIMEOUT_MS) || 8000;
            logger.info('Attempting Redis connect', { timeoutMs: cacheConnectTimeout });
            await Promise.race([
              (cache as any).connect(),
              new Promise((_, rej) => setTimeout(() => rej(new Error(`Redis connect timed out after ${cacheConnectTimeout}ms`)), cacheConnectTimeout)),
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

    // Store under `cacheRepository` key to match consumers below
    this.dependencies.set('cacheRepository', cache);
    return cache;
  }
  private async registerRepositories(db: Firestore, cache: ICacheRepository): Promise<void> {
    // Load repository implementations lazily to avoid import-time costs
    const { FirestoreChannelRepository } = await import('../infrastructure/repositories/FirestoreChannelRepository');
    const { FirestoreProgramRepository } = await import('../infrastructure/repositories/FirestoreProgramRepository');
    const { CloudStorageRepository } = await import('@v2/infrastructure/repositories/CloudStorageRepository');

    // Channel Repository
    const channelRepository = new FirestoreChannelRepository(db);
    this.dependencies.set('channelRepository', channelRepository);

    // Program Repository
    const programRepository = new FirestoreProgramRepository(db);
    this.dependencies.set('programRepository', programRepository);

    // Cache Repository (already stored by initializeCache, ensure consistent key)
    this.dependencies.set('cacheRepository', cache);

    // Storage Repository
    const storageRepository = new CloudStorageRepository(process.env.STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com');
    this.dependencies.set('storageRepository', storageRepository);

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
    const { CloudStorageRepository } = await import('@v2/infrastructure/repositories/CloudStorageRepository');
    const { XMLParser } = await import('@v2/infrastructure/parsers/XMLParser');
    const { ProgramDataParser } = await import('@v2/infrastructure/parsers/ProgramDataParser');
    const { SyncEPGData } = await import('@v2/application/use-cases/SyncEPGData');
    const { PrecomputeSchedule } = await import('@v2/application/use-cases/PrecomputeSchedule');
    const { CleanOldPrograms } = await import('@v2/application/use-cases/CleanOldPrograms');

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

    // ETL Use Cases
    const storageRepository = new CloudStorageRepository(process.env.STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com');
    this.dependencies.set('storageRepository', storageRepository);

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
    const { AdminController } = await import('@v2/presentation/controllers/AdminController');

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

    const cache = this.dependencies.get('cache');
    // Avoid relying on concrete class identity; instead check for
    // lifecycle methods and call them if present.
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

// Export a factory helper instead of creating or initializing the container
// at module import time. Callers should obtain the instance and call
// `initialize()` when they actually handle a request or when running the
// scheduled task. Example:
// const container = createContainer();
// await container.initialize();
export function createContainer(): Container {
  return Container.getInstance();
}
