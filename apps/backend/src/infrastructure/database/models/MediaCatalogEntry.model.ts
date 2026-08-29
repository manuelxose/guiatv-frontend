import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IMediaCastMember {
  name: string;
  character?: string;
  profilePath?: string;
}

export interface IMediaGenreRef {
  id: number;
  name: string;
}

/**
 * Local persistent media catalog document. One row per distinct movie/series,
 * shared by EPG airings, search, recommendations and detail pages instead of
 * each caller re-fetching and duplicating full TMDB metadata.
 */
export interface IMediaCatalogDocument {
  tmdbId?: number;
  tmdbType?: 'movie' | 'tv';
  contentType: 'movie' | 'series';
  title: string;
  normalizedTitle: string;
  originalTitle?: string;
  normalizedIdentity: string;
  canonicalGenres: string[];
  tmdbGenres: IMediaGenreRef[];
  synopsis?: string;
  year?: string;
  runtimeMinutes?: number;
  rating?: number;
  voteCount?: number;
  posterPath?: string;
  backdropPath?: string;
  castSummary: IMediaCastMember[];
  directors: string[];
  metadataSource: 'tmdb' | 'epg' | 'manual' | 'backfill';
  lastEnrichedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MediaCastMemberSchema = new Schema<IMediaCastMember>(
  {
    name: { type: String, required: true, trim: true },
    character: { type: String, trim: true },
    profilePath: { type: String, trim: true },
  },
  { _id: false }
);

const MediaGenreRefSchema = new Schema<IMediaGenreRef>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MediaCatalogSchema = new Schema<IMediaCatalogDocument>(
  {
    tmdbId: { type: Number },
    tmdbType: { type: String, enum: ['movie', 'tv'] },
    contentType: { type: String, enum: ['movie', 'series'], required: true },
    title: { type: String, required: true, trim: true },
    normalizedTitle: { type: String, required: true, trim: true },
    originalTitle: { type: String, trim: true },
    normalizedIdentity: { type: String, required: true },
    canonicalGenres: { type: [String], default: [] },
    tmdbGenres: { type: [MediaGenreRefSchema], default: [] },
    synopsis: { type: String },
    year: { type: String, trim: true },
    runtimeMinutes: { type: Number },
    rating: { type: Number },
    voteCount: { type: Number },
    posterPath: { type: String, trim: true },
    backdropPath: { type: String, trim: true },
    castSummary: { type: [MediaCastMemberSchema], default: [] },
    directors: { type: [String], default: [] },
    metadataSource: {
      type: String,
      enum: ['tmdb', 'epg', 'manual', 'backfill'],
      default: 'epg',
    },
    lastEnrichedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'media_catalog',
  }
);

// Primary dedup key once a TMDB id is known. Sparse so entries discovered only
// through EPG (no TMDB match yet) don't collide on a shared `null`.
MediaCatalogSchema.index({ tmdbType: 1, tmdbId: 1 }, { unique: true, sparse: true });
// Secondary identity used to resolve/dedupe entries before a TMDB id exists, and
// to answer "have we already seen this title" lookups during EPG enrichment.
// Intentionally NOT unique: distinct TMDB ids can legitimately share a
// normalized title + year (remakes, regional variants); the repository layer
// decides whether to merge or create based on this index, rather than the
// database rejecting a write outright.
MediaCatalogSchema.index({ normalizedIdentity: 1 });
MediaCatalogSchema.index({ normalizedTitle: 1 });
MediaCatalogSchema.index({ lastEnrichedAt: 1 });

export const MediaCatalogModel = mongoose.model<IMediaCatalogDocument>(
  'MediaCatalog',
  MediaCatalogSchema
);
