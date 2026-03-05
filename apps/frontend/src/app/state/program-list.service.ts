import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TvDataService } from './tv-data.service';
import {
  ChannelMetaDTO,
  DateAlias,
  LayoutsQuery,
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
    query?: Pick<LayoutsQuery, 'channels' | 'timeSlot' | 'channelTypes' | 'fields'>
  ): Observable<ProgramListSnapshot> {
    return this.tvData
      .loadLayouts(date, {
        fields: query?.fields ?? 'full',
        channels: query?.channels,
        timeSlot: query?.timeSlot,
        channelTypes: query?.channelTypes ?? DEFAULT_CHANNEL_TYPES,
      })
      .pipe(
        map((resp) => {
          const channels = (resp.channels || [])
            .filter((entry) => !!this.resolveChannelId(entry))
            .map((entry) =>
              this.mapChannel(entry.channel, entry.programs || [])
            );

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

  private mapChannel(
    channel: Partial<ChannelMetaDTO> | undefined,
    programs: ProgramLayoutDTO[]
  ): IProgramListData {
    const channelId = String(
      channel?.id || programs.find((p) => !!p?.channelId)?.channelId || ''
    ).trim();
    const enriched = this.tvData.getCachedChannelMeta(channelId);
    const channelInfo = {
      id: channelId,
      name:
        String(channel?.name || enriched?.name || channelId || 'Canal desconocido').trim() ||
        'Canal desconocido',
      icon:
        String(channel?.icon || enriched?.icon || '').trim(),
      type: String(channel?.type || enriched?.type || '').trim() || undefined,
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
      id: channelId,
      channel: channelInfo,
      channels: mappedPrograms,
    };
  }

  private resolveChannelId(entry: any): string {
    return String(
      entry?.channel?.id ||
      entry?.channelId ||
      entry?.programs?.[0]?.channelId ||
      ''
    ).trim();
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
