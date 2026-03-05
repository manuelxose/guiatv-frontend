import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TvDataService } from './tv-data.service';
import {
  ChannelMetaDTO,
  DateAlias,
  ProgramsQuery,
  ProgramLayoutDTO,
  TimeSlotDTO,
} from '../api/models';
import { IProgramItem, IProgramListData } from '../interfaces/program-list.interface';

export interface ProgramListSnapshot {
  date: string;
  channels: IProgramListData[];
  timeSlots: TimeSlotDTO[];
  meta: {
    totalChannels: number;
    totalPrograms: number;
  };
}

const TYPE_ORDER: Record<string, number> = {
  TDT: 0,
  AUTONOMICO: 1,
  MOVISTAR: 2,
  CABLE: 3,
  OTT: 4,
};

const TDT_PRIORITY = [
  'LA 1',
  'LA 2',
  'ANTENA 3',
  'CUATRO',
  'TELECINCO',
  'LA SEXTA',
  'PARAMOUNT NETWORK',
  'DIVINITY',
  'DKISS',
  'TEN',
  'BE MAD',
  'MEGA',
  'DMAX',
  'ENERGY',
  'FDF',
  'ATRESERIES',
  'NEOX',
  'NOVA',
];

const DEFAULT_CHANNEL_TYPES = ['TDT', 'CABLE', 'MOVISTAR', 'AUTONOMICO', 'OTT'];

@Injectable({ providedIn: 'root' })
export class ProgramListService {
  constructor(private tvData: TvDataService) {}

  /**
   * Devuelve la lista de canales + programas con layout precalculado desde /v2/layouts/{date}.
   * Usa fields=full por defecto para mantener metadatos necesarios en UI.
   */
  loadProgramList(
    date: DateAlias,
    query?: Pick<ProgramsQuery, 'channels' | 'timeSlot' | 'channelTypes' | 'fields' | 'limit'>
  ): Observable<ProgramListSnapshot> {
    return this.tvData
      .loadPrograms({
        date,
        // Usamos 'full' para obtener poster/image del programa y mostrarlo en el modal
        fields: query?.fields ?? 'full',
        channels: query?.channels,
        timeSlot: query?.timeSlot,
        channelTypes: query?.channelTypes ?? DEFAULT_CHANNEL_TYPES,
        limit: query?.limit ?? 5000,
      })
      .pipe(
        map((resp) => {
          // Map channel meta for quick lookup (includes icon)
          const channelMap = new Map<string, ChannelMetaDTO>();
          (resp.channels || []).forEach((c) => {
            if (c?.id) channelMap.set(c.id, c);
          });

          // Group programs by channelId
          const grouped = new Map<string, ProgramLayoutDTO[]>();
          (resp.programs || []).forEach((p) => {
            const channelId = p.channelId || 'unknown';
            if (!grouped.has(channelId)) grouped.set(channelId, []);
            grouped.get(channelId)!.push(p);
          });

          const channels = Array.from(grouped.entries()).map(([channelId, programs]) => {
            const meta =
              channelMap.get(channelId) ||
              this.tvData.getCachedChannelMeta(channelId) || { id: channelId, name: channelId };
            return this.mapChannel(meta, programs);
          });

          const sorted = channels.sort((a, b) =>
            this.compareChannels(a.channel.type, b.channel.type, a.channel.name, b.channel.name)
          );

          const totalPrograms = sorted.reduce(
            (acc, c) => acc + (c.channels?.length || 0),
            0
          );

          return {
            date: resp.date,
            channels: sorted,
            timeSlots: resp.timeSlots || [],
            meta: {
              totalChannels: sorted.length,
              totalPrograms,
            },
          };
        })
      );
  }

  private mapChannel(channel: ChannelMetaDTO, programs: ProgramLayoutDTO[]): IProgramListData {
    const enriched = this.tvData.getCachedChannelMeta(channel.id);
    const channelInfo = {
      id: channel.id,
      name: channel.name,
      icon: channel.icon || enriched?.icon || '',
      type: channel.type || enriched?.type,
    };

    const mappedPrograms: IProgramItem[] = programs.map(
      (p) =>
        ({
          id: p.id,
          title: typeof p.title === 'object' ? p.title : { value: p.title },
          start: p.start,
          stop: p.end,
          image: (p as any).image,
          poster: (p as any).poster || (p as any).image || (p as any).background,
          icon: (p as any).icon,
          background: (p as any).background,
          category: p.category ? { value: p.category, lang: 'es' } : undefined,
          desc: p.description ? { value: p.description, lang: 'es' } : undefined,
          duracion: p.durationMinutes,
          starRating: p.rating ? Number(p.rating) : undefined,
          // Layout passthrough for consumers that need grid
          gridColumnStart: p.gridColumnStart,
          gridColumnEnd: p.gridColumnEnd,
          layerIndex: p.layerIndex,
          isCutAtStart: p.isCutAtStart,
          isCutAtEnd: p.isCutAtEnd,
          visibleStartTime: p.visibleStartTime,
          visibleEndTime: p.visibleEndTime,
          crossesMidnight: p.crossesMidnight,
          layoutsBySlot: p.layoutsBySlot,
          pxStart: p.pxStart,
          pxWidth: p.pxWidth,
          timeSlotIndex: p.timeSlotIndex,
        } as IProgramItem)
    );

    return {
      id: channel.id,
      channel: channelInfo,
      channels: mappedPrograms,
    };
  }

  private compareChannels(
    typeA?: string,
    typeB?: string,
    nameA?: string,
    nameB?: string
  ): number {
    const tA = (typeA || '').toUpperCase();
    const tB = (typeB || '').toUpperCase();

    const oA = TYPE_ORDER[tA] ?? 99;
    const oB = TYPE_ORDER[tB] ?? 99;
    if (oA !== oB) return oA - oB;

    if (tA === 'TDT' && tB === 'TDT') {
      const idxA = TDT_PRIORITY.indexOf((nameA || '').toUpperCase());
      const idxB = TDT_PRIORITY.indexOf((nameB || '').toUpperCase());
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        if (idxA !== idxB) return idxA - idxB;
      }
    }

    return (nameA || '').localeCompare(nameB || '', 'es', {
      sensitivity: 'base',
    });
  }
}
