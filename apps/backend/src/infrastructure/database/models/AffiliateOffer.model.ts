import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import {
  AffiliateDeepLinkStrategy,
  AffiliateOfferStatus,
  AffiliateOfferVerificationStatus,
} from '@/domain/entities/AffiliateOffer';

export interface IAffiliateOfferDocument {
  merchantId: mongoose.Types.ObjectId;
  affiliateProgramId: mongoose.Types.ObjectId;
  market: string;
  category: string;
  plan: { id: string; name: string };
  pricing: {
    currency: string;
    monthlyAmount: number | null;
    annualAmount: number | null;
    monthlyLabel: string;
    annualLabel: string;
    activationFeeAmount: number | null;
    promotion?: { label: string; expiresAt?: string };
  };
  features: Record<string, unknown>;
  requirements: {
    commitmentMonths: number;
    fibreRequired: boolean;
    mobileRequired: boolean;
    device: string | null;
  };
  trial: { days: number | null };
  recommendationIntents: string[];
  placements?: string[];
  destination: {
    strategy: AffiliateDeepLinkStrategy;
    url: string;
    template?: string;
    params?: Record<string, string>;
  };
  validity: {
    validFrom?: Date;
    validUntil?: Date;
  };
  status: AffiliateOfferStatus;
  verification: {
    source?: string;
    verifiedAt?: Date;
    status: AffiliateOfferVerificationStatus;
  };
  display: {
    bestFor?: string;
    highlight?: string;
    disclosure: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateOfferSchema = new Schema<IAffiliateOfferDocument>(
  {
    merchantId: { type: Schema.Types.ObjectId, required: true, ref: 'AffiliateMerchant' },
    affiliateProgramId: { type: Schema.Types.ObjectId, required: true, ref: 'AffiliateProgram' },
    market: { type: String, required: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    plan: {
      type: {
        id: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
      },
      required: true,
    },
    pricing: {
      type: {
        currency: { type: String, required: true, trim: true },
        monthlyAmount: { type: Number, default: null },
        annualAmount: { type: Number, default: null },
        monthlyLabel: { type: String, required: true, trim: true },
        annualLabel: { type: String, required: true, trim: true },
        activationFeeAmount: { type: Number, default: null },
        promotion: {
          type: {
            label: { type: String, trim: true },
            expiresAt: { type: String, trim: true },
          },
          default: undefined,
        },
      },
      required: true,
    },
    features: { type: Schema.Types.Mixed, default: {} },
    requirements: {
      type: {
        commitmentMonths: { type: Number, required: true, default: 0 },
        fibreRequired: { type: Boolean, required: true, default: false },
        mobileRequired: { type: Boolean, required: true, default: false },
        device: { type: String, default: null },
      },
      required: true,
    },
    trial: {
      type: {
        days: { type: Number, default: null },
      },
      required: true,
    },
    recommendationIntents: { type: [String], default: [], index: true },
    placements: { type: [String], default: undefined, index: true },
    destination: {
      type: {
        strategy: {
          type: String,
          required: true,
          enum: ['direct_url', 'url_template', 'network_redirect', 'tag_param', 'api_generated'],
        },
        url: { type: String, required: true, trim: true },
        template: { type: String, trim: true },
        params: { type: Schema.Types.Mixed, default: undefined },
      },
      required: true,
    },
    validity: {
      type: {
        validFrom: { type: Date },
        validUntil: { type: Date },
      },
      default: {},
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'expired', 'draft'],
      default: 'draft',
    },
    verification: {
      type: {
        source: { type: String, trim: true },
        verifiedAt: { type: Date },
        status: {
          type: String,
          required: true,
          enum: ['current', 'stale', 'needs_review'],
          default: 'needs_review',
        },
      },
      required: true,
    },
    display: {
      type: {
        bestFor: { type: String, trim: true },
        highlight: { type: String, trim: true },
        disclosure: { type: String, required: true, trim: true },
      },
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'affiliate_offers',
  }
);

AffiliateOfferSchema.index({ merchantId: 1 });
AffiliateOfferSchema.index({ affiliateProgramId: 1 });
AffiliateOfferSchema.index({ market: 1, status: 1 });
AffiliateOfferSchema.index({ status: 1 });
AffiliateOfferSchema.index({ category: 1, market: 1, status: 1 });
AffiliateOfferSchema.index({ 'validity.validFrom': 1 });
AffiliateOfferSchema.index({ 'validity.validUntil': 1 });
// Idempotency key for the seed/migration path — one offer per merchant+program+market+plan.
AffiliateOfferSchema.index({ merchantId: 1, affiliateProgramId: 1, market: 1, 'plan.id': 1 }, { unique: true });

export const AffiliateOfferModel = mongoose.model<IAffiliateOfferDocument>('AffiliateOffer', AffiliateOfferSchema);
