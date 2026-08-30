import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { CommercialRelationship } from '@/application/dto/MonetizationDTO';
import { AffiliateProgramStatus, AffiliateProgramVerificationStatus } from '@/domain/entities/AffiliateProgram';

export interface IAffiliateProgramDocument {
  merchantId: mongoose.Types.ObjectId;
  networkId: mongoose.Types.ObjectId;
  market: string;
  externalProgramId?: string;
  relationship: CommercialRelationship;
  status: AffiliateProgramStatus;
  allowedHosts: string[];
  disclosure: string;
  commission?: {
    type?: string;
    value?: number;
    currency?: string;
    notes?: string;
  };
  attribution?: {
    cookieDays?: number;
    clickIdParam?: string;
    secretRef?: string;
  };
  verification: {
    source?: string;
    verifiedAt?: Date;
    status: AffiliateProgramVerificationStatus;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateProgramSchema = new Schema<IAffiliateProgramDocument>(
  {
    merchantId: { type: Schema.Types.ObjectId, required: true, ref: 'AffiliateMerchant' },
    networkId: { type: Schema.Types.ObjectId, required: true, ref: 'AffiliateNetwork' },
    market: { type: String, required: true, trim: true, uppercase: true },
    externalProgramId: { type: String, trim: true },
    relationship: {
      type: String,
      required: true,
      enum: [
        'affiliate_configured',
        'direct_commercial_link',
        'no_affiliate_available',
        'unknown',
        'manual_agreement_required',
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
    allowedHosts: { type: [String], default: [] },
    disclosure: { type: String, required: true, trim: true },
    // Nested Schema (not the `{ type: {...} }` shorthand) — the shorthand is ambiguous when a
    // sub-field is itself named `type` (commission.type), which Mongoose misparses as a type descriptor.
    commission: {
      type: new Schema(
        {
          type: { type: String, trim: true },
          value: { type: Number },
          currency: { type: String, trim: true },
          notes: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: undefined,
    },
    attribution: {
      type: new Schema(
        {
          cookieDays: { type: Number },
          clickIdParam: { type: String, trim: true },
          secretRef: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: undefined,
    },
    verification: {
      type: {
        source: { type: String, trim: true },
        verifiedAt: { type: Date },
        status: {
          type: String,
          required: true,
          enum: ['pending', 'approved', 'needs_review'],
          default: 'pending',
        },
      },
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'affiliate_programs',
  }
);

AffiliateProgramSchema.index({ merchantId: 1, market: 1 });
AffiliateProgramSchema.index({ networkId: 1 });
AffiliateProgramSchema.index({ status: 1 });
AffiliateProgramSchema.index({ externalProgramId: 1 });
// Idempotency key for the seed/migration path — one program per merchant+network+market.
AffiliateProgramSchema.index({ merchantId: 1, networkId: 1, market: 1 }, { unique: true });

export const AffiliateProgramModel = mongoose.model<IAffiliateProgramDocument>(
  'AffiliateProgram',
  AffiliateProgramSchema
);
