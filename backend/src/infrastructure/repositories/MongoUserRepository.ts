import { UserModel } from '../database/models/User.model';
import { GoogleUser } from '../../domain/services/AuthService';
import { logger } from '../../shared/utils/logger';

export interface UserEntity {
  id: string;
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MongoUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ googleId }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findOrCreateFromGoogle(user: GoogleUser): Promise<UserEntity> {
    const existing = await UserModel.findOne({ googleId: user.id }).exec();
    if (existing) {
      existing.email = user.email;
      existing.name = user.name || existing.name;
      existing.picture = user.picture || existing.picture;
      existing.lastLoginAt = new Date();
      await existing.save();
      return this.map(existing.toObject());
    }

    const created = new UserModel({
      googleId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
      lastLoginAt: new Date(),
    });

    await created.save();
    logger.info('User created from Google login', { email: user.email });
    return this.map(created.toObject());
  }

  private map(doc: any): UserEntity {
    return {
      id: String(doc._id),
      googleId: doc.googleId as string,
      email: doc.email as string,
      name: doc.name as string | undefined,
      picture: doc.picture as string | undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
