import { Injectable } from '@angular/core';
import { IProgramItem, IProgramListData } from 'src/app/interfaces';
import {
  IdealPayload,
  IdealChannel,
  IdealProgram,
} from '../models/ideal-server.model';

/**
 * ProgramListAdapterService
 * ------------------------
 * This temporary adapter converts the backend payload into a compact,
 * render-friendly shape that the ProgramListComponent expects. The adapter
 * adds numeric fields (startMinutes, endMinutes, durationMinutes) and
 * normalizes category lists and titles so the UI rendering code doesn't
 * have to transform raw values at runtime.
 *
 * Ideal server payload (recommended for maximum rendering performance):
 * - channels: [
 *     {
 *       id: string,
 *       name: string,
 *       icon?: string,
 *       programs: [
 *         {
 *           id: string,
 *           title: string,                 // plain string (avoid nested objects)
 *           startMinutes: number,          // minutes since local 00:00 (fast to compute)
 *           endMinutes: number,            // minutes since local 00:00
 *           durationMinutes: number,       // end - start (redundant but useful)
 *           categories: string[],          // array of normalized category ids
 *           description?: string,
 *           poster?: string,
 *           rating?: string | number,
 *         }
 *       ]
 *     }
 *   ]
 *
 * Notes / rationale:
 * - startMinutes/endMinutes as numbers avoid parsing timestamps in the UI.
 * - title as a plain string avoids template branching and extra conversions.
 * - categories as an array makes filtering cheap (Array.includes).
 * - The backend can precompute grid columns or a "slotIndex" if desired to
 *   further speed rendering.
 */

export interface NormalizedProgram {
  id: string;
  title: string;
  start: string; // HH:MM
  stop: string; // HH:MM
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  categories: string[];
  desc?: string;
  poster?: string;
  rating?: string | number;
  // allow pass-through for any extra fields
  [k: string]: any;
}

export interface NormalizedChannel {
  id: string;
  channel: { id: string; name: string; icon?: string };
  channels: NormalizedProgram[];
  [k: string]: any;
}

@Injectable({ providedIn: 'root' })
export class ProgramListAdapterService {
  constructor() {}

  /**
   * Convert incoming IProgramListData[] into NormalizedChannel[] where every
   * program has numeric minute fields and normalized arrays for categories.
   */
  adaptProgramList(data: IProgramListData[] | any[]): NormalizedChannel[] {
    if (!Array.isArray(data)) return [];

    return data.map((canal) => {
      const channelObj = this.normalizeChannel(canal.channel, canal.id);

      const rawPrograms = Array.isArray(canal.channels)
        ? canal.channels
        : canal.programs || [];

      const channels = rawPrograms.map((p) => this.normalizeProgram(p));

      return {
        ...canal,
        id: canal.id || channelObj.id,
        channel: channelObj,
        channels,
      } as NormalizedChannel;
    });
  }

  /**
   * Proporciona la forma IDEAL de la carga que el servidor debería enviar.
   * Esto reduce la carga de procesado en el componente: programas con
   * startMinutes/endMinutes/durationMinutes ya calculados y categorías
   * normalizadas como strings en un array.
   *
   * Si el payload ya está en formato ideal, lo retorna tal cual.
   */
  provideIdealPayload(data: IProgramListData[] | any[]): IdealPayload {
    if (!Array.isArray(data)) return [];

    // Detect simple case: si el primer elemento tiene 'programs' y los items
    // contienen startMinutes numérico asumimos ya es el formato ideal.
    const first = data[0];
    if (
      first &&
      (first.programs || first.channels) &&
      Array.isArray(first.programs)
    ) {
      const maybeProgram = first.programs[0];
      if (maybeProgram && typeof maybeProgram.startMinutes === 'number') {
        // Cast seguro: ya es el formato ideal
        return data as IdealPayload;
      }
    }

    // Fallback: convertir usando la lógica normalizadora existente
    const ideal: IdealPayload = data.map((canal) => {
      const channelObj = this.normalizeChannel(
        canal.channel || canal,
        canal.id
      );

      const rawPrograms = Array.isArray(canal.channels)
        ? canal.channels
        : canal.programs || [];

      const programs: IdealProgram[] = rawPrograms.map((p) => {
        const normalized = this.normalizeProgram(p);
        return {
          id: normalized.id,
          title: normalized.title,
          startMinutes: normalized.startMinutes,
          endMinutes: normalized.endMinutes,
          durationMinutes: normalized.durationMinutes,
          categories: normalized.categories,
          description: normalized.desc,
          poster: normalized.poster,
          rating: normalized.rating,
          // preserve any other fields minimally
        } as IdealProgram;
      });

      return {
        id: canal.id || channelObj.id,
        name: channelObj.name,
        icon: channelObj.icon,
        programs,
      } as IdealChannel;
    });

    return ideal;
  }

  /**
   * USAGE NOTE:
   * - If the backend is updated to return the IdealPayload shape, change the
   *   program-list facade to call `adapter.provideIdealPayload(rawData)` and
   *   feed the component with that payload. The component will no longer need
   *   to run expensive normalization or string parsing at runtime.
   * - For now this method acts as a bridge: it converts legacy payloads to the
   *   ideal shape while still supporting backward compatibility.
   */

  private normalizeChannel(channel: any, fallbackId: any) {
    if (!channel || typeof channel !== 'object') {
      return {
        id: fallbackId || 'unknown',
        name: String(channel || fallbackId),
      };
    }

    return {
      id: channel.id || fallbackId || channel.name || 'unknown',
      name: channel.name || channel.id || String(fallbackId || 'Canal'),
      icon: channel.icon || channel.logo || channel.image || '',
    };
  }

  private normalizeProgram(program: any): NormalizedProgram {
    const id = String(
      program.id || program.uid || Math.random().toString(36).slice(2, 9)
    );

    const title = this.normalizeTitle(
      program.title || program.name || program.titulo || id
    );

    const startRaw =
      program.start || program.startTime || program.start_date || '';
    const stopRaw = program.stop || program.endTime || program.stop_date || '';

    const start = this.toHHMM(startRaw);
    const stop = this.toHHMM(stopRaw);

    const startMinutes = this.toMinutes(startRaw, start);
    const endMinutes = this.toMinutes(stopRaw, stop);

    const duration = Math.max(0, endMinutes - startMinutes || 0);

    const categories = this.toCategories(
      program.category || program.categories || program.tags || ''
    );

    return {
      ...program,
      id,
      title,
      start,
      stop,
      startMinutes,
      endMinutes,
      durationMinutes: duration,
      categories,
      desc: program.desc || program.description || program.sinopsis || '',
      poster: program.poster || program.image || program.thumbnail || '',
      rating: program.rating || program.rate || program.starRating || '',
    } as NormalizedProgram;
  }

  private normalizeTitle(title: any): string {
    if (!title) return '';
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title.value) return String(title.value);
    return String(title);
  }

  private toCategories(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw))
      return raw.map((r) => String(r).trim()).filter(Boolean);
    if (typeof raw === 'string') {
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
    }
    try {
      return (Object.values(raw) as string[]).map((s) => String(s).trim());
    } catch {
      return [];
    }
  }

  private toHHMM(value: any): string {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value))
      return value;
    const parsed = Date.parse(String(value));
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return `${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    }
    const s = String(value);
    const m = s.match(/(\d{1,2}:\d{2})/);
    if (m) return m[1];
    return s;
  }

  private toMinutes(raw: any, hhmmFallback?: string): number {
    // If the value is already a number, assume it's minutes
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;

    // If raw is string HH:MM
    if (typeof raw === 'string' && /^\d{1,2}:\d{2}$/.test(raw)) {
      const [h, m] = raw.split(':').map(Number);
      return h * 60 + m;
    }

    // Try parsing date-like
    const parsed = Date.parse(String(raw));
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return d.getHours() * 60 + d.getMinutes();
    }

    // Fallback: if hhmmFallback provided, try it
    if (hhmmFallback && /^\d{1,2}:\d{2}$/.test(hhmmFallback)) {
      const [h, m] = hhmmFallback.split(':').map(Number);
      return h * 60 + m;
    }

    return 0;
  }
}
