import { Program } from '../../domain/entities/Program';
import { logger } from '../../shared/utils/logger';
import { isGenericMovieTitle } from '../../shared/utils/tvMetadata';

/**
 * Normaliza y deduplica programas que representan el mismo espacio en parrilla.
 * Se agrupa por canal + hora de inicio (redondeada al minuto) y se escoge
 * siempre la version mas completa y especifica.
 */
export class ProgramDeduplicator {
  private readonly dedupeLogger = logger.child('ProgramDeduplicator');

  /**
   * Groups overlapping programs and keeps the highest quality candidate.
   *
   * @param programs - Raw program list that may contain duplicates.
   * @returns Deduplicated list preserving deterministic order.
   */
  dedupe(programs: Program[]): Program[] {
    const grouped = new Map<string, Program[]>();
    const firstIndex = new Map<string, number>();

    programs.forEach((program, index) => {
      const key = this.buildKey(program);
      if (!grouped.has(key)) {
        grouped.set(key, []);
        firstIndex.set(key, index);
      }
      grouped.get(key)!.push(program);
    });

    const cleaned: Program[] = [];
    let dropped = 0;

    grouped.forEach((bucket) => {
      if (bucket.length === 1) {
        cleaned.push(bucket[0]);
        return;
      }

      const winner = bucket.reduce((best, candidate) =>
        this.pickBetterProgram(best, candidate)
      );
      cleaned.push(winner);
      dropped += bucket.length - 1;
    });

    if (dropped > 0) {
      this.dedupeLogger.info('Deduplicated overlapping programs', {
        total: programs.length,
        kept: cleaned.length,
        dropped,
      });
    }

    // Mantener orden determinista segun la primera aparicion
    return cleaned.sort((a, b) => {
      const keyA = this.buildKey(a);
      const keyB = this.buildKey(b);
      const idxA = firstIndex.get(keyA) ?? 0;
      const idxB = firstIndex.get(keyB) ?? 0;
      if (idxA !== idxB) return idxA - idxB;
      return a.startTime.getTime() - b.startTime.getTime();
    });
  }

  private buildKey(program: Program): string {
    const startMinute = this.safeMinute(program.startTime, program.id);
    return `${program.channelId}|${startMinute}`;
  }

  private pickBetterProgram(current: Program, candidate: Program): Program {
    const currentScore = this.scoreProgram(current);
    const candidateScore = this.scoreProgram(candidate);

    if (candidateScore > currentScore) return candidate;
    if (currentScore > candidateScore) return current;

    const currentDesc = (current.description || '').length;
    const candidateDesc = (candidate.description || '').length;
    if (candidateDesc !== currentDesc) {
      return candidateDesc > currentDesc ? candidate : current;
    }

    const currentDuration = current.duration;
    const candidateDuration = candidate.duration;
    if (candidateDuration !== currentDuration) {
      return candidateDuration > currentDuration ? candidate : current;
    }

    const currentTitleLen = current.title.length;
    const candidateTitleLen = candidate.title.length;
    if (candidateTitleLen !== currentTitleLen) {
      return candidateTitleLen > currentTitleLen ? candidate : current;
    }

    return candidateScore >= currentScore ? candidate : current;
  }

  private scoreProgram(program: Program): number {
    let score = 0;
    const title = program.title || '';
    const normalizedTitle = ProgramDeduplicator.normalizeTitle(title);
    const isGeneric = ProgramDeduplicator.isGenericTitle(title);

    score += isGeneric ? -10 : 60;

    if (program.description) {
      score += Math.min(program.description.length / 40, 10);
    }
    if (program.image) score += 5;
    if (program.genre) score += 4;
    if ((program as any).rating) score += 2;
    if ((program as any).year) score += 1;

    // Recompensar titulos mas explicativos
    score += Math.min(normalizedTitle.length / 8, 6);

    // Duraciones mas largas suelen contener descripciones completas del espacio
    score += Math.min(program.duration / 30, 4);

    return score;
  }

  static isGenericTitle(title: string): boolean {
    const normalized = ProgramDeduplicator.normalizeTitle(title);
    if (!normalized) return true;
    if (isGenericMovieTitle(normalized)) return true;

    // Si incluye un subtitulo despues de ":", consideramos que ya es especifico
    const colonIndex = normalized.indexOf(':');
    if (colonIndex !== -1 && normalized.slice(colonIndex + 1).trim().length > 2) {
      return false;
    }

    const genericRoots = [
      'cine',
      'pelicula',
      'peliculas',
      'pelicula de la semana',
      'pelicula del dia',
      'movie',
      'film',
      'programa',
      'programacion',
      'programacion especial',
      'series',
      'serie',
      'cinema',
      'estreno',
      'historia de nuestro cine',
      'el blockbuster',
      'blockbuster',
      'el taquillazo',
      'taquillazo',
      'cine cuatro',
      'el peliculon',
      'multicine',
      'el western de la 2',
    ];

    if (genericRoots.includes(normalized)) return true;

    if (
      /^(cine|pelicula|peliculas|programa|programacion|serie|series)\b/.test(
        normalized
      )
    ) {
      const wordCount = normalized.split(' ').length;
      if (wordCount <= 3) return true;
    }

    return false;
  }

  static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9: ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private safeMinute(date: Date, fallbackSeed: string): number {
    const ts = date?.getTime?.();
    if (ts === undefined || Number.isNaN(ts)) {
      return this.hashToInt(fallbackSeed);
    }
    return Math.floor(ts / 60000);
  }

  private hashToInt(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
