// src/v2/infrastructure/parsers/XMLParser.ts

import { parseStringPromise } from 'xml2js';
import { logger } from '../../shared/utils/logger';

export interface ParsedXMLChannel {
  id: string;
  displayName: string;
  icon?: string;
}

export interface ParsedXMLProgram {
  channelId: string;
  start: string; // "20251021080000 +0200"
  stop: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  year?: string;
  rating?: string;
}

export interface ParsedXMLData {
  channels: ParsedXMLChannel[];
  programmes: ParsedXMLProgram[];
}

export class XMLParser {
  private readonly parserLogger = logger.child('XMLParser');

  async parse(xmlContent: string): Promise<ParsedXMLData> {
    try {
      this.parserLogger.info('Starting XML parse');

      const json = await parseStringPromise(xmlContent, {
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
    } catch (error) {
      this.parserLogger.error('Failed to parse XML', error as Error);
      throw error;
    }
  }

  private parseChannels(channelsData: any[]): ParsedXMLChannel[] {
    return channelsData.map((ch) => ({
      id: ch.id?.[0] || ch.$.id,
      displayName: ch['display-name']?.[0]?._ || ch['display-name']?.[0] || '',
      icon: ch.icon?.[0]?.src || ch.icon?.[0]?.$.src || undefined,
    }));
  }

  private parseProgrammes(programmesData: any[]): ParsedXMLProgram[] {
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

  private extractDescription(prog: any): string | undefined {
    const desc = prog.desc?.[0]?._ || prog.desc?.[0] || '';
    return desc ? desc.substring(0, 500) : undefined;
  }

  private extractYear(prog: any): string | undefined {
    const desc = prog.desc?.[0]?._ || prog.desc?.[0] || '';
    const yearMatch = desc.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : undefined;
  }

  private extractRating(prog: any): string | undefined {
    const desc = prog.desc?.[0]?._ || prog.desc?.[0] || '';
    const ratingMatch = desc.match(/\d\/\d/);
    return ratingMatch ? ratingMatch[0] : undefined;
  }
}
