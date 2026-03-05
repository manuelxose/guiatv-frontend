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
import { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { TMDBService } from '../../infrastructure/external/TMDBService';
import { Program } from '../../domain/entities/Program';
import { ProgramDeduplicator } from '../services/ProgramDeduplicator';
import { normalizeCategory } from '../../shared/constants/categories';
import axios from 'axios';
import https from 'https';
import { readFileSync } from 'fs';
import { resolve as pathResolve } from 'path';

export interface SyncEPGDataRequest {
  sourceUrl: string;
  date?: string; // YYYYMMDD, si no se especifica se usa hoy
  forceRefresh?: boolean;
  xmlContent?: string; // opcional para reusar descarga
  parsedData?: { channels: any[]; programmes: any[] }; // opcional para reusar parseo
  skipSaveXml?: boolean; // no re-escribir XML al storage
}

export interface SyncEPGDataResult {
  success: boolean;
  channelsProcessed: number;
  programsProcessed: number;
  errors: string[];
  duration: number;
}

/**
 * Downloads, parses and persists EPG data from external XML sources.
 */
export class SyncEPGData {
  private readonly syncLogger = logger.child('SyncEPGData');
  private readonly deduplicator = new ProgramDeduplicator();
  private readonly channelTypeOverrides: Record<string, string>;
  private readonly channelTypePatterns: Array<{ re: RegExp; type: string }>;

  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly programRepository: IProgramRepository,
    private readonly cacheRepository: ICacheRepository,
    private readonly storageRepository: IStorageRepository,
    private readonly xmlParser: XMLParser,
    private readonly programParser: ProgramDataParser,
    private readonly tmdbService: TMDBService
  ) {
    // Load channel-types config
    try {
      const cfgPath = pathResolve(__dirname, '../../../config/channel-types.json');
      const raw = JSON.parse(readFileSync(cfgPath, 'utf-8'));
      this.channelTypeOverrides = raw.overrides ?? {};
      this.channelTypePatterns = (raw.patterns ?? []).map((p: any) => ({
        re: new RegExp(p.match, 'i'),
        type: p.type,
      }));
    } catch {
      this.channelTypeOverrides = {};
      this.channelTypePatterns = [];
    }
  }

  /**
   * Executes the ingest pipeline including optional caching and enrichment.
   */
  async execute(request: SyncEPGDataRequest): Promise<SyncEPGDataResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let channelsProcessed = 0;
    let programsProcessed = 0;

    try {
      this.syncLogger.info('Starting EPG data sync', {
        request: {
          date: request.date,
          sourceUrl: request.sourceUrl,
          forceRefresh: request.forceRefresh,
          skipSaveXml: request.skipSaveXml,
          hasParsedData: Boolean(request.parsedData),
          xmlContentLength: request.xmlContent?.length,
        },
      });

      const date = request.date || DateUtils.getTodayYYYYMMDD();

      // 1. Descargar XML (o reusar si viene en la petición)
      const xmlContent =
        request.xmlContent ||
        (await this.downloadEPGData(request.sourceUrl));

      // 2. Guardar XML en Storage (solo si no se indica lo contrario)
      if (!request.skipSaveXml) {
        await this.saveXMLToStorage(xmlContent, date);
      }

      // 3. Parsear XML (o reusar parseo)
      const parsedData =
        request.parsedData || (await this.xmlParser.parse(xmlContent));

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

  /**
   * Descarga y almacena el icono de canal en el storage local/S3 y devuelve la URL almacenada.
   * Si falla, retorna la URL original.
   */
  private async cacheChannelIcon(
    iconUrl: string | undefined,
    channelId: string
  ): Promise<string | undefined> {
    if (!iconUrl) return undefined;
    const agent = new https.Agent({ rejectUnauthorized: false });

    const fetchIcon = async (): Promise<Buffer> => {
      try {
        const res = await axios.get<ArrayBuffer>(iconUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          httpsAgent: agent,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; GuiaTV/1.0; +https://example.com)',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        return Buffer.from(res.data);
      } catch (primaryErr) {
        // Segundo intento simple sin agente
        try {
          const res = await axios.get<ArrayBuffer>(iconUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; GuiaTV/1.0; +https://example.com)',
              Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
          });
          return Buffer.from(res.data);
        } catch (secondaryErr) {
          throw secondaryErr;
        }
      }
    };

    try {
      const buffer = await fetchIcon();
      const extMatch = iconUrl.match(/\.(png|jpg|jpeg|webp|svg|gif)(\?.*)?$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'png';

      let uploadBuffer = buffer;
      let uploadExt = ext;

      // Intentar convertir a WebP si sharp está disponible
      try {
        const sharp = await import('sharp');
        uploadBuffer = await sharp.default(buffer).webp({ quality: 70 }).toBuffer();
        uploadExt = 'webp';
      } catch (convErr) {
        this.syncLogger.warn('Icon conversion to webp failed, using original', {
          channelId,
          error: (convErr as Error).message,
        });
      }

      const filePath = `channel_icons/${channelId}.${uploadExt}`;
      const storedPath = await this.storageRepository.upload(filePath, uploadBuffer, {
        contentType: `image/${uploadExt === 'jpg' ? 'jpeg' : uploadExt}`,
        public: true,
        metadata: { sourceUrl: iconUrl },
      });
      return storedPath;
    } catch (err) {
      this.syncLogger.warn('Failed to cache channel icon (using remote URL)', {
        channelId,
        iconUrl,
        error: (err as Error).message,
      });
      return iconUrl;
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

      // Garantizar un único XML por día: eliminar cualquier copia previa del mismo día
      await this.deleteXmlForDate(date);

      await this.storageRepository.upload(filePath, xmlContent, {
        contentType: 'application/xml',
        metadata: {
          date,
          uploadedAt: new Date().toISOString(),
        },
      });

      this.syncLogger.info('XML saved to storage', { filePath });

      // Clean older XML backups to avoid retention bloat
      await this.cleanupOldXMLs(date);
    } catch (error) {
      this.syncLogger.warn('Failed to save XML to storage', {
        error: (error as Error).message,
      });
      // No lanzar error, es solo backup
    }
  }

  private async processChannels(
    parsedChannels: Array<{
      id: string;
      displayName: string;
      icon?: string;
      country?: string;
      countryCode?: string;
    }>
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

        const inferredType = this.inferChannelTypeWithGeo(
          parsed.displayName,
          parsed.country
        );
        // For Autonomico channels, always try to infer region from name
        // (don't gate on country since many Spanish channels lack country info)
        const inferredRegion =
          inferredType === 'Autonomico'
            ? this.inferRegion(parsed.displayName) ||
              this.inferRegionWithGeo(parsed.displayName, parsed.country) ||
              parsed.country
            : this.inferRegionWithGeo(parsed.displayName, parsed.country) ||
              parsed.country;

        const iconForChannel = parsed.icon
          ? await this.cacheChannelIcon(parsed.icon, this.generateChannelId(parsed.displayName))
          : null;

        if (!channel) {
          // Crear nuevo canal
          channel = Channel.create({
            id: this.generateChannelId(parsed.displayName),
            name: parsed.displayName,
            icon: iconForChannel || null,
            type: inferredType,
            country: parsed.country,
            countryCode: parsed.countryCode,
            region:
              inferredType === 'Autonomico'
                ? inferredRegion || 'Spain'
                : this.inferRegionWithGeo(parsed.displayName, parsed.country),
            isActive: true,
          });

          await this.channelRepository.save(channel);
          this.syncLogger.info('New channel created', { name: channel.name });
        } else if (parsed.icon && parsed.icon !== channel.icon) {
          // Actualizar icono si cambió
          const regionForUpdate =
            inferredType === 'Autonomico'
              ? inferredRegion || channel.region || 'Spain'
              : channel.region;
          channel = Channel.create({
            ...channel.toJSON(),
            icon: iconForChannel || parsed.icon,
            type: inferredType,
            region: regionForUpdate,
          });
          await this.channelRepository.save(channel);
        } else if (channel.type !== inferredType) {
          // Actualizar tipo si cambió (e.g. config de canales actualizada)
          const regionForUpdate =
            inferredType === 'Autonomico'
              ? inferredRegion || channel.region || 'Spain'
              : channel.region;
          channel = Channel.create({
            ...channel.toJSON(),
            type: inferredType,
            region: regionForUpdate,
          });
          await this.channelRepository.save(channel);
        }

        const parsedId = parsed.id?.trim();
        if (parsedId) {
          channelMap.set(parsedId, channel.id);
        }

        // Allow fallback lookups by display name to reduce misses caused by malformed IDs
        if (parsed.displayName?.trim()) {
          channelMap.set(parsed.displayName.trim(), channel.id);
        }

        // Completar región en autonómicos si faltara
        if (inferredType === 'Autonomico' && !channel.region) {
          const updated = Channel.create({
            ...channel.toJSON(),
            region: inferredRegion || 'Spain',
            country: channel.country || parsed.country,
            countryCode: (channel as any).countryCode || parsed.countryCode,
            type: inferredType,
          });
          channel = updated;
          await this.channelRepository.save(updated);
        }
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

    const { start: dayStart, end: dayEnd } = DateUtils.getDayRangeYYYYMMDD(date);

    // Filtrar por solape con el día objetivo:
    // programStart < dayEnd && programEnd > dayStart
    const filteredPrograms = parsedPrograms.filter((prog) => {
      try {
        const programStart = this.programParser.parseXMLDateToDate(
          String(prog.start || '')
        );
        let programEnd = this.programParser.parseXMLDateToDate(
          String(prog.stop || '')
        );

        // Some feeds keep stop date in the same day even when crossing midnight.
        if (programEnd <= programStart) {
          programEnd = new Date(programEnd.getTime() + 24 * 60 * 60 * 1000);
        }

        return programStart < dayEnd && programEnd > dayStart;
      } catch (error) {
        this.syncLogger.warn('Skipping program with invalid datetime during date overlap filter', {
          date,
          channelId: prog?.channelId || prog?.channel,
          title: prog?.title,
          start: prog?.start,
          stop: prog?.stop,
          error: (error as Error).message,
        });
        return false;
      }
    });

    this.syncLogger.info('Filtered programs for date', {
      total: parsedPrograms.length,
      filtered: filteredPrograms.length,
      date,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString(),
    });

    // Convertir a entidades del dominio
    let programs = this.programParser.batchConvert(filteredPrograms, channelMap);

    // Normalizar categorías a nombres canónicos
    programs = programs.map((p) => {
      const normalized = normalizeCategory(p.genre);
      if (normalized && normalized !== p.genre) {
        return Program.create({ ...p.toJSON(), genre: normalized, startTime: p.startTime, endTime: p.endTime });
      }
      return p;
    });

    // Deduplicar versiones genericas vs especificas antes de enriquecer
    programs = this.deduplicator.dedupe(programs);

    // Enriquecer con datos de TMDB (Cine y Series)
    programs = await this.enrichProgramsWithTMDB(programs);

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

  private async enrichProgramsWithTMDB(programs: Program[]): Promise<Program[]> {
    this.syncLogger.info('Enriching programs with TMDB data...');
    const enrichedPrograms: Program[] = [];
    
    // Process in chunks to avoid rate limiting
    const chunkSize = 5; 
    for (let i = 0; i < programs.length; i += chunkSize) {
      const chunk = programs.slice(i, i + chunkSize);
      const promises = chunk.map(async (program) => {
        try {
          const isMovie = program.genre?.toLowerCase().includes('cine') || program.genre?.toLowerCase().includes('película');
          const isSeries = program.genre?.toLowerCase().includes('serie');

          if (!isMovie && !isSeries) {
            return program;
          }

          let tmdbResult = null;
          if (isMovie) {
             tmdbResult = await this.tmdbService.searchMovie(program.title);
          } else if (isSeries) {
             const cleanTitle = program.title.replace(/T\d+.*/, '').trim();
             tmdbResult = await this.tmdbService.searchSeries(cleanTitle);
          }

          if (tmdbResult) {
            return Program.create({
              id: program.id,
              channelId: program.channelId,
              title: program.title,
              startTime: program.startTime,
              endTime: program.endTime,
              description: tmdbResult.overview || program.description,
              image: this.tmdbService.getImageUrl(tmdbResult.poster_path) || program.image,
              genre: program.genre,
              rating: tmdbResult.vote_average.toString(),
              year: tmdbResult.release_date ? tmdbResult.release_date.split('-')[0] : undefined,
            });
          }
          
          return program;
        } catch (err) {
          return program;
        }
      });

      const results = await Promise.all(promises);
      enrichedPrograms.push(...results);
    }

    return enrichedPrograms;
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

  private inferRegion(name: string): string | undefined {
    const regions: Record<string, string[]> = {
      Andalucía: ['andaluc', 'canal sur'],
      Cataluña: ['tv3', 'catalu', '3cat', 'el 33', 'esport3', 'sx3', 'betev'],
      Madrid: ['telemadrid', 'madrid'],
      Valencia: ['punt', 'valencia', '7televalencia'],
      Galicia: ['tvg', 'galicia'],
      'País Vasco': ['etb', 'euskadi', 'eitb'],
      Canarias: ['canaria'],
      Aragón: ['aragon', 'aragón'],
      Extremadura: ['extremadura'],
      'Castilla-La Mancha': ['cmm'],
      Asturias: ['tpa', 'asturias'],
      Murcia: ['la 7 murcia', 'murcia'],
      'Islas Baleares': ['ib3', 'balears', 'baleares'],
      Navarra: ['navarra'],
      'La Rioja': ['rioja', 'tvr'],
    };

    const lowerName = name.toLowerCase();

    for (const [region, keywords] of Object.entries(regions)) {
      if (keywords.some((kw) => lowerName.includes(kw))) {
        return region;
      }
    }

    return undefined;
  }

  // Inferencia enriquecida con información de país y config
  private inferChannelTypeWithGeo(
    name: string,
    _country?: string
  ): 'TDT' | 'Cable' | 'Movistar' | 'Autonomico' | 'OTT' {
    // 1) Exact override from config
    const override = this.channelTypeOverrides[name];
    if (override) return override as any;

    // 2) Pattern match from config
    for (const { re, type } of this.channelTypePatterns) {
      if (re.test(name)) return type as any;
    }

    // 3) Heuristic fallback
    const inferredRegion = this.inferRegion(name);
    const isRegionalNationalVariant =
      inferredRegion &&
      /(la\s*1|la\s*2|la_1|la_2)/i.test(name);

    if (isRegionalNationalVariant) {
      return 'Autonomico';
    }

    if (inferredRegion) return 'Autonomico';
    return 'OTT';
  }

  private inferRegionWithGeo(name: string, country?: string): string | undefined {
    if ((country || '').toLowerCase().includes('espa')) {
      return this.inferRegion(name);
    }
    return undefined;
  }

  /**
   * Remove XML backups older than 2 days from the given reference date.
   */
  private async cleanupOldXMLs(referenceDate: string): Promise<void> {
    try {
      const files = await this.storageRepository.list('epg_xml/');
      const refDate = DateUtils.parseYYYYMMDD(referenceDate);
      const cutoff = new Date(refDate);
      cutoff.setDate(cutoff.getDate() - 2);

      const toDelete = files.filter((filePath) => {
        const match = filePath.match(/epg_xml\/(\d{8})_guia\.xml$/);
        if (!match) return false;
        const fileDateStr = match[1];
        const fileDate = DateUtils.parseYYYYMMDD(fileDateStr);
        return fileDate < cutoff;
      });

      for (const filePath of toDelete) {
        try {
          await this.storageRepository.delete(filePath);
          this.syncLogger.info('Old XML removed', { filePath });
        } catch (error) {
          this.syncLogger.warn('Failed to delete old XML', {
            filePath,
            error: (error as Error).message,
          });
        }
      }
    } catch (error) {
      this.syncLogger.warn('Failed XML cleanup', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Remove any existing XML file for the given date to keep a single copy per day.
   */
  private async deleteXmlForDate(date: string): Promise<void> {
    try {
      const files = await this.storageRepository.list('epg_xml/');
      const sameDayFiles = files.filter((filePath) =>
        filePath.match(new RegExp(`epg_xml/${date}_guia\\.xml$`))
      );

      for (const filePath of sameDayFiles) {
        await this.storageRepository.delete(filePath);
        this.syncLogger.info('Old XML for date removed', { filePath });
      }
    } catch (error) {
      this.syncLogger.warn('Failed to remove existing XML for date', {
        date,
        error: (error as Error).message,
      });
    }
  }
}
