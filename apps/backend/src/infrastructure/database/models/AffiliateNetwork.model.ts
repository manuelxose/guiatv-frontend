import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { AffiliateNetworkStatus, AffiliateNetworkTrackingType } from '@/domain/entities/AffiliateNetwork';

export interface IAffiliateNetworkDocument {
  slug: string;
  name: string;
  trackingType: AffiliateNetworkTrackingType;
  markets: string[];
  status: AffiliateNetworkStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateNetworkSchema = new Schema<IAffiliateNetworkDocument>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    trackingType: {
      type: String,
      required: true,
      enum: ['direct', 'url_template', 'redirect_endpoint', 'tag_param', 'api'],
    },
    markets: { type: [String], default: [] },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'inactive'],
      default: 'active',
    },
    metadata: { type: Schema.Types.Mixed, default: undefined },
  },
  {
    timestamps: true,
    collection: 'affiliate_networks',
  }
);

AffiliateNetworkSchema.index({ slug: 1 }, { unique: true });
AffiliateNetworkSchema.index({ status: 1 });

export const AffiliateNetworkModel = mongoose.model<IAffiliateNetworkDocument>(
  'AffiliateNetwork',
  AffiliateNetworkSchema
);
