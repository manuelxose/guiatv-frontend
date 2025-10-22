// src/v2/infrastructure/repositories/FirestoreChannelRepository.ts

import * as admin from 'firebase-admin';
import { Channel, ChannelType } from '../../domain/entities/Channel';
import {
  IChannelRepository,
  ChannelFilters,
} from '../../domain/repositories/IChannelRepository';
import { ChannelId } from '../../domain/value-objects/ChannelId';

export class FirestoreChannelRepository implements IChannelRepository {
  private readonly collection: FirebaseFirestore.CollectionReference;

  constructor(db: FirebaseFirestore.Firestore) {
    this.collection = db.collection('channels');
  }

  async findById(id: ChannelId): Promise<Channel | null> {
    const doc = await this.collection.doc(id.value).get();

    if (!doc.exists) {
      return null;
    }

    return this.mapToEntity(doc.id, doc.data()!);
  }

  async findAll(filters?: ChannelFilters): Promise<Channel[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filters?.type) {
      query = query.where('type', '==', filters.type);
    }
    if (filters?.region) {
      query = query.where('region', '==', filters.region);
    }
    if (filters?.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => this.mapToEntity(doc.id, doc.data()));
  }

  async findByNormalizedName(normalizedName: string): Promise<Channel | null> {
    const snapshot = await this.collection
      .where('normalizedName', '==', normalizedName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return this.mapToEntity(doc.id, doc.data());
  }

  async save(channel: Channel): Promise<void> {
    const data = {
      name: channel.name,
      normalizedName: channel.normalizedName,
      icon: channel.icon,
      type: channel.type,
      region: channel.region || null,
      isActive: channel.isActive,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await this.collection.doc(channel.id).set(data, { merge: true });
  }

  async delete(id: ChannelId): Promise<void> {
    await this.collection.doc(id.value).delete();
  }

  private mapToEntity(
    id: string,
    data: FirebaseFirestore.DocumentData
  ): Channel {
    return Channel.create({
      id,
      name: data.name,
      icon: data.icon,
      type: data.type as ChannelType,
      region: data.region,
      isActive: data.isActive ?? true,
    });
  }
}
