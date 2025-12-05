export type MediaType = 'movie' | 'tv_show' | 'program' | 'person';

/**
 * Image metadata used across media cards and details.
 */
export interface MediaImageDTO {
  url: string;
  aspectRatio?: number;
}

/**
 * Aggregated rating information from TMDB or internal users.
 */
export interface MediaRatingDTO {
  average?: number;
  count?: number;
}

/**
 * Contextual schedule data when a media item is currently airing.
 */
export interface MediaCardContextScheduleDTO {
  channel: string;
  channelId?: string;
  start: string;
  end?: string;
  live?: boolean;
  progressPercent?: number;
}

/**
 * Contextual user interaction flags.
 */
export interface MediaCardContextInteractionDTO {
  inWatchlist?: boolean;
  seen?: boolean;
  liked?: boolean;
}

/**
 * Combined context that enriches a media card in UI.
 */
export interface MediaCardContextDTO {
  schedule?: MediaCardContextScheduleDTO;
  userInteraction?: MediaCardContextInteractionDTO;
}

/**
 * Base card representation for media carousels and lists.
 */
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

/**
 * Detailed representation for detail pages or enriched cards.
 */
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

/**
 * Minimal representation of CMS blog posts surfaced in discovery.
 */
export interface BlogPostDTO {
  title: string;
  slug: string;
  excerpt?: string;
  image?: MediaImageDTO;
  publishedAt?: string;
}

/**
 * Named collection of media cards displayed in the home view.
 */
export interface HomeCollectionDTO {
  title: string;
  items: MediaCardDTO[];
}

/**
 * Pre-rendered home view composition returned by discovery endpoints.
 */
export interface HomeViewDTO {
  hero: MediaCardDTO[];
  whatToWatch: HomeCollectionDTO;
  liveNow: HomeCollectionDTO;
  blogHighlights: BlogPostDTO[];
  generatedAt: string;
}
