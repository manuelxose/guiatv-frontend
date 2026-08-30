import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { AffiliateMerchantStatus } from '@/domain/entities/AffiliateMerchant';

export interface IAffiliateMerchantDocument {
  slug: string;
  canonicalProviderKey: string;
  name: string;
  aliases: string[];
  logo?: string;
  category: string;
  officialUrl: string;
  markets: string[];
  status: AffiliateMerchantStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateMerchantSchema = new Schema<IAffiliateMerchantDocument>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true },
    canonicalProviderKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    logo: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    officialUrl: { type: String, required: true, trim: true },
    markets: { type: [String], default: [] },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'affiliate_merchants',
  }
);

AffiliateMerchantSchema.index({ slug: 1 }, { unique: true });
AffiliateMerchantSchema.index({ canonicalProviderKey: 1 });
AffiliateMerchantSchema.index({ aliases: 1 });
AffiliateMerchantSchema.index({ status: 1 });
AffiliateMerchantSchema.index({ markets: 1 });

export const AffiliateMerchantModel = mongoose.model<IAffiliateMerchantDocument>(
  'AffiliateMerchant',
  AffiliateMerchantSchema
);
