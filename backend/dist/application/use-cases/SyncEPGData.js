"use strict";
// src/v2/application/use-cases/SyncEPGData.ts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncEPGData = void 0;
const Channel_1 = require("../../domain/entities/Channel");
const EPGDataSource_1 = require("../../infrastructure/external/EPGDataSource");
const dateUtils_1 = require("../../shared/utils/dateUtils");
const logger_1 = require("../../shared/utils/logger");
const Program_1 = require("../../domain/entities/Program");
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
class SyncEPGData {
    constructor(channelRepository, programRepository, cacheRepository, storageRepository, xmlParser, programParser, tmdbService) {
        this.channelRepository = channelRepository;
        this.programRepository = programRepository;
        this.cacheRepository = cacheRepository;
        this.storageRepository = storageRepository;
        this.xmlParser = xmlParser;
        this.programParser = programParser;
        this.tmdbService = tmdbService;
        this.syncLogger = logger_1.logger.child('SyncEPGData');
    }
    async execute(request) {
        const startTime = Date.now();
        const errors = [];
        let channelsProcessed = 0;
        let programsProcessed = 0;
        try {
            this.syncLogger.info('Starting EPG data sync', { request });
            const date = request.date || dateUtils_1.DateUtils.getTodayYYYYMMDD();
            // 1. Descargar XML (o reusar si viene en la petición)
            const xmlContent = request.xmlContent ||
                (await this.downloadEPGData(request.sourceUrl));
            // 2. Guardar XML en Storage (solo si no se indica lo contrario)
            if (!request.skipSaveXml) {
                await this.saveXMLToStorage(xmlContent, date);
            }
            // 3. Parsear XML (o reusar parseo)
            const parsedData = request.parsedData || (await this.xmlParser.parse(xmlContent));
            // 4. Procesar Canales
            const channelMap = await this.processChannels(parsedData.channels);
            channelsProcessed = channelMap.size;
            // 5. Procesar Programas
            programsProcessed = await this.processPrograms(parsedData.programmes, channelMap, date);
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.syncLogger.error('EPG sync failed', error);
            errors.push(error.message);
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
    async cacheChannelIcon(iconUrl, channelId) {
        if (!iconUrl)
            return undefined;
        const agent = new https_1.default.Agent({ rejectUnauthorized: false });
        const fetchIcon = async () => {
            try {
                const res = await axios_1.default.get(iconUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    httpsAgent: agent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; GuiaTV/1.0; +https://example.com)',
                        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    },
                });
                return Buffer.from(res.data);
            }
            catch (primaryErr) {
                // Segundo intento simple sin agente
                try {
                    const res = await axios_1.default.get(iconUrl, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; GuiaTV/1.0; +https://example.com)',
                            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                        },
                    });
                    return Buffer.from(res.data);
                }
                catch (secondaryErr) {
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
                const sharp = await Promise.resolve().then(() => __importStar(require('sharp')));
                uploadBuffer = await sharp.default(buffer).webp({ quality: 70 }).toBuffer();
                uploadExt = 'webp';
            }
            catch (convErr) {
                this.syncLogger.warn('Icon conversion to webp failed, using original', {
                    channelId,
                    error: convErr.message,
                });
            }
            const filePath = `channel_icons/${channelId}.${uploadExt}`;
            const storedPath = await this.storageRepository.upload(filePath, uploadBuffer, {
                contentType: `image/${uploadExt === 'jpg' ? 'jpeg' : uploadExt}`,
                public: true,
                metadata: { sourceUrl: iconUrl },
            });
            return storedPath;
        }
        catch (err) {
            this.syncLogger.warn('Failed to cache channel icon (using remote URL)', {
                channelId,
                iconUrl,
                error: err.message,
            });
            return iconUrl;
        }
    }
    async downloadEPGData(url) {
        this.syncLogger.info('Downloading EPG data', { url });
        const dataSource = new EPGDataSource_1.EPGDataSource({
            url,
            timeout: 60000,
            compressed: url.endsWith('.gz'),
        });
        return await dataSource.fetchWithRetry(3);
    }
    async saveXMLToStorage(xmlContent, date) {
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
        }
        catch (error) {
            this.syncLogger.warn('Failed to save XML to storage', {
                error: error.message,
            });
            // No lanzar error, es solo backup
        }
    }
    async processChannels(parsedChannels) {
        this.syncLogger.info('Processing channels', {
            count: parsedChannels.length,
        });
        const channelMap = new Map();
        // Obtener canales existentes
        const existingChannels = await this.channelRepository.findAll();
        const existingByName = new Map(existingChannels.map((ch) => [ch.name, ch]));
        for (const parsed of parsedChannels) {
            try {
                // Buscar si el canal ya existe
                let channel = existingByName.get(parsed.displayName);
                const inferredType = this.inferChannelTypeWithGeo(parsed.displayName, parsed.country);
                const inferredRegion = this.inferRegionWithGeo(parsed.displayName, parsed.country) ||
                    parsed.country;
                const iconForChannel = parsed.icon
                    ? await this.cacheChannelIcon(parsed.icon, this.generateChannelId(parsed.displayName))
                    : null;
                if (!channel) {
                    // Crear nuevo canal
                    channel = Channel_1.Channel.create({
                        id: this.generateChannelId(parsed.displayName),
                        name: parsed.displayName,
                        icon: iconForChannel || null,
                        type: inferredType,
                        country: parsed.country,
                        countryCode: parsed.countryCode,
                        region: inferredType === 'Autonomico'
                            ? inferredRegion || 'Spain'
                            : this.inferRegionWithGeo(parsed.displayName, parsed.country),
                        isActive: true,
                    });
                    await this.channelRepository.save(channel);
                    this.syncLogger.info('New channel created', { name: channel.name });
                }
                else if (parsed.icon && parsed.icon !== channel.icon) {
                    // Actualizar icono si cambió
                    channel = Channel_1.Channel.create({
                        ...channel.toJSON(),
                        icon: iconForChannel || parsed.icon,
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
                    const updated = Channel_1.Channel.create({
                        ...channel.toJSON(),
                        region: inferredRegion || 'Spain',
                        country: channel.country || parsed.country,
                        countryCode: channel.countryCode || parsed.countryCode,
                        type: inferredType,
                    });
                    channel = updated;
                    await this.channelRepository.save(updated);
                }
            }
            catch (error) {
                this.syncLogger.error('Failed to process channel', error, {
                    channel: parsed.displayName,
                });
            }
        }
        return channelMap;
    }
    async processPrograms(parsedPrograms, channelMap, date) {
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
        let programs = this.programParser.batchConvert(filteredPrograms, channelMap);
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
    async enrichProgramsWithTMDB(programs) {
        this.syncLogger.info('Enriching programs with TMDB data...');
        const enrichedPrograms = [];
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
                    }
                    else if (isSeries) {
                        const cleanTitle = program.title.replace(/T\d+.*/, '').trim();
                        tmdbResult = await this.tmdbService.searchSeries(cleanTitle);
                    }
                    if (tmdbResult) {
                        return Program_1.Program.create({
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
                }
                catch (err) {
                    return program;
                }
            });
            const results = await Promise.all(promises);
            enrichedPrograms.push(...results);
        }
        return enrichedPrograms;
    }
    generateChannelId(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_|_$)/g, '')
            .substring(0, 50);
    }
    inferRegion(name) {
        const regions = {
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
    // Inferencia enriquecida con información de país
    inferChannelTypeWithGeo(name, country) {
        const tdtChannels = ['La 1', 'La 2', 'Antena 3', 'Cuatro', 'Telecinco', 'La Sexta', 'Mega', 'Neox', 'Nova', 'FDF', 'Energy', 'DMAX', 'Clan', 'Boing'];
        const movistarChannels = ['M+', 'Movistar'];
        const cableChannels = ['FOX', 'AXN', 'TNT', 'HBO', 'Syfy', 'Sky', 'TNT Sports', 'ESPN'];
        const isSpain = (country || '').toLowerCase().includes('espa');
        if (isSpain) {
            if (tdtChannels.some((ch) => name.includes(ch)))
                return 'TDT';
            if (movistarChannels.some((ch) => name.includes(ch)))
                return 'Movistar';
            if (this.inferRegion(name))
                return 'Autonomico';
        }
        if (tdtChannels.some((ch) => name.includes(ch)))
            return 'TDT';
        if (movistarChannels.some((ch) => name.includes(ch)))
            return 'Movistar';
        if (cableChannels.some((ch) => name.includes(ch)))
            return 'Cable';
        if (this.inferRegion(name))
            return 'Autonomico';
        return 'OTT';
    }
    inferRegionWithGeo(name, country) {
        if ((country || '').toLowerCase().includes('espa')) {
            return this.inferRegion(name);
        }
        return undefined;
    }
    /**
     * Remove XML backups older than 2 days from the given reference date.
     */
    async cleanupOldXMLs(referenceDate) {
        try {
            const files = await this.storageRepository.list('epg_xml/');
            const refDate = dateUtils_1.DateUtils.parseYYYYMMDD(referenceDate);
            const cutoff = new Date(refDate);
            cutoff.setDate(cutoff.getDate() - 2);
            const toDelete = files.filter((filePath) => {
                const match = filePath.match(/epg_xml\/(\d{8})_guia\.xml$/);
                if (!match)
                    return false;
                const fileDateStr = match[1];
                const fileDate = dateUtils_1.DateUtils.parseYYYYMMDD(fileDateStr);
                return fileDate < cutoff;
            });
            for (const filePath of toDelete) {
                try {
                    await this.storageRepository.delete(filePath);
                    this.syncLogger.info('Old XML removed', { filePath });
                }
                catch (error) {
                    this.syncLogger.warn('Failed to delete old XML', {
                        filePath,
                        error: error.message,
                    });
                }
            }
        }
        catch (error) {
            this.syncLogger.warn('Failed XML cleanup', {
                error: error.message,
            });
        }
    }
    /**
     * Remove any existing XML file for the given date to keep a single copy per day.
     */
    async deleteXmlForDate(date) {
        try {
            const files = await this.storageRepository.list('epg_xml/');
            const sameDayFiles = files.filter((filePath) => filePath.match(new RegExp(`epg_xml/${date}_guia\\.xml$`)));
            for (const filePath of sameDayFiles) {
                await this.storageRepository.delete(filePath);
                this.syncLogger.info('Old XML for date removed', { filePath });
            }
        }
        catch (error) {
            this.syncLogger.warn('Failed to remove existing XML for date', {
                date,
                error: error.message,
            });
        }
    }
}
exports.SyncEPGData = SyncEPGData;
//# sourceMappingURL=SyncEPGData.js.map