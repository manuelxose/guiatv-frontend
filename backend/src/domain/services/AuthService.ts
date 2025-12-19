import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { logger } from '../../shared/utils/logger';

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
