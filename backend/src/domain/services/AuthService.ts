import { OAuth2Client, TokenPayload } from 'google-auth-library';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
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

const scryptAsync = promisify(crypto.scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const PASSWORD_MIN_LENGTH = 8;

/**
 * Minimal user info provided by Google after verifying an idToken.
 */
export interface GoogleUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Shape of the authenticated user stored in JWT sessions.
 */
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role?: 'admin' | 'editor' | 'user';
}

/**
 * Response issued after a successful authentication flow.
 */
export interface AuthResult {
  user: SessionUser;
  token: string;
}

/**
 * Handles authentication concerns such as Google login and JWT issuance.
 */
export class AuthService {
  private googleClient?: OAuth2Client;

  constructor(
    private googleClientId: string | undefined,
    private jwtSecret: string,
    private userRepo: MongoUserRepository
  ) {
    if (googleClientId) {
      this.googleClient = new OAuth2Client(googleClientId);
    }
  }

  /**
   * Exchange Google idToken for an app session.
   * - Verifies Google token
   * - Upserts user in Mongo
   * - Issues JWT signed with backend secret
   *
   * @param idToken - Google identity token from the client.
   */
  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleToken(idToken);
    const user = await this.userRepo.findOrCreateFromGoogle(googleUser);
    if (user.status === 'suspended') {
      throw new ForbiddenError('User is suspended');
    }
    const token = this.signSessionToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Register a local user with email and password.
   */
  async registerWithPassword(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<AuthResult> {
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

    const token = this.signSessionToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login with email and password.
   */
  async loginWithPassword(input: { email: string; password: string }): Promise<AuthResult> {
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

    const token = this.signSessionToken(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Validate JWT and return associated user.
   *
   * @param token - Signed JWT issued by this service.
   */
  async getSession(token: string): Promise<SessionUser> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      const userId = payload.sub as string;
      if (!userId) throw new UnauthorizedError('Invalid token payload');

      const user = await this.userRepo.findById(userId);
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
      };
    } catch (error) {
      logger.warn('Failed to validate session token', { error });
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Validates the Google token and extracts the user profile.
   */
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

  /**
   * Signs a short-lived JWT for API consumption.
   */
  private signSessionToken(userId: string, email: string): string {
    const expiresIn = '7d';
    return jwt.sign(
      {
        sub: userId,
        email,
      },
      this.jwtSecret,
      { expiresIn }
    );
  }
}
