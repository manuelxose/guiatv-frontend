import * as mongoose from 'mongoose';
import { AffiliateOffer, AffiliateOfferProps } from '@/domain/entities/AffiliateOffer';
import {
  AffiliateOfferAdminFilter,
  AffiliateOfferCandidateFilter,
  AffiliateOfferUpsertInput,
  IAffiliateOfferRepository,
} from '@/domain/repositories/IAffiliateOfferRepository';
import { AffiliateOfferModel, IAffiliateOfferDocument } from '../database/models/AffiliateOffer.model';

/** Builds the `{ $or: [{ validity.validFrom missing/<=asOf }], validity.validUntil missing/>=asOf }` window match. */
function validityMatch(asOf: Date): Record<string, unknown> {
  return {
    $and: [
      { $or: [{ 'validity.validFrom': { $exists: false } }, { 'validity.validFrom': { $lte: asOf } }] },
      { $or: [{ 'validity.validUntil': { $exists: false } }, { 'validity.validUntil': { $gte: asOf } }] },
    ],
  };
}

export class MongoAffiliateOfferRepository implements IAffiliateOfferRepository {
  async findById(id: string): Promise<AffiliateOffer | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliateOfferModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findByMerchant(merchantId: string, market?: string): Promise<AffiliateOffer[]> {
    if (!mongoose.isValidObjectId(merchantId)) return [];
    const query: Record<string, unknown> = { merchantId: new mongoose.Types.ObjectId(merchantId) };
    if (market) query.market = market.toUpperCase().trim();

    const docs = await AffiliateOfferModel.find(query).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async findByAffiliateProgram(affiliateProgramId: string): Promise<AffiliateOffer[]> {
    if (!mongoose.isValidObjectId(affiliateProgramId)) return [];
    const docs = await AffiliateOfferModel.find({
      affiliateProgramId: new mongoose.Types.ObjectId(affiliateProgramId),
    })
      .lean()
      .exec();
    return docs.map((doc) => this.map(doc));
  }

  async findByIntent(intent: string, market: string): Promise<AffiliateOffer[]> {
    const docs = await AffiliateOfferModel.find({
      recommendationIntents: intent,
      market: market.toUpperCase().trim(),
      status: 'active',
    })
      .lean()
      .exec();
    return docs.map((doc) => this.map(doc));
  }

  async findByPlacement(placementKey: string, market: string): Promise<AffiliateOffer[]> {
    const docs = await AffiliateOfferModel.find({
      market: market.toUpperCase().trim(),
      status: 'active',
      $or: [{ placements: { $exists: false } }, { placements: { $size: 0 } }, { placements: placementKey }],
    })
      .lean()
      .exec();
    return docs.map((doc) => this.map(doc));
  }

  async findCandidates(filter: AffiliateOfferCandidateFilter): Promise<AffiliateOffer[]> {
    const query: Record<string, unknown> = {
      market: filter.market.toUpperCase().trim(),
      status: 'active',
    };
    if (filter.category) query.category = filter.category;
    if (filter.intents?.length) query.recommendationIntents = { $in: filter.intents };
    if (filter.merchantIds?.length) {
      query.merchantId = { $in: filter.merchantIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id)) };
    }
    Object.assign(query, validityMatch(filter.asOf || new Date()));

    const docs = await AffiliateOfferModel.find(query).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async findValidOffers(market: string, asOf: Date = new Date()): Promise<AffiliateOffer[]> {
    const query: Record<string, unknown> = {
      market: market.toUpperCase().trim(),
      status: 'active',
    };
    Object.assign(query, validityMatch(asOf));

    const docs = await AffiliateOfferModel.find(query).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async list(filter: AffiliateOfferAdminFilter = {}): Promise<AffiliateOffer[]> {
    const query: Record<string, unknown> = {};
    if (filter.merchantId && mongoose.isValidObjectId(filter.merchantId)) {
      query.merchantId = new mongoose.Types.ObjectId(filter.merchantId);
    }
    if (filter.affiliateProgramId && mongoose.isValidObjectId(filter.affiliateProgramId)) {
      query.affiliateProgramId = new mongoose.Types.ObjectId(filter.affiliateProgramId);
    }
    if (filter.market) query.market = filter.market.toUpperCase().trim();
    if (filter.status) query.status = filter.status;
    if (filter.category) query.category = filter.category;

    const docs = await AffiliateOfferModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(Math.max(0, Number(filter.skip || 0)))
      .limit(Math.max(0, Number(filter.limit || 200)))
      .lean()
      .exec();
    return docs.map((doc) => this.map(doc));
  }

  async upsertByMerchantProgramPlan(offer: AffiliateOfferUpsertInput): Promise<AffiliateOffer> {
    const now = new Date();
    const merchantId = new mongoose.Types.ObjectId(offer.merchantId);
    const affiliateProgramId = new mongoose.Types.ObjectId(offer.affiliateProgramId);
    const market = offer.market.toUpperCase().trim();

    const doc = await AffiliateOfferModel.findOneAndUpdate(
      { merchantId, affiliateProgramId, market, 'plan.id': offer.plan.id },
      {
        $set: {
          category: offer.category,
          plan: offer.plan,
          pricing: offer.pricing,
          features: offer.features,
          requirements: offer.requirements,
          trial: offer.trial,
          recommendationIntents: offer.recommendationIntents,
          placements: offer.placements,
          destination: offer.destination,
          validity: offer.validity,
          status: offer.status,
          verification: offer.verification,
          display: offer.display,
          updatedAt: offer.updatedAt || now,
        },
        $setOnInsert: {
          merchantId,
          affiliateProgramId,
          market,
          createdAt: offer.createdAt || now,
        },
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    return this.map(doc!);
  }

  async count(filter: AffiliateOfferAdminFilter = {}): Promise<number> {
    const query: Record<string, unknown> = {};
    if (filter.merchantId && mongoose.isValidObjectId(filter.merchantId)) {
      query.merchantId = new mongoose.Types.ObjectId(filter.merchantId);
    }
    if (filter.affiliateProgramId && mongoose.isValidObjectId(filter.affiliateProgramId)) {
      query.affiliateProgramId = new mongoose.Types.ObjectId(filter.affiliateProgramId);
    }
    if (filter.market) query.market = filter.market.toUpperCase().trim();
    if (filter.status) query.status = filter.status;
    if (filter.category) query.category = filter.category;
    return AffiliateOfferModel.countDocuments(query).exec();
  }

  async create(offer: AffiliateOfferUpsertInput): Promise<AffiliateOffer> {
    const now = new Date();
    const doc = await AffiliateOfferModel.create({
      ...offer,
      merchantId: new mongoose.Types.ObjectId(offer.merchantId),
      affiliateProgramId: new mongoose.Types.ObjectId(offer.affiliateProgramId),
      market: offer.market.toUpperCase().trim(),
      createdAt: offer.createdAt || now,
      updatedAt: offer.updatedAt || now,
    });
    return this.map(doc.toObject());
  }

  async updateById(id: string, patch: Partial<AffiliateOfferProps>): Promise<AffiliateOffer | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const update: Record<string, unknown> = { ...patch, updatedAt: new Date() };
    if (patch.merchantId) update.merchantId = new mongoose.Types.ObjectId(patch.merchantId);
    if (patch.affiliateProgramId) update.affiliateProgramId = new mongoose.Types.ObjectId(patch.affiliateProgramId);
    if (patch.market) update.market = patch.market.toUpperCase().trim();
    delete update.createdAt;

    const doc = await AffiliateOfferModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  private map(doc: IAffiliateOfferDocument & { _id: mongoose.Types.ObjectId }): AffiliateOffer {
    return {
      id: String(doc._id),
      merchantId: String(doc.merchantId),
      affiliateProgramId: String(doc.affiliateProgramId),
      market: doc.market,
      category: doc.category,
      plan: doc.plan,
      pricing: doc.pricing,
      features: doc.features || {},
      requirements: doc.requirements,
      trial: doc.trial,
      recommendationIntents: doc.recommendationIntents || [],
      placements: doc.placements,
      destination: doc.destination,
      validity: {
        validFrom: doc.validity?.validFrom ? new Date(doc.validity.validFrom) : undefined,
        validUntil: doc.validity?.validUntil ? new Date(doc.validity.validUntil) : undefined,
      },
      status: doc.status,
      verification: {
        source: doc.verification?.source,
        verifiedAt: doc.verification?.verifiedAt ? new Date(doc.verification.verifiedAt) : undefined,
        status: doc.verification?.status ?? 'needs_review',
      },
      display: doc.display,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
