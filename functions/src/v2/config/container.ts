// src/v2/config/container.ts

import * as admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';

// Repositories
import { IChannelRepository } from '../domain/repositories/IChannelRepository';
import { IProgramRepository } from '../domain/repositories/IProgramRepository';
import { ICacheRepository } from '../domain/repositories/ICacheRepository';
import { FirestoreChannelRepository } from '../infrastructure/repositories/FirestoreChannelRepository';
import { FirestoreProgramRepository } from '../infrastructure/repositories/FirestoreProgramRepository';
import { InMemoryCache } from '../infrastructure/cache/InMemoryCache';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { CacheFactory } from '../infrastructure/cache/CacheFactory';

// Services
import { ChannelService } from '../domain/services/ChannelService';
import { ProgramService } from '../domain/services/ProgramService';

// Use Cases
import { GetAllChannels } from '../application/use-cases/GetAllChannels';
import { GetChannelById } from '../application/use-cases/GetChannelById';
import { GetProgramsByDate } from '../application/use-cases/GetProgramsByDate';
import { GetChannelPrograms } from '../application/use-cases/GetChannelPrograms';
import { SyncProgramData } from '../application/use-cases/SyncProgramData';

// Controllers
import { ChannelController } from '../presentation/controllers/ChannelController';
import { ProgramController } from '../presentation/controllers/ProgramController';
import { ScheduleController } from '../presentation/controllers/ScheduleController';

import { logger } from '../shared/utils/logger';
import { CleanOldPrograms } from '@v2/application/use-cases/CleanOldPrograms';
import { PrecomputeSchedule } from '@v2/application/use-cases/PrecomputeSchedule';
import { SyncEPGData } from '@v2/application/use-cases/SyncEPGData';
import { ProgramDataParser } from '@v2/infrastructure/parsers/ProgramDataParser';
import { XMLParser } from '@v2/infrastructure/parsers/XMLParser';
import { CloudStorageRepository } from '@v2/infrastructure/repositories/CloudStorageRepository';
import { AdminController } from '@v2/presentation/controllers/AdminController';
import { IStorageRepository } from '@v2/domain/repositories/IStorageRepository';

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

    // 1. Inicializar Firebase
    const db = this.initializeFirebase();

    // 2. Inicializar Cache
    const cache = await this.initializeCache();

    // 3. Registrar Repositories
    this.registerRepositories(db, cache);

    // 4. Registrar Services
    this.registerServices();

    // 5. Registrar Use Cases
    this.registerUseCases();

    // 6. Registrar Controllers
    this.registerControllers();

    this.initialized = true;
    logger.info('DI Container initialized successfully');
  }

  private initializeFirebase(): Firestore {
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
      cache = CacheFactory.create({
        type: 'redis',
        redisUrl,
        redisOptions: {
          maxRetries: 10,
          connectTimeout: 10000,
        },
      });

      // Conectar Redis
      if (cache instanceof RedisCache) {
        try {
          await cache.connect();
          logger.info('Redis cache connected');
        } catch (error) {
          logger.error(
            'Failed to connect Redis, falling back to in-memory',
            error as Error
          );
          cache = new InMemoryCache();
        }
      }
    } else {
      logger.info('Using in-memory cache');
      cache = new InMemoryCache();
    }

    this.dependencies.set('cache', cache);
    return cache;
  }

  private registerRepositories(db: Firestore, cache: ICacheRepository): void {
    // Channel Repository
    const channelRepository: IChannelRepository =
      new FirestoreChannelRepository(db);
    this.dependencies.set('channelRepository', channelRepository);

    // Program Repository
    const programRepository: IProgramRepository =
      new FirestoreProgramRepository(db);
    this.dependencies.set('programRepository', programRepository);

    // Cache Repository
    this.dependencies.set('cacheRepository', cache);

    // Storage Repository
    const storageRepository: IStorageRepository = new CloudStorageRepository(
      process.env.FIREBASE_STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com'
    );
    this.dependencies.set('storageRepository', storageRepository);

    logger.info('Repositories registered');
  }

  private registerServices(): void {
    const channelRepository = this.get<IChannelRepository>('channelRepository');
    const channelService = new ChannelService(channelRepository);
    this.dependencies.set('channelService', channelService);

    const programService = new ProgramService();
    this.dependencies.set('programService', programService);

    logger.info('Services registered');
  }

  private registerUseCases(): void {
    const channelRepository = this.get<IChannelRepository>('channelRepository');
    const programRepository = this.get<IProgramRepository>('programRepository');
    const cacheRepository = this.get<ICacheRepository>('cacheRepository');
    const channelService = this.get<ChannelService>('channelService');
    const programService = this.get<ProgramService>('programService');

    // Channel Use Cases
    const getAllChannels = new GetAllChannels(
      channelRepository,
      cacheRepository,
      channelService
    );
    this.dependencies.set('getAllChannels', getAllChannels);

    const getChannelById = new GetChannelById(
      channelRepository,
      cacheRepository
    );
    this.dependencies.set('getChannelById', getChannelById);

    // Program Use Cases
    const getProgramsByDate = new GetProgramsByDate(
      programRepository,
      cacheRepository
    );
    this.dependencies.set('getProgramsByDate', getProgramsByDate);

    const getChannelPrograms = new GetChannelPrograms(
      programRepository,
      cacheRepository,
      programService
    );
    this.dependencies.set('getChannelPrograms', getChannelPrograms);

    const syncProgramData = new SyncProgramData(
      programRepository,
      cacheRepository
    );
    this.dependencies.set('syncProgramData', syncProgramData);

    // ETL Use Cases
    const storageRepository = new CloudStorageRepository(
      process.env.FIREBASE_STORAGE_BUCKET || 'guia-tv-8fe3c.appspot.com'
    );
    this.dependencies.set('storageRepository', storageRepository);

    const xmlParser = new XMLParser();
    this.dependencies.set('xmlParser', xmlParser);

    const programParser = new ProgramDataParser();
    this.dependencies.set('programParser', programParser);

    const syncEPGData = new SyncEPGData(
      channelRepository,
      programRepository,
      cacheRepository,
      storageRepository,
      xmlParser,
      programParser
    );
    this.dependencies.set('syncEPGData', syncEPGData);

    const precomputeSchedule = new PrecomputeSchedule(
      this.get('getProgramsByDate'),
      this.get('getAllChannels'),
      programService,
      storageRepository
    );

    this.dependencies.set('precomputeSchedule', precomputeSchedule);

    const cleanOldPrograms = new CleanOldPrograms(programRepository);
    this.dependencies.set('cleanOldPrograms', cleanOldPrograms);

    logger.info('Use Cases registered');
  }

  private registerControllers(): void {
    const getAllChannels = this.get<GetAllChannels>('getAllChannels');
    const getChannelById = this.get<GetChannelById>('getChannelById');
    const getProgramsByDate = this.get<GetProgramsByDate>('getProgramsByDate');
    const getChannelPrograms =
      this.get<GetChannelPrograms>('getChannelPrograms');
    const programService = this.get<ProgramService>('programService');

    // Channel Controller
    const channelController = new ChannelController(
      getAllChannels,
      getChannelById
    );
    this.dependencies.set('channelController', channelController);

    // Program Controller
    const programController = new ProgramController(
      getProgramsByDate,
      getChannelPrograms,
      getChannelById
    );
    this.dependencies.set('programController', programController);

    // Schedule Controller
    const scheduleController = new ScheduleController(
      getProgramsByDate,
      getAllChannels,
      programService
    );
    this.dependencies.set('scheduleController', scheduleController);

    // Admin Controller
    const adminController = new AdminController(
      this.get('syncEPGData'),
      this.get('precomputeSchedule'),
      this.get('cleanOldPrograms'),
      this.get('cacheRepository')
    );
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
    if (cache && cache instanceof RedisCache) {
      await cache.disconnect();
    }

    if (cache && cache instanceof InMemoryCache) {
      cache.destroy();
    }

    this.dependencies.clear();
    this.initialized = false;

    logger.info('Container cleaned up');
  }
}
