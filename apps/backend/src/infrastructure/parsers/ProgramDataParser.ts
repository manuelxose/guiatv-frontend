// src/v2/infrastructure/parsers/ProgramDataParser.ts

import { Program } from '../../domain/entities/Program';
import { ParsedXMLProgram } from './XMLParser';
import { logger } from '../../shared/utils/logger';
import { createHash } from 'node:crypto';
import { normalizeExternalMediaUrl } from '../../shared/utils/mediaUrl';
import {
  buildProgramBrandKey,
  buildProgramTitleAliases,
  isGenericMovieTitle,
  normalizeTvToken,
  resolveProgramDisplayTitle,
} from '../../shared/utils/tvMetadata';

/** Titles that are actually category labels, not real program names. */
const GENERIC_TITLES = new Set([
  'cine', 'película', 'pelicula', 'peliculas', 'películas',
  'cine español', 'cine de barrio', 'cine western',
  'movie', 'film', 'cinema', 'estreno',
  'serie', 'series',
]);

export class ProgramDataParser {
  private readonly parserLogger = logger.child('ProgramDataParser');

  /**
   * When the EPG title is a generic category label (e.g. "Cine") and
   * a sub-title carries the real program name, use the sub-title instead.
   */
  private resolveTitle(title: string, subTitle?: string): string {
    const resolved = resolveProgramDisplayTitle(title, subTitle);
    if (resolved !== title) {
      return resolved;
    }
    if (!subTitle) return title;
    const normalized = title.toLowerCase().trim();
    if (GENERIC_TITLES.has(normalized)) {
      return subTitle;
    }
    if (normalized.startsWith('cine') && normalized.split(' ').length <= 3) {
      return subTitle;
    }
    return title;
  }

  parseXMLDateToDate(dateStr: string): Date {
    // Accepted formats:
    // - "20251021080000 +0200"
    // - "20251021080000+0200"
    // - "20251021080000"
    const normalized = String(dateStr || '').trim();
    const match = normalized.match(
      /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?$/
    );

    if (!match) {
      throw new Error(`Invalid XML datetime format: "${dateStr}"`);
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    const second = parseInt(match[6], 10);

    const baseUtcMillis = Date.UTC(year, month, day, hour, minute, second);
    if (!match[7]) {
      return new Date(baseUtcMillis);
    }

    const sign = match[7] === '+' ? 1 : -1;
    const offsetHours = parseInt(match[8], 10);
    const offsetMinutes = parseInt(match[9], 10);
    const totalOffsetMinutes = sign * (offsetHours * 60 + offsetMinutes);

    return new Date(baseUtcMillis - totalOffsetMinutes * 60_000);
  }

  convertToDomainEntity(
    parsed: ParsedXMLProgram,
    channelMap: Map<string, string>,
    channelIconUrls?: Set<string>
  ): Program | null {
    try {
      const channelId =
        channelMap.get(parsed.channelId) ||
        channelMap.get(parsed.channelId.trim());

      if (!channelId) {
        this.parserLogger.warn('Channel not found for program', {
          channelId: parsed.channelId,
          title: parsed.title,
        });
        return null;
      }

      const startTime = this.parseXMLDateToDate(parsed.start);
      let endTime = this.parseXMLDateToDate(parsed.stop);

      // Some feeds wrap past midnight without bumping the date; fix common cases
      if (endTime <= startTime) {
        // If the difference is small (<= 12h), assume it crosses midnight
        const bumped = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
        if (bumped.getTime() - startTime.getTime() > 0 && bumped.getTime() - startTime.getTime() <= 12 * 60 * 60 * 1000) {
          endTime = bumped;
        } else {
          this.parserLogger.warn('Skipping program with invalid time range', {
            title: parsed.title,
            channelId,
            start: parsed.start,
            stop: parsed.stop,
          });
          return null;
        }
      }

      let image: string | undefined;
      if (Array.isArray(parsed.icon)) {
        image = normalizeExternalMediaUrl(parsed.icon[0]);
      } else {
        image = normalizeExternalMediaUrl(parsed.icon);
      }
      // If the programme icon matches a known channel icon, it's not a real poster
      if (image && channelIconUrls?.has(image)) {
        image = undefined;
      }

      const resolvedTitle = this.resolveTitle(parsed.title, parsed.subTitle);
      const isGenericTitle = ProgramDataParser.isGenericTitle(resolvedTitle);
      const isGenericMovie = isGenericMovieTitle(resolvedTitle);

      return Program.create({
        id: this.generateProgramId(parsed),
        channelId,
        canonicalChannelId: channelId,
        title: resolvedTitle,
        subtitle: parsed.subTitle,
        normalizedTitle: normalizeTvToken(resolvedTitle, ' '),
        titleAliases: buildProgramTitleAliases(resolvedTitle),
        brandKey: buildProgramBrandKey(resolvedTitle),
        startTime,
        endTime,
        description: parsed.description,
        image,
        genre: parsed.category,
        year: parsed.year,
        rating: parsed.rating,
        sourceFeed: parsed.sourceFeed,
        sourceProgrammeId:
          parsed.sourceProgrammeId ||
          `${parsed.channelId}|${parsed.start}|${parsed.title}`,
        sourceAssetCandidates: Array.isArray(parsed.sourceAssetCandidates)
          ? parsed.sourceAssetCandidates
          : image
            ? [{ url: image, source: 'epg_program_image', sourceFeed: parsed.sourceFeed }]
            : [],
        sourceProvenance: parsed.sourceProvenance,
        trustFlags: {
          isGenericTitle,
          isGenericMovieTitle: isGenericMovie,
          titleResolutionState: isGenericMovie
            ? 'generic_unresolved'
            : 'specific_source_title',
          isResolvedTitle: !isGenericMovie,
          hasPoster: Boolean(image),
          sourceFeed: parsed.sourceFeed,
        },
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
    const sourceScopedSeed = [
      parsed.sourceFeed || 'unknown_source',
      parsed.sourceProgrammeId || '',
      parsed.channelId,
      parsed.start,
      parsed.stop,
      parsed.title,
    ].join('|');

    return createHash('sha1').update(sourceScopedSeed).digest('hex');
  }

  static isGenericTitle(title: string): boolean {
    const normalized = String(title || '').toLowerCase().trim();
    if (!normalized) return true;
    if (isGenericMovieTitle(normalized)) return true;
    if (GENERIC_TITLES.has(normalized)) return true;
    return normalized.startsWith('cine') && normalized.split(' ').length <= 3;
  }

  batchConvert(
    programmes: ParsedXMLProgram[],
    channelMap: Map<string, string>,
    channelIconUrls?: Set<string>
  ): Program[] {
    const programs: Program[] = [];
    let skipped = 0;

    for (const prog of programmes) {
      const program = this.convertToDomainEntity(prog, channelMap, channelIconUrls);
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
