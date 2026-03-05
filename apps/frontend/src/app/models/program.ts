// ============== CHANNEL INTERFACES ==============
export interface Channel {
  id: string;
  name: string;
  type: string;
  url_web: string;
  url_live: string;
  icon: string;
}

// ============== PROGRAM INTERFACES ==============
export interface ProgramTitle {
  lang: string;
  value: string;
}

export interface ProgramCategory {
  lang: string;
  value: string;
}

export interface ProgramDescription {
  country: string | null;
  comments: string | null;
  year: string | null;
  production: string | null;
  directors: string | null;
  screenplay: string | null;
  cast: string | null;
  music: string | null;
  rate: string | null;
  originalTitle: string | null;
  presenters: string | null;
  producer: string | null;
  votes: string | null;
  details: string | null;
  lang: string | null;
  category: string | null;
}

export interface ProgramItem {
  id: string;
  date: string;
  channel: string;
  channel_id: string;
  start: string;
  stop: string;
  duracion: number;
  title: ProgramTitle;
  category: ProgramCategory;
  type: string;
  icon?: string;
  rating?: any;
  starRating?: string;
  desc?: ProgramDescription;
}

export interface ProgramData {
  id?: string;
  channel: Channel;
  programs: ProgramItem[];
}

// ============== LEGACY INTERFACES (mantener compatibilidad) ==============
export interface Program {
  id: string;
  channelId: string;
  channelName: string;
  channelUrl: string;
  programId: string;
  programUrl: string;
  title: string;
  time: string;
  logoClass: string;
  description: string;
  image: string;
  start: string;
  end: string;
  chanelImage: any;
}

export interface ProgramList extends Program {
  url_web: string;
  url_live: string;
}

