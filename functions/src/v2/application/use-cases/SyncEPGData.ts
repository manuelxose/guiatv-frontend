// src/v2/application/use-cases/SyncEPGData.ts

import { Channel } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/IChannelRepository';
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { EPGDataSource } from '../../infrastructure/external/EPGDataSource';
import { XMLParser } from '../../infrastructure/parsers/XMLParser';
import { ProgramDataParser } from '../../infrastructure/parsers/ProgramDataParser';
import { DateUtils } from '../../shared/utils/dateUtils';
import { logger } from '../../shared/utils/logger';
import { IStorageRepository } from '@v2/domain/repositories/IStorageRepository';

export interface SyncEPGDataRequest {
  sourceUrl: string;
  date?: string; // YYYYMMDD, si no se especifica se usa hoy
  forceRefresh?: boolean;
}

export interface SyncEPGDataResult {
  success: boolean;
  channelsProcessed: number;
  programsProcessed: number;
  errors: string[];
  duration: number;
}

export class SyncEPGData {
  private readonly syncLogger = logger.child('SyncEPGData');

  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly programRepository: IProgramRepository,
    private readonly cacheRepository: ICacheRepository,
    private readonly storageRepository: IStorageRepository, // ✅ Ahora usa la interfaz
    private readonly xmlParser: XMLParser,
    private readonly programParser: ProgramDataParser
  ) {}

  async execute(request: SyncEPGDataRequest): Promise<SyncEPGDataResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let channelsProcessed = 0;
    let programsProcessed = 0;

    try {
      this.syncLogger.info('Starting EPG data sync', { request });

      const date = request.date || DateUtils.getTodayYYYYMMDD();

      // 1. Descargar XML
      const xmlContent = await this.downloadEPGData(request.sourceUrl);

      // 2. Guardar XML en Storage
      await this.saveXMLToStorage(xmlContent, date);

      // 3. Parsear XML
      const parsedData = await this.xmlParser.parse(xmlContent);

      // 4. Procesar Canales
      const channelMap = await this.processChannels(parsedData.channels);
      channelsProcessed = channelMap.size;

      // 5. Procesar Programas
      programsProcessed = await this.processPrograms(
        parsedData.programmes,
        channelMap,
        date
      );

      // 6. Limpiar caché
      if (request.forceRefresh) {
        await this.cacheRepository.clear('channels:*');
        await this.cacheRepository.clear('programs:*');
      }

      const duration = Date.now() - startTime;

      this.syncLogger.info('EPG sync completed successfully', {
        channelsProcessed,
        programsProcessed,
        duration,
      });

      return {
        success: true,
        channelsProcessed,
        programsProcessed,
        errors,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.syncLogger.error('EPG sync failed', error as Error);

      errors.push((error as Error).message);

      return {
        success: false,
        channelsProcessed,
        programsProcessed,
        errors,
        duration,
      };
    }
  }

  private async downloadEPGData(url: string): Promise<string> {
    this.syncLogger.info('Downloading EPG data', { url });

    const dataSource = new EPGDataSource({
      url,
      timeout: 60000,
      compressed: url.endsWith('.gz'),
    });

    return await dataSource.fetchWithRetry(3);
  }

  private async saveXMLToStorage(
    xmlContent: string,
    date: string
  ): Promise<void> {
    try {
      const filePath = `epg_xml/${date}_guia.xml`;

      await this.storageRepository.upload(filePath, xmlContent, {
        contentType: 'application/xml',
        metadata: {
          date,
          uploadedAt: new Date().toISOString(),
        },
      });

      this.syncLogger.info('XML saved to storage', { filePath });
    } catch (error) {
      this.syncLogger.warn('Failed to save XML to storage', {
        error: (error as Error).message,
      });
      // No lanzar error, es solo backup
    }
  }

  private async processChannels(
    parsedChannels: Array<{ id: string; displayName: string; icon?: string }>
  ): Promise<Map<string, string>> {
    this.syncLogger.info('Processing channels', {
      count: parsedChannels.length,
    });

    const channelMap = new Map<string, string>();

    // Obtener canales existentes
    const existingChannels = await this.channelRepository.findAll();
    const existingByName = new Map(existingChannels.map((ch) => [ch.name, ch]));

    for (const parsed of parsedChannels) {
      try {
        // Buscar si el canal ya existe
        let channel = existingByName.get(parsed.displayName);

        if (!channel) {
          // Crear nuevo canal
          channel = Channel.create({
            id: this.generateChannelId(parsed.displayName),
            name: parsed.displayName,
            icon: parsed.icon || null,
            type: this.inferChannelType(parsed.displayName),
            region: this.inferRegion(parsed.displayName),
            isActive: true,
          });

          await this.channelRepository.save(channel);
          this.syncLogger.info('New channel created', { name: channel.name });
        } else if (parsed.icon && parsed.icon !== channel.icon) {
          // Actualizar icono si cambió
          channel = Channel.create({
            ...channel.toJSON(),
            icon: parsed.icon,
          });
          await this.channelRepository.save(channel);
        }

        channelMap.set(parsed.id, channel.id);
      } catch (error) {
        this.syncLogger.error('Failed to process channel', error as Error, {
          channel: parsed.displayName,
        });
      }
    }

    return channelMap;
  }

  private async processPrograms(
    parsedPrograms: any[],
    channelMap: Map<string, string>,
    date: string
  ): Promise<number> {
    this.syncLogger.info('Processing programs', {
      count: parsedPrograms.length,
    });

    // Filtrar programas solo para la fecha solicitada
    const filteredPrograms = parsedPrograms.filter((prog) => {
      const progDate = prog.start.slice(0, 8);
      return progDate === date;
    });

    this.syncLogger.info('Filtered programs for date', {
      total: parsedPrograms.length,
      filtered: filteredPrograms.length,
      date,
    });

    // Convertir a entidades del dominio
    const programs = this.programParser.batchConvert(
      filteredPrograms,
      channelMap
    );

    // Guardar en lotes
    const batchSize = 500;
    let processed = 0;

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      await this.programRepository.saveBatch(batch);
      processed += batch.length;

      this.syncLogger.info('Program batch saved', {
        batch: Math.floor(i / batchSize) + 1,
        processed,
        total: programs.length,
      });
    }

    return processed;
  }

  private generateChannelId(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '')
      .substring(0, 50);
  }

  private inferChannelType(
    name: string
  ): 'TDT' | 'Cable' | 'Movistar' | 'Autonomico' {
    const tdtChannels = [
      'La 1',
      'La 2',
      'Antena 3',
      'Cuatro',
      'Telecinco',
      'La Sexta',
      'Mega',
      'Neox',
      'Nova',
      'FDF',
      'Energy',
      'DMAX',
      'Clan',
      'Boing',
    ];

    const movistarChannels = ['M+', 'Movistar'];
    const cableChannels = ['FOX', 'AXN', 'TNT', 'HBO', 'Syfy'];

    if (tdtChannels.some((ch) => name.includes(ch))) {
      return 'TDT';
    }

    if (movistarChannels.some((ch) => name.includes(ch))) {
      return 'Movistar';
    }

    if (cableChannels.some((ch) => name.includes(ch))) {
      return 'Cable';
    }

    // Si contiene nombre de comunidad autónoma
    if (this.inferRegion(name)) {
      return 'Autonomico';
    }

    return 'TDT'; // Por defecto
  }

  private inferRegion(name: string): string | undefined {
    const regions: Record<string, string[]> = {
      Andalucía: ['andaluc', 'canal sur'],
      Cataluña: ['tv3', 'catalu', '3cat'],
      Madrid: ['telemadrid', 'madrid'],
      Valencia: ['punt', 'valencia'],
      Galicia: ['tvg', 'galicia'],
      'País Vasco': ['etb', 'euskadi'],
      Canarias: ['canaria'],
      Aragón: ['aragon'],
    };

    const lowerName = name.toLowerCase();

    for (const [region, keywords] of Object.entries(regions)) {
      if (keywords.some((kw) => lowerName.includes(kw))) {
        return region;
      }
    }

    return undefined;
  }
}
