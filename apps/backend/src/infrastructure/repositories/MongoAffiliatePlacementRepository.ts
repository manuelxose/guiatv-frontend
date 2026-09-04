import * as mongoose from 'mongoose';
import { AffiliatePlacement, AffiliatePlacementProps } from '@/domain/entities/AffiliatePlacement';
import {
  AffiliatePlacementUpsertInput,
  IAffiliatePlacementRepository,
} from '@/domain/repositories/IAffiliatePlacementRepository';
import { AffiliatePlacementModel, IAffiliatePlacementDocument } from '../database/models/AffiliatePlacement.model';

export class MongoAffiliatePlacementRepository implements IAffiliatePlacementRepository {
  async findByKey(key: string): Promise<AffiliatePlacement | null> {
    const normalized = key.toLowerCase().trim();
    const doc = await AffiliatePlacementModel.findOne({
      $or: [{ key: normalized }, { legacyKeys: normalized }],
    })
      .lean()
      .exec();
    return doc ? this.map(doc) : null;
  }

  async findById(id: string): Promise<AffiliatePlacement | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliatePlacementModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async listActive(): Promise<AffiliatePlacement[]> {
    const docs = await AffiliatePlacementModel.find({ enabled: true }).sort({ key: 1 }).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async list(): Promise<AffiliatePlacement[]> {
    const docs = await AffiliatePlacementModel.find({}).sort({ key: 1 }).lean().exec();
    return docs.map((doc) => this.map(doc));
  }

  async upsertByKey(placement: AffiliatePlacementUpsertInput): Promise<AffiliatePlacement> {
    const now = new Date();
    const key = placement.key.toLowerCase().trim();

    const doc = await AffiliatePlacementModel.findOneAndUpdate(
      { key },
      {
        $set: {
          page: placement.page,
          description: placement.description,
          enabled: placement.enabled,
          legacyKeys: placement.legacyKeys,
          updatedAt: placement.updatedAt || now,
        },
        $setOnInsert: {
          key,
          createdAt: placement.createdAt || now,
        },
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    return this.map(doc!);
  }

  async create(placement: AffiliatePlacementUpsertInput): Promise<AffiliatePlacement> {
    const now = new Date();
    const doc = await AffiliatePlacementModel.create({
      ...placement,
      key: placement.key.toLowerCase().trim(),
      createdAt: placement.createdAt || now,
      updatedAt: placement.updatedAt || now,
    });
    return this.map(doc.toObject());
  }

  async updateById(
    id: string,
    patch: Partial<Omit<AffiliatePlacementProps, 'key'>>
  ): Promise<AffiliatePlacement | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await AffiliatePlacementModel.findByIdAndUpdate(
      id,
      { $set: { ...patch, updatedAt: new Date() } },
      { new: true }
    )
      .lean()
      .exec();
    return doc ? this.map(doc) : null;
  }

  private map(doc: IAffiliatePlacementDocument & { _id: mongoose.Types.ObjectId }): AffiliatePlacement {
    return {
      id: String(doc._id),
      key: doc.key,
      page: doc.page,
      description: doc.description,
      enabled: doc.enabled,
      legacyKeys: doc.legacyKeys,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }
}
