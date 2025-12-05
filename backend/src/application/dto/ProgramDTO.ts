// src/v2/application/dto/ProgramDTO.ts

import { ChannelDTO } from './ChannelDTO';

/**
 * Transport-friendly representation of a program.
 */
export interface ProgramDTO {
  id: string;
  channelId: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // minutos
  date: string; // YYYYMMDD
  description?: string;
  image?: string;
  genre?: string;
  subgenre?: string;
  year?: string;
  rating?: string;
  details?: Record<string, string>;
}

/**
 * Paginated list response for programs.
 */
export interface ProgramListDTO {
  programs: ProgramDTO[];
  meta: {
    total: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

/**
 * API response model for a day schedule grouped by channel.
 */
export interface ScheduleDTO {
  date: string;
  channels: Array<{
    channel: ChannelDTO;
    programs: ProgramDTO[];
  }>;
  meta: {
    totalChannels: number;
    totalPrograms: number;
  };
}
