export type MediaType = 'movie' | 'tv_show' | 'program' | 'person';

export interface MediaImageDTO {
  url: string;
  aspectRatio?: number;
}

export interface MediaRatingDTO {
  average?: number;
  count?: number;
}

export interface MediaCardContextScheduleDTO {
  channel: string;
  channelId?: string;
  start: string;
  end?: string;
  live?: boolean;
  progressPercent?: number;
}

export interface MediaCardContextInteractionDTO {
  inWatchlist?: boolean;
  seen?: boolean;
  liked?: boolean;
}

export interface MediaCardContextDTO {
  schedule?: MediaCardContextScheduleDTO;
  userInteraction?: MediaCardContextInteractionDTO;
}

export interface MediaCardDTO {
  id: string;
  type: MediaType;
  title: string;
  subtitle?: string;
  image?: MediaImageDTO;
  badges?: string[];
  rating?: MediaRatingDTO;
  context?: MediaCardContextDTO;
}

export interface MediaDetailDTO extends MediaCardDTO {
  synopsis?: string;
  credits?: Array<{ role: string; name: string; id?: string }>;
  videos?: Array<{ type: string; url: string; title?: string }>;
  whereToWatch?: Array<{ provider: string; link?: string; price?: string }>;
  socialSummary?: {
    friendsRating?: number | null;
    topReview?: { user: string; text: string } | null;
  };
  related?: MediaCardDTO[];
  schedule?: MediaCardDTO[];
  ratings?: MediaRatingDTO;
}

export interface BlogPostDTO {
  title: string;
  slug: string;
  excerpt?: string;
  image?: MediaImageDTO;
  publishedAt?: string;
}

export interface HomeCollectionDTO {
  title: string;
  items: MediaCardDTO[];
}

export interface HomeViewDTO {
  hero: MediaCardDTO[];
  whatToWatch: HomeCollectionDTO;
  liveNow: HomeCollectionDTO;
  blogHighlights: BlogPostDTO[];
  generatedAt: string;
}
