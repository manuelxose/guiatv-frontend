import { OAuth2Client, TokenPayload } from 'google-auth-library';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { promisify } from 'util';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  ValidationErrorDetail,
} from '../../shared/errors';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { logger } from '../../shared/utils/logger';
import { AuthSessionModel } from '../../infrastructure/database/models/AuthSession.model';
import { PasswordResetTokenModel } from '../../infrastructure/database/models/PasswordResetToken.model';

const scryptAsync = promisify(crypto.scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const PASSWORD_MIN_LENGTH = 8;

export interface GoogleUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role?: 'admin' | 'editor' | 'user';
  subscription?: 'free' | 'premium';
}

export interface AuthSessionView {
  id: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
  current?: boolean;
}

export interface AuthResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: AuthSessionView;
}

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
}

interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
  role?: 'admin' | 'editor' | 'user';
  sid: string;
  typ: 'access';
}

interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
  sid: string;
  typ: 'refresh';
}

/**
 * Handles authentication concerns such as provider login, JWT issuance and session lifecycle.
 */
export class AuthService {
  private googleClient?: OAuth2Client;
  private accessTokenTtl = process.env.ACCESS_TOKEN_TTL || '15m';
  private refreshTokenTtl = process.env.REFRESH_TOKEN_TTL || '30d';
  private refreshSecret = process.env.JWT_REFRESH_SECRET || this.jwtSecret;

  constructor(
    private googleClientId: string | undefined,
    private jwtSecret: string,
    private userRepo: MongoUserRepository
  ) {
    if (googleClientId) {
      this.googleClient = new OAuth2Client(googleClientId);
    }
  }

  async loginWithGoogle(idToken: string, ctx: SessionContext = {}): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleToken(idToken);
    const user = await this.userRepo.findOrCreateFromGoogle(googleUser);
    if (user.status === 'suspended') {
      throw new ForbiddenError('User is suspended');
    }
    return this.issueSession(user, ctx);
  }

  async registerWithPassword(
    input: { email: string; password: string; name?: string },
    ctx: SessionContext = {}
  ): Promise<AuthResult> {
    const { email, password, name } = input;
    const normalizedEmail = this.normalizeEmail(email);
    const trimmedName = name ? name.trim() : '';
    const details: ValidationErrorDetail[] = [];

    if (!normalizedEmail) {
      details.push({ field: 'email', message: 'Email is required', value: email });
    } else if (!this.isValidEmail(normalizedEmail)) {
      details.push({ field: 'email', message: 'Email is invalid', value: email });
    }

    if (!password) {
      details.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      details.push({
        field: 'password',
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }

    if (trimmedName && trimmedName.length < 2) {
      details.push({ field: 'name', message: 'Name is too short', value: name });
    }

    if (details.length) {
      throw new ValidationError('Invalid registration payload', details);
    }

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const { salt, hash } = await this.createPasswordHash(password);
    const displayName = trimmedName || normalizedEmail.split('@')[0];
    const user = await this.userRepo.createLocalUser({
      email: normalizedEmail,
      name: displayName,
      passwordHash: hash,
      passwordSalt: salt,
    });

    return this.issueSession(user, ctx);
  }

  async loginWithPassword(
    input: { email: string; password: string },
    ctx: SessionContext = {}
  ): Promise<AuthResult> {
    const { email, password } = input;
    const normalizedEmail = this.normalizeEmail(email);
    const details: ValidationErrorDetail[] = [];

    if (!normalizedEmail) {
      details.push({ field: 'email', message: 'Email is required', value: email });
    }

    if (!password) {
      details.push({ field: 'password', message: 'Password is required' });
    }

    if (details.length) {
      throw new ValidationError('Invalid login payload', details);
    }

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user || !user.passwordHash || !user.passwordSalt) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await this.verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status === 'suspended') {
      throw new ForbiddenError('User is suspended');
    }

    await this.userRepo.touchLastLogin(user.id);
    return this.issueSession(user, ctx);
  }

  async refreshSession(refreshToken: string, ctx: SessionContext = {}): Promise<AuthResult> {
    const payload = this.verifyRefreshToken(refreshToken);

    const session = await AuthSessionModel.findOne({
      _id: payload.sid,
      userId: payload.sub,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();
    if (!session) {
      throw new UnauthorizedError('Session expired');
    }

    if (session.refreshTokenHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    if (user.status === 'suspended') {
      throw new ForbiddenError('User is suspended');
    }

    const nextRefreshToken = this.signRefreshToken(user.id, String(session._id));
    session.refreshTokenHash = this.hashToken(nextRefreshToken);
    session.lastUsedAt = new Date();
    session.userAgent = ctx.userAgent || session.userAgent;
    session.ipAddress = ctx.ipAddress || session.ipAddress;
    session.deviceName = ctx.deviceName || session.deviceName;
    await session.save();

    const accessToken = this.signAccessToken(
      user.id,
      user.email,
      user.role || 'user',
      String(session._id)
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: this.toExpiresInSeconds(this.accessTokenTtl, 900),
      session: {
        id: String(session._id),
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt?.toISOString(),
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        deviceName: session.deviceName,
      },
    };
  }

  async getSession(token: string): Promise<SessionUser> {
    try {
      const payload = this.verifyAccessToken(token);
      const user = await this.userRepo.findById(payload.sub);
      if (!user) throw new UnauthorizedError('User not found');
      if (user.status === 'suspended') {
        throw new ForbiddenError('User is suspended');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        subscription: (user as any).subscription || 'free',
      };
    } catch (error) {
      logger.warn('Failed to validate session token', { error });
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  getAccessTokenPayload(token: string): AccessTokenPayload {
    return this.verifyAccessToken(token);
  }

  async getSessionsForUser(userId: string, currentSessionId?: string): Promise<AuthSessionView[]> {
    const sessions = await AuthSessionModel.find({
      userId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .lean()
      .exec();

    return sessions.map((session) => ({
      id: String(session._id),
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt?.toISOString(),
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      deviceName: session.deviceName,
      current: currentSessionId ? String(session._id) === currentSessionId : false,
    }));
  }

  async revokeSessionById(userId: string, sessionId: string): Promise<void> {
    await AuthSessionModel.updateOne(
      { _id: sessionId, userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }

  async revokeSessionByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      await AuthSessionModel.updateOne(
        { _id: payload.sid, userId: payload.sub, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      ).exec();
    } catch {
      // noop to keep logout idempotent
    }
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const query: Record<string, unknown> = { userId, revokedAt: { $exists: false } };
    if (exceptSessionId) {
      query._id = { $ne: exceptSessionId };
    }
    await AuthSessionModel.updateMany(query, { $set: { revokedAt: new Date() } }).exec();
  }

  async requestPasswordReset(email: string, resetBaseUrl?: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new ValidationError('email is required', [
        { field: 'email', message: 'Email is required', value: email },
      ]);
    }

    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetTokenModel.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const baseUrl =
      resetBaseUrl ||
      process.env.PASSWORD_RESET_URL ||
      process.env.APP_PUBLIC_URL ||
      'http://localhost:3000/auth/reset-password';
    const separator = baseUrl.includes('?') ? '&' : '?';
    const resetLink = `${baseUrl}${separator}token=${encodeURIComponent(rawToken)}`;

    await this.sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token) {
      throw new ValidationError('token is required', [
        { field: 'token', message: 'Token is required' },
      ]);
    }
    if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError('password is invalid', [
        {
          field: 'password',
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        },
      ]);
    }

    const tokenHash = this.hashToken(token);
    const resetToken = await PasswordResetTokenModel.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();
    if (!resetToken) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const user = await this.userRepo.findById(String(resetToken.userId));
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const { salt, hash } = await this.createPasswordHash(newPassword);
    await this.userRepo.updatePassword(user.id, hash, salt);
    await this.revokeAllSessions(user.id);

    resetToken.usedAt = new Date();
    await resetToken.save();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!currentPassword) {
      throw new ValidationError('current password is required', [
        { field: 'currentPassword', message: 'Current password is required' },
      ]);
    }
    if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError('new password is invalid', [
        {
          field: 'newPassword',
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        },
      ]);
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    if (!user.passwordHash || !user.passwordSalt) {
      throw new ValidationError('password login not configured', [
        { field: 'currentPassword', message: 'This account does not have a password set. Use forgot-password instead.' },
      ]);
    }

    const valid = await this.verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const { salt, hash } = await this.createPasswordHash(newPassword);
    await this.userRepo.updatePassword(userId, hash, salt);
  }

  private async issueSession(user: any, ctx: SessionContext): Promise<AuthResult> {
    const sessionObjectId = new mongoose.Types.ObjectId();
    const sessionId = String(sessionObjectId);
    const refreshToken = this.signRefreshToken(user.id, sessionId);
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = this.buildExpiryDate(this.refreshTokenTtl, 30 * 24 * 60 * 60 * 1000);

    const session = await AuthSessionModel.create({
      _id: sessionObjectId,
      userId: user.id,
      refreshTokenHash,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
      deviceName: ctx.deviceName,
      lastUsedAt: new Date(),
      expiresAt,
    });

    const accessToken = this.signAccessToken(
      user.id,
      user.email,
      user.role || 'user',
      String(session._id)
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: this.toExpiresInSeconds(this.accessTokenTtl, 900),
      session: {
        id: String(session._id),
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt?.toISOString(),
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        deviceName: session.deviceName,
      },
    };
  }

  private verifyAccessToken(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
    if (payload.typ !== 'access' || !payload.sub || !payload.sid) {
      throw new UnauthorizedError('Invalid access token');
    }
    return payload;
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = jwt.verify(token, this.refreshSecret) as RefreshTokenPayload;
    if (payload.typ !== 'refresh' || !payload.sub || !payload.sid) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    return payload;
  }

  private signAccessToken(
    userId: string,
    email: string,
    role: 'admin' | 'editor' | 'user',
    sessionId: string
  ): string {
    return jwt.sign(
      {
        sub: userId,
        email,
        role,
        sid: sessionId,
        typ: 'access',
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenTtl as jwt.SignOptions['expiresIn'] }
    );
  }

  private signRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      {
        sub: userId,
        sid: sessionId,
        typ: 'refresh',
      },
      this.refreshSecret,
      { expiresIn: this.refreshTokenTtl as jwt.SignOptions['expiresIn'] }
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private buildExpiryDate(value: string, fallbackMs: number): Date {
    const seconds = this.toExpiresInSeconds(value, Math.floor(fallbackMs / 1000));
    return new Date(Date.now() + seconds * 1000);
  }

  private toExpiresInSeconds(value: string, fallback: number): number {
    const lower = String(value || '').trim().toLowerCase();
    const parsedInt = Number(lower);
    if (Number.isFinite(parsedInt) && parsedInt > 0) {
      return Math.floor(parsedInt);
    }

    const match = /^(\d+)([smhd])$/.exec(lower);
    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(amount) || amount <= 0) {
      return fallback;
    }

    if (unit === 's') return amount;
    if (unit === 'm') return amount * 60;
    if (unit === 'h') return amount * 60 * 60;
    if (unit === 'd') return amount * 24 * 60 * 60;
    return fallback;
  }

  private async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'no-reply@guiatv.local';

    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.warn('SMTP credentials are missing, logging reset link', {
        to,
        resetLink,
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: 'Recuperación de contraseña - GuiaTV',
      text: `Has solicitado restablecer tu contraseña.\n\nAbre este enlace: ${resetLink}\n\nSi no lo pediste, ignora este mensaje.`,
      html: `<p>Has solicitado restablecer tu contraseña.</p><p><a href="${resetLink}">Restablecer contraseña</a></p><p>Si no lo pediste, ignora este mensaje.</p>`,
    });
  }

  private async verifyGoogleToken(idToken: string): Promise<GoogleUser> {
    if (!this.googleClient || !this.googleClientId) {
      throw new UnauthorizedError('Google client ID is not configured');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });

      const payload: TokenPayload | undefined = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedError('Invalid Google token payload');
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || undefined,
        picture: payload.picture || undefined,
      };
    } catch (error) {
      logger.warn('Google token verification failed', { error });
      throw new UnauthorizedError(
        error instanceof Error ? error.message : 'Invalid Google token'
      );
    }
  }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async createPasswordHash(password: string): Promise<{ salt: string; hash: string }> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await this.hashPassword(password, salt);
    return { salt, hash };
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    return derived.toString('hex');
  }

  private async verifyPassword(
    password: string,
    salt: string,
    expectedHash: string
  ): Promise<boolean> {
    if (!expectedHash) return false;
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHash, 'hex');
    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
  }

  async verifyPasswordForUser(userId: string, password: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user || !user.passwordHash || !user.passwordSalt) return false;
    return this.verifyPassword(password, user.passwordSalt, user.passwordHash);
  }
}
