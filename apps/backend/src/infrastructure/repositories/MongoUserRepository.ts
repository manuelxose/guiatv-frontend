import { UserModel } from '../database/models/User.model';
import { GoogleUser } from '../../domain/services/AuthService';
import { logger } from '../../shared/utils/logger';

export interface UserEntity {
  id: string;
  googleId?: string;
  email: string;
  name?: string;
  picture?: string;
  provider?: 'google' | 'local' | 'hybrid';
  passwordHash?: string;
  passwordSalt?: string;
  role?: 'admin' | 'editor' | 'user';
  status?: 'active' | 'suspended';
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MongoUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ email }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const doc = await UserModel.findOne({ googleId }).lean().exec();
    return doc ? this.map(doc) : null;
  }

  async findOrCreateFromGoogle(user: GoogleUser): Promise<UserEntity> {
    const normalizedEmail = user.email.toLowerCase();
    const existing = await UserModel.findOne({ googleId: user.id }).exec();
    if (existing) {
      existing.email = normalizedEmail;
      existing.name = user.name || existing.name;
      existing.picture = user.picture || existing.picture;
      existing.provider = existing.provider || 'google';
      existing.lastLoginAt = new Date();
      await existing.save();
      return this.map(existing.toObject());
    }

    const existingByEmail = await UserModel.findOne({ email: normalizedEmail }).exec();
    if (existingByEmail) {
      existingByEmail.googleId = user.id;
      existingByEmail.email = normalizedEmail;
      existingByEmail.name = user.name || existingByEmail.name;
      existingByEmail.picture = user.picture || existingByEmail.picture;
      existingByEmail.provider =
        existingByEmail.provider === 'local' ? 'hybrid' : 'google';
      existingByEmail.lastLoginAt = new Date();
      await existingByEmail.save();
      return this.map(existingByEmail.toObject());
    }

    const created = new UserModel({
      googleId: user.id,
      email: normalizedEmail,
      name: user.name,
      picture: user.picture,
      provider: 'google',
      lastLoginAt: new Date(),
      role: 'user',
      status: 'active',
    });

    await created.save();
    logger.info('User created from Google login', { email: user.email });
    return this.map(created.toObject());
  }

  async createLocalUser(input: {
    email: string;
    name?: string;
    passwordHash: string;
    passwordSalt: string;
  }): Promise<UserEntity> {
    const created = new UserModel({
      email: input.email,
      name: input.name,
      provider: 'local',
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt,
      lastLoginAt: new Date(),
      role: 'user',
      status: 'active',
    });

    await created.save();
    logger.info('User created from password signup', { email: input.email });
    return this.map(created.toObject());
  }

  async touchLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }).exec();
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    passwordSalt: string
  ): Promise<void> {
    const user = await UserModel.findById(id).exec();
    if (!user) return;

    user.passwordHash = passwordHash;
    user.passwordSalt = passwordSalt;
    if (user.provider === 'google') {
      user.provider = 'hybrid';
    } else if (!user.provider) {
      user.provider = 'local';
    }
    await user.save();
  }

  private map(doc: any): UserEntity {
    return {
      id: String(doc._id),
      googleId: doc.googleId as string | undefined,
      email: doc.email as string,
      name: doc.name as string | undefined,
      picture: doc.picture as string | undefined,
      provider: doc.provider as 'google' | 'local' | 'hybrid' | undefined,
      passwordHash: doc.passwordHash as string | undefined,
      passwordSalt: doc.passwordSalt as string | undefined,
      role: doc.role as 'admin' | 'editor' | 'user' | undefined,
      status: doc.status as 'active' | 'suspended' | undefined,
      lastLoginAt: doc.lastLoginAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
