import * as mongoose from 'mongoose';
import { AffiliateProgram, AffiliateProgramProps } from '@/domain/entities/AffiliateProgram';
import {
  AffiliateProgramFilter,
  AffiliateProgramUpsertInput,
  IAffiliateProgramRepository,
} from '@/domain/repositories/IAffiliateProgramRepository';
import { AffiliateProgramModel, IAffiliateProgramDocument } from '../database/models/AffiliateProgram.model';

export class MongoAffiliateProgramRepository implements IAffiliateProgramRepository {
  async findById(id: string): Promise<AffiliateProgram | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliateProgramModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findActiveForMerchant(merchantId: string, market: string): Promise<AffiliateProgram[]> {
    if (!mongoose.isValidObjectId(merchantId)) return [];
    const docs = await AffiliateProgramModel.find({
      merchantId: new mongoose.Types.ObjectId(merchantId),
      market: market.toUpperCase().trim(),
      status: 'active',
    })
      .lean()
      .exec();
    return docs.map((doc) => this.map(doc));
  }

  async list(filter: AffiliateProgramFilter = {}): Promise<AffiliateProgram[]> {
    const query: Record<string, unknown> = {};
    if (filter.merchantId && mongoose.isValidObjectId(filter.merchantId)) {
      query.merchantId = new mongoose.Types.ObjectId(filter.merchantId);
    }
    if (filter.networkId && mongoose.isValidObjectId(filter.networkId)) {
      query.networkId = new mongoose.Types.ObjectId(filter.networkId);
    }
    if (filter.market) query.market = filter.market.toUpperCase().trim();
    if (filter.status) query.status = filter.status;
    if (filter.externalProgramId) query.externalProgramId = filter.externalProgramId;

    const docs = await AffiliateProgramModel.find(query).sort({ updatedAt: -1 }).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async upsertByMerchantNetworkMarket(program: AffiliateProgramUpsertInput): Promise<AffiliateProgram> {
    const now = new Date();
    const merchantId = new mongoose.Types.ObjectId(program.merchantId);
    const networkId = new mongoose.Types.ObjectId(program.networkId);
    const market = program.market.toUpperCase().trim();

    const doc = await AffiliateProgramModel.findOneAndUpdate(
      { merchantId, networkId, market },
      {
        $set: {
          externalProgramId: program.externalProgramId,
          relationship: program.relationship,
          status: program.status,
          allowedHosts: program.allowedHosts,
          disclosure: program.disclosure,
          commission: program.commission,
          attribution: program.attribution,
          verification: program.verification,
          updatedAt: program.updatedAt || now,
        },
        $setOnInsert: {
          merchantId,
          networkId,
          market,
          createdAt: program.createdAt || now,
        },
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    return this.map(doc!);
  }

  async create(program: AffiliateProgramUpsertInput): Promise<AffiliateProgram> {
    const now = new Date();
    const doc = await AffiliateProgramModel.create({
      ...program,
      merchantId: new mongoose.Types.ObjectId(program.merchantId),
      networkId: new mongoose.Types.ObjectId(program.networkId),
      market: program.market.toUpperCase().trim(),
      createdAt: program.createdAt || now,
      updatedAt: program.updatedAt || now,
    });
    return this.map(doc.toObject());
  }

  async updateById(id: string, patch: Partial<AffiliateProgramProps>): Promise<AffiliateProgram | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const update: Record<string, unknown> = { ...patch, updatedAt: new Date() };
    if (patch.merchantId) update.merchantId = new mongoose.Types.ObjectId(patch.merchantId);
    if (patch.networkId) update.networkId = new mongoose.Types.ObjectId(patch.networkId);
    if (patch.market) update.market = patch.market.toUpperCase().trim();
    delete update.createdAt;

    const doc = await AffiliateProgramModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  private map(doc: IAffiliateProgramDocument & { _id: mongoose.Types.ObjectId }): AffiliateProgram {
    return {
      id: String(doc._id),
      merchantId: String(doc.merchantId),
      networkId: String(doc.networkId),
      market: doc.market,
      externalProgramId: doc.externalProgramId,
      relationship: doc.relationship,
      status: doc.status,
      allowedHosts: doc.allowedHosts || [],
      disclosure: doc.disclosure,
      commission: doc.commission,
      attribution: doc.attribution,
      verification: {
        source: doc.verification?.source,
        verifiedAt: doc.verification?.verifiedAt ? new Date(doc.verification.verifiedAt) : undefined,
        status: doc.verification?.status ?? 'pending',
      },
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
