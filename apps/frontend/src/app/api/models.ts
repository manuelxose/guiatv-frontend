// API contracts aligned with backend/README_api.md (v2)
export type DateAlias = 'yesterday' | 'today' | 'tomorrow' | 'after_tomorrow' | string; // YYYYMMDD also allowed

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ChannelMetaDTO {
  id: string;
  name: string;
  icon?: string | null;
  type?: string;
  country?: string;
  countryCode?: string;
}

export interface TimeSlotDTO {
  index: number; // 0-7
  start: string; // "00:00"
  end: string; // "03:00"
  startMinutes: number;
  endMinutes: number;
}

export interface ProgramLayoutDTO {
  id: string;
  channelId: string;
  title: string | { value: string; lang?: string };
  start: string;
  end: string;
  durationMinutes: number;
  category?: string;
  image?: string;
  rating?: string;
  tmdbId?: number;
  description?: string;
  timeSlotIndex: number | null;
  gridColumnStart: number;
  gridColumnEnd: number;
  columnStartMinutes?: number;
  columnEndMinutes?: number;
  layerIndex: number;
  isCutAtStart: boolean;
  isCutAtEnd: boolean;
  visibleStartTime: string;
  visibleEndTime: string;
  crossesMidnight: boolean;
  pxStart?: number;
  pxWidth?: number;
  fieldsProvided?: 'minimal' | 'full';
  layoutsBySlot?: Array<{
    timeSlotIndex: number;
    gridColumnStart: number;
    gridColumnEnd: number;
    layerIndex?: number;
    isCutAtStart?: boolean;
    isCutAtEnd?: boolean;
    visibleStartTime?: string;
    visibleEndTime?: string;
    crossesMidnight?: boolean;
    pxStart?: number;
    pxWidth?: number;
  }>;
}

export interface LayoutsResponse {
  date: string;
  timeSlots: TimeSlotDTO[];
  channels: Array<{
    channel: ChannelMetaDTO;
    programs: ProgramLayoutDTO[];
  }>;
}

export interface ProgramsResponse {
  date: string;
  timeSlots: TimeSlotDTO[];
  channels: ChannelMetaDTO[];
  programs: ProgramLayoutDTO[];
}

export interface ProgramResponse {
  program: ProgramLayoutDTO;
}

export interface ScheduleResponse {
  date: string;
  channels: Array<{
    channel: ChannelMetaDTO;
    programs: ProgramLayoutDTO[];
  }>;
}

export interface ScheduleChannelsSummary {
  date: string;
  channels: Array<{
    channel: Pick<ChannelMetaDTO, 'id' | 'name'>;
    programCount: number;
    firstProgram?: { title: string; start: string };
    lastProgram?: { title: string; end: string };
  }>;
}

export interface NowPlayingResponse {
  programs: Array<{
    id: string;
    channelId: string;
    title: string;
    start: string;
    end: string;
    isLive: boolean;
  }>;
  timestamp: string;
}

export interface ProgramsQuery {
  date: DateAlias;
  channels?: string[];
  timeSlot?: string;
  fields?: 'minimal' | 'full';
  page?: number;
  limit?: number;
  country?: string;
  channelTypes?: string[];
}

export interface LayoutsQuery {
  channels?: string[];
  timeSlot?: string;
  fields?: 'minimal' | 'full';
  channelTypes?: string[];
}
