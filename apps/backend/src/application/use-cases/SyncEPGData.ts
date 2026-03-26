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
import type { ProgramProps } from '../../domain/entities/Program';
import { DateRange } from '../../domain/value-objects/DateRange';
import { ProgramDeduplicator } from '../services/ProgramDeduplicator';
import { normalizeCategory } from '../../shared/constants/categories';
import { normalizeExternalMediaUrl } from '../../shared/utils/mediaUrl';
import {
  buildChannelIdentityMetadata,
  buildProgramTitleAliases,
  normalizeTvToken,
} from '../../shared/utils/tvMetadata';
import axios from 'axios';
import https from 'https';
import { readFileSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { l1Cache } from '../../infrastructure/cache/L1Cache';

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
  private readonly normalizedChannelTypeOverrides: Record<string, string>;
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
      this.normalizedChannelTypeOverrides = Object.entries(this.channelTypeOverrides).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          acc[normalizeTvToken(key)] = value as string;
          acc[normalizeTvToken(key, ' ')] = value as string;
          return acc;
        },
        {}
      );
      this.channelTypePatterns = (raw.patterns ?? []).map((p: any) => ({
        re: new RegExp(p.match, 'i'),
        type: p.type,
      }));
    } catch {
      this.channelTypeOverrides = {};
      this.normalizedChannelTypeOverrides = {};
      this.channelTypePatterns = [];
    }
  }

  private shouldSkipTmdbEnrichment(): boolean {
    const value = String(process.env.SKIP_TMDB_ENRICHMENT || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  }

  private shouldSkipChannelIconCache(): boolean {
    const value = String(process.env.SKIP_CHANNEL_ICON_CACHE || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  }

  private cloneProgram(program: Program, overrides: Partial<ProgramProps> = {}): Program {
    return Program.create({
      id: program.id,
      channelId: program.channelId,
      canonicalChannelId: program.canonicalChannelId,
      title: program.title,
      subtitle: program.subtitle,
      normalizedTitle: program.normalizedTitle,
      titleAliases: program.titleAliases,
      brandKey: program.brandKey,
      startTime: program.startTime,
      endTime: program.endTime,
      description: program.description,
      image: program.image,
      genre: program.genre,
      subgenre: program.subgenre,
      year: program.year,
      rating: program.rating,
      tmdbId: program.tmdbId,
      sourceFeed: program.sourceFeed,
      sourceProgrammeId: program.sourceProgrammeId,
      sourceAssetCandidates: program.sourceAssetCandidates,
      sourceProvenance: program.sourceProvenance,
      trustFlags: program.trustFlags,
      details: program.details,
      ...overrides,
    });
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

      const date = request.date
        ? DateUtils.parseDateAlias(request.date)
        : DateUtils.getTodayYYYYMMDD();

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

      // Build set of normalized channel icon URLs so we can exclude them from
      // programme images. Normalizing here matches what ProgramDataParser does
      // with normalizeExternalMediaUrl before comparing against this set.
      const channelIconUrls = new Set<string>();
      for (const ch of parsedData.channels) {
        const normalized = normalizeExternalMediaUrl(ch.icon);
        if (normalized) channelIconUrls.add(normalized);
      }

      // 5. Procesar Programas
      programsProcessed = await this.processPrograms(
        parsedData.programmes,
        channelMap,
        date,
        channelIconUrls,
        request.sourceUrl
      );

      // 6. Limpiar caché
      if (request.forceRefresh) {
        await this.cacheRepository.clear('channels:*');
        await this.cacheRepository.clear('programs:*');
        await this.cacheRepository.clear('catalog:*');
        await this.cacheRepository.clear('schedule:*');
        await this.cacheRepository.clear('precomputed:programs:*');
        l1Cache.invalidatePrefix('nowplaying:');
        l1Cache.invalidatePrefix('catalog:hot:');
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
    const existingByAlias = new Map<string, Channel>();
    existingChannels.forEach((channel) => {
      const metadata = buildChannelIdentityMetadata({
        name: channel.name,
        sourceId: channel.sourceIds[0] || channel.id,
        country: channel.country,
        countryCode: channel.countryCode,
        region: channel.region,
      });
      [channel.id, channel.name, channel.normalizedName, ...channel.aliases, ...metadata.aliases]
        .map((value) => normalizeTvToken(value))
        .filter(Boolean)
        .forEach((alias) => {
          const current = existingByAlias.get(alias);
          existingByAlias.set(alias, this.pickPreferredExistingChannel(current, channel));
        });
    });

    for (const parsed of parsedChannels) {
      try {
        const identity = buildChannelIdentityMetadata({
          name: parsed.displayName,
          sourceId: parsed.id,
          country: parsed.country,
          countryCode: parsed.countryCode,
        });

        // Buscar si el canal ya existe por nombre canónico, alias o sourceId
        let channel =
          identity.aliases
            .map((alias) => existingByAlias.get(alias))
            .find(Boolean) ||
          existingByAlias.get(identity.normalizedName);

        const inferredType = this.inferChannelTypeWithGeo(
          parsed.displayName,
          parsed.country,
          parsed.countryCode,
          parsed.id
        );
        const inferredRegion =
          inferredType === 'Autonomico'
            ? identity.inferredRegion || parsed.country
            : this.inferRegionWithGeo(parsed.displayName, parsed.country) ||
              parsed.country;

        if (!channel) {
          const iconForChannel = parsed.icon
            ? this.shouldSkipChannelIconCache()
              ? parsed.icon
              : await this.cacheChannelIcon(parsed.icon, this.generateChannelId(parsed.displayName))
            : null;
          // Crear nuevo canal
          channel = Channel.create({
            id: identity.canonicalId || this.generateChannelId(parsed.displayName),
            name: parsed.displayName,
            icon: iconForChannel || null,
            type: inferredType,
            aliases: identity.aliases,
            sourceIds: identity.sourceIds,
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
          const iconForChannel = this.shouldSkipChannelIconCache()
            ? channel.icon || parsed.icon
            : await this.cacheChannelIcon(parsed.icon, this.generateChannelId(parsed.displayName));
          // Actualizar icono si cambió
          const regionForUpdate =
            inferredType === 'Autonomico'
              ? inferredRegion || channel.region || 'Spain'
              : channel.region;
          channel = Channel.create({
            ...channel.toJSON(),
            icon: iconForChannel || parsed.icon,
            type: inferredType,
            aliases: Array.from(new Set([...channel.aliases, ...identity.aliases])),
            sourceIds: Array.from(new Set([...channel.sourceIds, ...identity.sourceIds])),
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
            aliases: Array.from(new Set([...channel.aliases, ...identity.aliases])),
            sourceIds: Array.from(new Set([...channel.sourceIds, ...identity.sourceIds])),
            region: regionForUpdate,
          });
          await this.channelRepository.save(channel);
        } else if (
          identity.aliases.some((alias) => !channel!.aliases.includes(alias)) ||
          identity.sourceIds.some((sourceId) => !channel!.sourceIds.includes(sourceId))
        ) {
          channel = Channel.create({
            ...channel.toJSON(),
            aliases: Array.from(new Set([...channel.aliases, ...identity.aliases])),
            sourceIds: Array.from(new Set([...channel.sourceIds, ...identity.sourceIds])),
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

        if (!channel) {
          continue;
        }
        const resolvedChannel = channel;

        identity.aliases.forEach((alias) => {
          channelMap.set(alias, resolvedChannel.id);
          const current = existingByAlias.get(alias);
          existingByAlias.set(alias, this.pickPreferredExistingChannel(current, resolvedChannel));
        });

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
    date: string,
    channelIconUrls?: Set<string>,
    sourceFeed?: string
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
    let programs = this.programParser.batchConvert(filteredPrograms, channelMap, channelIconUrls);

    // Normalizar categorías a nombres canónicos
    programs = programs.map((p) => {
      const normalized = normalizeCategory(p.genre);
      if (normalized && normalized !== p.genre) {
        return this.cloneProgram(p, { genre: normalized });
      }
      return p;
    });

    // Deduplicar versiones genericas vs especificas antes de enriquecer
    programs = this.deduplicator.dedupe(programs);

    const impactedChannelIds = Array.from(
      new Set(programs.map((program) => program.channelId).filter(Boolean))
    );
    if (impactedChannelIds.length) {
      if (sourceFeed) {
        await this.programRepository.deleteOverlappingBySourceAndChannels(
          sourceFeed,
          impactedChannelIds,
          DateRange.create(dayStart, dayEnd)
        );
      } else {
        await this.programRepository.deleteOverlappingByChannels(
          impactedChannelIds,
          DateRange.create(dayStart, dayEnd)
        );
      }
    }

    // Enriquecer con datos de TMDB (Cine y Series) solo cuando no se pida
    // una reconstrucción lineal rápida basada en EPG ya enriquecida por fuente.
    if (this.shouldSkipTmdbEnrichment()) {
      this.syncLogger.info('Skipping TMDB enrichment for this sync run', {
        date,
        programs: programs.length,
      });
    } else {
      programs = await this.enrichProgramsWithTMDB(programs);
    }

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

  private normalizeTitleForTMDB(title: string): string {
    return buildProgramTitleAliases(title)[0] || normalizeTvToken(title, ' ');
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const curr = [i];
      for (let j = 1; j <= n; j++) {
        curr[j] = a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
      prev = curr;
    }
    return prev[n];
  }

  private titleMatches(epgTitle: string, tmdbTitle: string | undefined): boolean {
    if (!tmdbTitle) return false;
    const a = this.normalizeTitleForTMDB(epgTitle);
    const b = this.normalizeTitleForTMDB(tmdbTitle);
    if (a.length < 4) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    if (a.length <= 20 && b.length <= 20 && this.levenshtein(a, b) <= 2) return true;
    return false;
  }

  private shouldSkipTMDBFallback(genre: string | undefined): boolean {
    if (!genre) return false;
    const g = genre.toLowerCase();
    return g === 'noticias' || g === 'deportes' || g === 'religión' || g === 'magazine';
  }

  private shouldSkipTMDBForProgram(program: Program): boolean {
    const title = String(program.title || '').toLowerCase();
    const description = String(program.description || '').toLowerCase();

    if (ProgramDeduplicator.isGenericTitle(program.title)) {
      return true;
    }

    if (/(teletienda|televenta|infocomercial|shopping|tarot|horoscopo|horóscopo)/.test(title)) {
      return true;
    }

    if (/(teletienda|televenta|infocomercial|shopping)/.test(description)) {
      return true;
    }

    return this.shouldSkipTMDBFallback(program.genre);
  }

  /**
   * Loads TMDB enrichment data from existing DB records for the given programs.
   * Returns a map from normalized title → enriched fields, used to avoid redundant API calls.
   */
  private async loadExistingEnrichment(programs: Program[]): Promise<Map<string, {
    tmdbId: number; image: string; description?: string; year?: string; rating?: string;
  }>> {
      const uniqueTitles = [...new Set(programs.map((p) => p.title))];
    if (!uniqueTitles.length) return new Map();

    try {
      const existing = await this.programRepository.findEnrichedByTitles(uniqueTitles);
      const map = new Map<string, { tmdbId: number; image: string; description?: string; year?: string; rating?: string }>();
      for (const entry of existing) {
        buildProgramTitleAliases(entry.title).forEach((alias) => {
          if (alias && !map.has(alias)) {
            map.set(alias, {
              tmdbId: entry.tmdbId,
              image: entry.image,
              description: entry.description,
              year: entry.year,
              rating: entry.rating,
            });
          }
        });
      }
      this.syncLogger.info('DB enrichment cache loaded', { titles: uniqueTitles.length, hits: map.size });
      return map;
    } catch (err) {
      this.syncLogger.warn('Failed to load DB enrichment cache', { error: (err as Error).message });
      return new Map();
    }
  }

  private async enrichProgramsWithTMDB(programs: Program[]): Promise<Program[]> {
    this.syncLogger.info('Enriching programs with TMDB data...');
    const enrichedPrograms: Program[] = [];

    // Pre-load enrichment from DB to avoid redundant TMDB calls on repeated syncs
    const dbEnrichmentMap = await this.loadExistingEnrichment(programs);

    // Process in chunks to avoid rate limiting
    const chunkSize = 5;
    for (let i = 0; i < programs.length; i += chunkSize) {
      const chunk = programs.slice(i, i + chunkSize);
      const promises = chunk.map(async (program) => {
        try {
          const isMovie = program.genre?.toLowerCase().includes('cine') || program.genre?.toLowerCase().includes('película');
          const isSeries = program.genre?.toLowerCase().includes('serie');

          if (this.shouldSkipTMDBForProgram(program)) {
            return this.cloneProgram(program, {
              trustFlags: {
                ...(program.trustFlags || {}),
                tmdbSkipped: true,
              },
            });
          }

          // ---- Phase 1: existing cine/serie enrichment (no regression) ----
          if (isMovie || isSeries) {
            // Check DB enrichment cache before calling TMDB
            const titleAliases = buildProgramTitleAliases(program.title);
            const dbHit = titleAliases
              .map((alias) => dbEnrichmentMap.get(alias))
              .find(Boolean);
            if (dbHit) {
              this.syncLogger.debug('TMDB DB cache hit (phase1)', { title: program.title });
              return this.cloneProgram(program, {
                description: dbHit.description || program.description,
                image: dbHit.image,
                rating: dbHit.rating || program.rating,
                year: dbHit.year || program.year,
                tmdbId: dbHit.tmdbId,
                trustFlags: {
                  ...(program.trustFlags || {}),
                  tmdbMatched: true,
                  tmdbSource: 'db_cache',
                  tmdbKind: isMovie ? 'movie' : 'series',
                },
              });
            }
            let tmdbResult = null;
            if (isMovie) {
              for (const alias of buildProgramTitleAliases(program.title)) {
                tmdbResult = await this.tmdbService.searchMovie(alias, program.year ? Number(program.year) : undefined);
                if (tmdbResult && this.titleMatches(program.title, tmdbResult.title || tmdbResult.original_title)) {
                  break;
                }
              }
            } else {
              for (const alias of buildProgramTitleAliases(program.title)) {
                tmdbResult = await this.tmdbService.searchSeries(alias);
                if (tmdbResult && this.titleMatches(program.title, tmdbResult.name || tmdbResult.original_name)) {
                  break;
                }
              }
            }

            if (tmdbResult) {
              return this.cloneProgram(program, {
                description: tmdbResult.overview || program.description,
                image: this.tmdbService.getImageUrl(tmdbResult.poster_path) || program.image,
                rating: tmdbResult.vote_average.toString(),
                year: tmdbResult.release_date
                  ? tmdbResult.release_date.split('-')[0]
                  : tmdbResult.first_air_date
                    ? tmdbResult.first_air_date.split('-')[0]
                    : undefined,
                tmdbId: tmdbResult.id,
                trustFlags: {
                  ...(program.trustFlags || {}),
                  tmdbMatched: true,
                  tmdbSource: 'api_primary',
                  tmdbKind: isMovie ? 'movie' : 'series',
                },
              });
            }
            return program;
          }

          // ---- Phase 2: universal fallback for programs with no image ----
          if (program.image) return program;
          if (this.shouldSkipTMDBForProgram(program)) return program;

          const cleanTitles = buildProgramTitleAliases(program.title);
          if (!cleanTitles.length) return program;

          // Check DB enrichment cache before calling TMDB
          const dbHit2 = cleanTitles
            .map((alias) => dbEnrichmentMap.get(alias))
            .find(Boolean);
          if (dbHit2) {
            this.syncLogger.debug('TMDB DB cache hit (phase2)', { title: program.title });
            return this.cloneProgram(program, {
              description: dbHit2.description || program.description,
              image: dbHit2.image,
              rating: dbHit2.rating || program.rating,
              year: dbHit2.year || program.year,
              tmdbId: dbHit2.tmdbId,
              trustFlags: {
                ...(program.trustFlags || {}),
                tmdbMatched: true,
                tmdbSource: 'db_cache',
              },
            });
          }

          // Try series first (most non-movie TV content), then movie as fallback
          let tmdbResult = null;
          let matchTitle: string | undefined;
          let matchedKind: 'movie' | 'series' | undefined;

          for (const alias of cleanTitles) {
            tmdbResult = await this.tmdbService.searchSeries(alias);
            matchTitle = tmdbResult?.name ?? tmdbResult?.original_name;
            if (tmdbResult && this.titleMatches(program.title, matchTitle)) {
              matchedKind = 'series';
              break;
            }

            tmdbResult = await this.tmdbService.searchMovie(alias, program.year ? Number(program.year) : undefined);
            matchTitle = tmdbResult?.title ?? tmdbResult?.original_title;
            if (tmdbResult && this.titleMatches(program.title, matchTitle)) {
              matchedKind = 'movie';
              break;
            }
            tmdbResult = null;
            matchTitle = undefined;
            matchedKind = undefined;
          }

          if (!tmdbResult || !this.titleMatches(program.title, matchTitle)) {
            return program; // no confident match
          }

          const posterUrl = this.tmdbService.getImageUrl(tmdbResult.poster_path);
          if (!posterUrl) return program;

          this.syncLogger.debug('TMDB fallback enrichment applied', {
            title: program.title,
            matchedTitle: matchTitle,
            genre: program.genre,
          });

          return this.cloneProgram(program, {
            description: tmdbResult.overview || program.description,
            image: posterUrl,
            rating: tmdbResult.vote_average ? tmdbResult.vote_average.toString() : program.rating,
            year: tmdbResult.release_date?.split('-')[0]
               ?? tmdbResult.first_air_date?.split('-')[0]
               ?? program.year,
            tmdbId: tmdbResult.id,
            trustFlags: {
              ...(program.trustFlags || {}),
              tmdbMatched: true,
              tmdbSource: 'api_fallback',
              tmdbKind: matchedKind,
            },
          });
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

  private pickPreferredExistingChannel(
    current: Channel | undefined,
    candidate: Channel
  ): Channel {
    if (!current) {
      return candidate;
    }

    const currentMetadata = buildChannelIdentityMetadata({
      name: current.name,
      sourceId: current.sourceIds[0] || current.id,
      country: current.country,
      countryCode: current.countryCode,
      region: current.region,
    });
    const candidateMetadata = buildChannelIdentityMetadata({
      name: candidate.name,
      sourceId: candidate.sourceIds[0] || candidate.id,
      country: candidate.country,
      countryCode: candidate.countryCode,
      region: candidate.region,
    });

    const currentIsCanonical = current.id === currentMetadata.canonicalId;
    const candidateIsCanonical = candidate.id === candidateMetadata.canonicalId;
    if (currentIsCanonical !== candidateIsCanonical) {
      return candidateIsCanonical ? candidate : current;
    }

    if (Boolean(current.icon) !== Boolean(candidate.icon)) {
      return candidate.icon ? candidate : current;
    }

    const currentOrder = Number((current as any).order ?? currentMetadata.sortOrder ?? 999);
    const candidateOrder = Number((candidate as any).order ?? candidateMetadata.sortOrder ?? 999);
    if (currentOrder !== candidateOrder) {
      return candidateOrder < currentOrder ? candidate : current;
    }

    return candidate.aliases.length > current.aliases.length ? candidate : current;
  }

  // Inferencia enriquecida con información de país y config
  private inferChannelTypeWithGeo(
    name: string,
    country?: string,
    countryCode?: string,
    sourceId?: string
  ): 'TDT' | 'Cable' | 'Movistar' | 'Autonomico' | 'OTT' {
    // 1) Exact override from config
    const override =
      this.channelTypeOverrides[name] ||
      this.normalizedChannelTypeOverrides[normalizeTvToken(name)] ||
      this.normalizedChannelTypeOverrides[normalizeTvToken(name, ' ')] ||
      (sourceId
        ? this.normalizedChannelTypeOverrides[normalizeTvToken(sourceId)] ||
          this.normalizedChannelTypeOverrides[normalizeTvToken(sourceId, ' ')]
        : undefined);
    if (override) return override as any;

    // 2) Pattern match from config
    for (const { re, type } of this.channelTypePatterns) {
      if (re.test(name)) return type as any;
    }

    // 3) Heuristic fallback
    return buildChannelIdentityMetadata({
      name,
      sourceId,
      country,
      countryCode,
      region: this.inferRegion(name),
    }).inferredType;
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
