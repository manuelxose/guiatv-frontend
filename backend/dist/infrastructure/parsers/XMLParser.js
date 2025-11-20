"use strict";
// src/v2/infrastructure/parsers/XMLParser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.XMLParser = void 0;
const xml2js_1 = require("xml2js");
const logger_1 = require("../../shared/utils/logger");
class XMLParser {
    constructor() {
        this.parserLogger = logger_1.logger.child('XMLParser');
    }
    async parse(xmlContent) {
        try {
            this.parserLogger.info('Starting XML parse');
            const json = await (0, xml2js_1.parseStringPromise)(xmlContent, {
                mergeAttrs: true,
                explicitArray: true,
            });
            if (!json || !json.tv) {
                throw new Error('Invalid XML structure: missing tv root element');
            }
            const channels = this.parseChannels(json.tv.channel || []);
            const programmes = this.parseProgrammes(json.tv.programme || []);
            this.parserLogger.info('XML parsed successfully', {
                channelsCount: channels.length,
                programmesCount: programmes.length,
            });
            return { channels, programmes };
        }
        catch (error) {
            this.parserLogger.error('Failed to parse XML', error);
            throw error;
        }
    }
    parseChannels(channelsData) {
        return channelsData.map((ch) => ({
            id: ch.id?.[0] || ch.$.id,
            displayName: ch['display-name']?.[0]?._ || ch['display-name']?.[0] || '',
            icon: ch.icon?.[0]?.src || ch.icon?.[0]?.$.src || undefined,
        }));
    }
    parseProgrammes(programmesData) {
        return programmesData.map((prog) => ({
            channelId: prog.channel?.[0] || prog.$.channel,
            start: prog.start?.[0] || prog.$.start,
            stop: prog.stop?.[0] || prog.$.stop,
            title: prog.title?.[0]?._ || prog.title?.[0] || '',
            description: this.extractDescription(prog),
            icon: prog.icon?.[0]?.src || prog.icon?.[0]?.$.src || undefined,
            category: prog.category?.[0]?._ || prog.category?.[0] || undefined,
            year: this.extractYear(prog),
            rating: this.extractRating(prog),
        }));
    }
    extractDescription(prog) {
        const desc = prog.desc?.[0]?._ || prog.desc?.[0] || '';
        return desc ? desc.substring(0, 500) : undefined;
    }
    extractYear(prog) {
        const desc = prog.desc?.[0]?._ || prog.desc?.[0] || '';
        const yearMatch = desc.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? yearMatch[0] : undefined;
    }
    extractRating(prog) {
        const desc = prog.desc?.[0]?._ || prog.desc?.[0] || '';
        const ratingMatch = desc.match(/\d\/\d/);
        return ratingMatch ? ratingMatch[0] : undefined;
    }
}
exports.XMLParser = XMLParser;
//# sourceMappingURL=XMLParser.js.map