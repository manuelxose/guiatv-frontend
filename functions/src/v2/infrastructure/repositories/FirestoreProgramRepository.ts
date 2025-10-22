// src/v2/infrastructure/repositories/FirestoreProgramRepository.ts

import * as admin from 'firebase-admin';
import { Program } from '../../domain/entities/Program';
import {
  IProgramRepository,
  ProgramFilters,
} from '../../domain/repositories/IProgramRepository';
import { ChannelId } from '../../domain/value-objects/ChannelId';
import { DateRange } from '../../domain/value-objects/DateRange';

export class FirestoreProgramRepository implements IProgramRepository {
  private readonly collection: FirebaseFirestore.CollectionReference;

  constructor(private readonly db: FirebaseFirestore.Firestore) {
    this.collection = db.collection('programs');
  }

  async findById(id: string): Promise<Program | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return this.mapToEntity(doc.id, doc.data()!);
  }

  async findByChannel(
    channelId: ChannelId,
    dateRange: DateRange
  ): Promise<Program[]> {
    const snapshot = await this.collection
      .where('channelId', '==', channelId.value)
      .where('date', '==', dateRange.toString())
      .orderBy('startTime', 'asc')
      .get();

    return snapshot.docs.map((doc) => this.mapToEntity(doc.id, doc.data()));
  }

  async findByDateRange(
    dateRange: DateRange,
    filters?: ProgramFilters
  ): Promise<Program[]> {
    let query: FirebaseFirestore.Query = this.collection.where(
      'date',
      '==',
      dateRange.toString()
    );

    if (filters?.channelId) {
      query = query.where('channelId', '==', filters.channelId);
    }

    if (filters?.genre) {
      query = query.where('genre', '==', filters.genre);
    }

    query = query.orderBy('startTime', 'asc');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => this.mapToEntity(doc.id, doc.data()));
  }

  async save(program: Program): Promise<void> {
    const data = this.mapToFirestore(program);
    await this.collection.doc(program.id).set(data, { merge: true });
  }

  async saveBatch(programs: Program[]): Promise<void> {
    const batch = this.db.batch();

    programs.forEach((program) => {
      const ref = this.collection.doc(program.id);
      const data = this.mapToFirestore(program);
      batch.set(ref, data, { merge: true });
    });

    await batch.commit();
  }

  async deleteByDateRange(dateRange: DateRange): Promise<void> {
    const snapshot = await this.collection
      .where('date', '==', dateRange.toString())
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
  }

  private mapToEntity(
    id: string,
    data: FirebaseFirestore.DocumentData
  ): Program {
    return Program.create({
      id,
      channelId: data.channelId,
      title: data.title,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      description: data.description,
      image: data.image,
      genre: data.genre,
      subgenre: data.subgenre,
      year: data.year,
      rating: data.rating,
      details: data.details,
    });
  }

  private mapToFirestore(program: Program): any {
    return {
      channelId: program.channelId,
      date: program.date,
      title: program.title,
      startTime: admin.firestore.Timestamp.fromDate(program.startTime),
      endTime: admin.firestore.Timestamp.fromDate(program.endTime),
      description: program.description || null,
      image: program.image || null,
      genre: program.genre || null,
      duration: program.duration,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }
}
