import * as mongoose from 'mongoose';
import { AffiliateNetwork, AffiliateNetworkProps } from '@/domain/entities/AffiliateNetwork';
import {
  AffiliateNetworkFilter,
  AffiliateNetworkUpsertInput,
  IAffiliateNetworkRepository,
} from '@/domain/repositories/IAffiliateNetworkRepository';
import { AffiliateNetworkModel, IAffiliateNetworkDocument } from '../database/models/AffiliateNetwork.model';

export class MongoAffiliateNetworkRepository implements IAffiliateNetworkRepository {
  async findById(id: string): Promise<AffiliateNetwork | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliateNetworkModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findBySlug(slug: string): Promise<AffiliateNetwork | null> {
    const doc = await AffiliateNetworkModel.findOne({ slug: slug.toLowerCase().trim() }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async list(filter: AffiliateNetworkFilter = {}): Promise<AffiliateNetwork[]> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.market) query.markets = filter.market;

    const docs = await AffiliateNetworkModel.find(query).sort({ name: 1 }).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async upsertBySlug(network: AffiliateNetworkUpsertInput): Promise<AffiliateNetwork> {
    const now = new Date();
    const doc = await AffiliateNetworkModel.findOneAndUpdate(
      { slug: network.slug.toLowerCase().trim() },
      {
        $set: {
          name: network.name,
          trackingType: network.trackingType,
          markets: network.markets,
          status: network.status,
          metadata: network.metadata,
          updatedAt: network.updatedAt || now,
        },
        $setOnInsert: {
          slug: network.slug.toLowerCase().trim(),
          createdAt: network.createdAt || now,
        },
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    return this.map(doc!);
  }

  async create(network: AffiliateNetworkUpsertInput): Promise<AffiliateNetwork> {
    const now = new Date();
    const doc = await AffiliateNetworkModel.create({
      ...network,
      slug: network.slug.toLowerCase().trim(),
      createdAt: network.createdAt || now,
      updatedAt: network.updatedAt || now,
    });
    return this.map(doc.toObject());
  }

  async updateById(
    id: string,
    patch: Partial<Omit<AffiliateNetworkProps, 'slug'>>
  ): Promise<AffiliateNetwork | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliateNetworkModel.findByIdAndUpdate(
      id,
      { $set: { ...patch, updatedAt: new Date() } },
      { new: true }
    )
      .lean()
      .exec();
    return doc ? this.map(doc) : null;
  }

  private map(doc: IAffiliateNetworkDocument & { _id: mongoose.Types.ObjectId }): AffiliateNetwork {
    return {
      id: String(doc._id),
      slug: doc.slug,
      name: doc.name,
      trackingType: doc.trackingType,
      markets: doc.markets || [],
      status: doc.status,
      metadata: doc.metadata,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
