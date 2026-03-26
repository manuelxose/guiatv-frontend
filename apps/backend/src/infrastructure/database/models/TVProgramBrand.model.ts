import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface ITVProgramBrandDocument {
  brandKey: string;
  title: string;
  normalizedTitle: string;
  titleAliases: string[];
  editorialCategory?: string;
  genre?: string;
  tmdbId?: number;
  assets?: Record<string, any>;
  sourceProvenance?: Record<string, any>;
  updatedFromDates?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TVProgramBrandSchema = new Schema<ITVProgramBrandDocument>(
  {
    brandKey: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    normalizedTitle: { type: String, required: true, trim: true, index: true },
    titleAliases: { type: [String], default: [], index: true },
    editorialCategory: { type: String, trim: true, index: true },
    genre: { type: String, trim: true },
    tmdbId: { type: Number, sparse: true, index: true },
    assets: { type: Schema.Types.Mixed as any },
    sourceProvenance: { type: Schema.Types.Mixed as any },
    updatedFromDates: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collection: 'tv_program_brands',
  }
);

TVProgramBrandSchema.index({ normalizedTitle: 1, updatedAt: -1 });
TVProgramBrandSchema.index({ titleAliases: 1, updatedAt: -1 });

export const TVProgramBrandModel = mongoose.model<ITVProgramBrandDocument>(
  'TVProgramBrand',
  TVProgramBrandSchema
);
