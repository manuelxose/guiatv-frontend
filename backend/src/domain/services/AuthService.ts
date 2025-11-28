import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { logger } from '../../shared/utils/logger';

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
}

export interface AuthResult {
  user: SessionUser;
  token: string;
}

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
   */
  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleToken(idToken);
    const user = await this.userRepo.findOrCreateFromGoogle(googleUser);
    const token = this.signSessionToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token,
    };
  }

  /**
   * Validate JWT and return associated user.
   */
  async getSession(token: string): Promise<SessionUser> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      const userId = payload.sub as string;
      if (!userId) throw new UnauthorizedError('Invalid token payload');

      const user = await this.userRepo.findById(userId);
      if (!user) throw new UnauthorizedError('User not found');

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      };
    } catch (error) {
      logger.warn('Failed to validate session token', { error });
      throw new UnauthorizedError('Invalid or expired token');
    }
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
