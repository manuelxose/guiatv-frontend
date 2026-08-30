import * as mongoose from 'mongoose';
import { AffiliateMerchant, AffiliateMerchantProps } from '@/domain/entities/AffiliateMerchant';
import {
  AffiliateMerchantFilter,
  AffiliateMerchantUpsertInput,
  IAffiliateMerchantRepository,
} from '@/domain/repositories/IAffiliateMerchantRepository';
import { AffiliateMerchantModel, IAffiliateMerchantDocument } from '../database/models/AffiliateMerchant.model';
import { normalizeAffiliateText } from '@/shared/utils/affiliateText';

export class MongoAffiliateMerchantRepository implements IAffiliateMerchantRepository {
  async findById(id: string): Promise<AffiliateMerchant | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliateMerchantModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findBySlug(slug: string): Promise<AffiliateMerchant | null> {
    const doc = await AffiliateMerchantModel.findOne({ slug: slug.toLowerCase().trim() }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findByCanonicalProviderKey(canonicalProviderKey: string): Promise<AffiliateMerchant | null> {
    const doc = await AffiliateMerchantModel.findOne({
      canonicalProviderKey: canonicalProviderKey.trim(),
    })
      .lean()
      .exec();
    return doc ? this.map(doc) : null;
  }

  async findByAlias(text: string): Promise<AffiliateMerchant | null> {
    const normalized = normalizeAffiliateText(text);
    if (!normalized) return null;

    // Exact slug/canonical-key match first (cheap, index-backed), then alias match.
    const bySlug = await AffiliateMerchantModel.findOne({
      $or: [{ slug: normalized.replace(/\s+/g, '-') }, { canonicalProviderKey: normalized.replace(/\s+/g, '-') }],
    })
      .lean()
      .exec();
    if (bySlug) return this.map(bySlug);

    const byAlias = await AffiliateMerchantModel.findOne({ aliases: normalized }).lean().exec();
    return byAlias ? this.map(byAlias) : null;
  }

  async list(filter: AffiliateMerchantFilter = {}): Promise<AffiliateMerchant[]> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.category) query.category = filter.category;
    if (filter.market) query.markets = filter.market;

    const docs = await AffiliateMerchantModel.find(query).sort({ name: 1 }).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async upsertBySlug(merchant: AffiliateMerchantUpsertInput): Promise<AffiliateMerchant> {
    const now = new Date();
    const slug = merchant.slug.toLowerCase().trim();
    const normalizedAliases = Array.from(
      new Set((merchant.aliases || []).map((alias) => normalizeAffiliateText(alias)).filter(Boolean))
    );

    const doc = await AffiliateMerchantModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          canonicalProviderKey: merchant.canonicalProviderKey,
          name: merchant.name,
          aliases: normalizedAliases,
          logo: merchant.logo,
          category: merchant.category,
          officialUrl: merchant.officialUrl,
          markets: merchant.markets,
          status: merchant.status,
          updatedAt: merchant.updatedAt || now,
        },
        $setOnInsert: {
          slug,
          createdAt: merchant.createdAt || now,
        },
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    return this.map(doc!);
  }

  async create(merchant: AffiliateMerchantUpsertInput): Promise<AffiliateMerchant> {
    const now = new Date();
    const normalizedAliases = Array.from(
      new Set((merchant.aliases || []).map((alias) => normalizeAffiliateText(alias)).filter(Boolean))
    );
    const doc = await AffiliateMerchantModel.create({
      ...merchant,
      slug: merchant.slug.toLowerCase().trim(),
      aliases: normalizedAliases,
      createdAt: merchant.createdAt || now,
      updatedAt: merchant.updatedAt || now,
    });
    return this.map(doc.toObject());
  }

  async updateById(
    id: string,
    patch: Partial<Omit<AffiliateMerchantProps, 'slug'>>
  ): Promise<AffiliateMerchant | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const update: Record<string, unknown> = { ...patch, updatedAt: new Date() };
    if (patch.aliases) {
      update.aliases = Array.from(new Set(patch.aliases.map((alias) => normalizeAffiliateText(alias)).filter(Boolean)));
    }
    const doc = await AffiliateMerchantModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  private map(doc: IAffiliateMerchantDocument & { _id: mongoose.Types.ObjectId }): AffiliateMerchant {
    return {
      id: String(doc._id),
      slug: doc.slug,
      canonicalProviderKey: doc.canonicalProviderKey,
      name: doc.name,
      aliases: doc.aliases || [],
      logo: doc.logo,
      category: doc.category,
      officialUrl: doc.officialUrl,
      markets: doc.markets || [],
      status: doc.status,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
