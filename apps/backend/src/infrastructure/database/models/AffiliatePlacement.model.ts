import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IAffiliatePlacementDocument {
  key: string;
  page: string;
  description?: string;
  enabled: boolean;
  legacyKeys?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AffiliatePlacementSchema = new Schema<IAffiliatePlacementDocument>(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    page: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    enabled: { type: Boolean, required: true, default: true },
    legacyKeys: { type: [String], default: undefined },
  },
  {
    timestamps: true,
    collection: 'affiliate_placements',
  }
);

AffiliatePlacementSchema.index({ key: 1 }, { unique: true });
AffiliatePlacementSchema.index({ enabled: 1 });
AffiliatePlacementSchema.index({ legacyKeys: 1 });

export const AffiliatePlacementModel = mongoose.model<IAffiliatePlacementDocument>(
  'AffiliatePlacement',
  AffiliatePlacementSchema
);
