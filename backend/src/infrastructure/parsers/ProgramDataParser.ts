// src/v2/infrastructure/parsers/ProgramDataParser.ts

import { Program } from '../../domain/entities/Program';
import { ParsedXMLProgram } from './XMLParser';
import { logger } from '../../shared/utils/logger';

export class ProgramDataParser {
  private readonly parserLogger = logger.child('ProgramDataParser');

  parseXMLDateToDate(dateStr: string): Date {
    // Format: "20251021080000 +0200"
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    const hour = parseInt(dateStr.slice(8, 10), 10);
    const minute = parseInt(dateStr.slice(10, 12), 10);
    const second = parseInt(dateStr.slice(12, 14), 10);

    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  convertToDomainEntity(
    parsed: ParsedXMLProgram,
    channelMap: Map<string, string>
  ): Program | null {
    try {
      const channelId = channelMap.get(parsed.channelId);

      if (!channelId) {
        this.parserLogger.warn('Channel not found for program', {
          channelId: parsed.channelId,
          title: parsed.title,
        });
        return null;
      }

      const startTime = this.parseXMLDateToDate(parsed.start);
      const endTime = this.parseXMLDateToDate(parsed.stop);

      return Program.create({
        id: this.generateProgramId(parsed),
        channelId,
        title: parsed.title,
        startTime,
        endTime,
        description: parsed.description,
        image: parsed.icon,
        genre: parsed.category,
        year: parsed.year,
        rating: parsed.rating,
      });
    } catch (error) {
      this.parserLogger.error(
        'Failed to convert program to domain entity',
        error as Error,
        {
          program: parsed.title,
        }
      );
      return null;
    }
  }

  private generateProgramId(parsed: ParsedXMLProgram): string {
    // Generar ID único basado en canal, fecha y hora
    const normalized = `${parsed.channelId}_${parsed.start}_${parsed.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');

    return normalized.substring(0, 100); // Limitar longitud
  }

  batchConvert(
    programmes: ParsedXMLProgram[],
    channelMap: Map<string, string>
  ): Program[] {
    const programs: Program[] = [];
    let skipped = 0;

    for (const prog of programmes) {
      const program = this.convertToDomainEntity(prog, channelMap);
      if (program) {
        programs.push(program);
      } else {
        skipped++;
      }
    }

    this.parserLogger.info('Batch conversion complete', {
      total: programmes.length,
      converted: programs.length,
      skipped,
    });

    return programs;
  }
}
