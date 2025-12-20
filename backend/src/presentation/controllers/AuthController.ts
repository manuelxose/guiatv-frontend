import { Request, Response } from 'express';
import { AuthService } from '../../domain/services/AuthService';
import { BadRequestError, UnauthorizedError } from '../../shared/errors';

/**
 * HTTP controller for authentication endpoints.
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /v2/auth/google
   * Body: { idToken: string }
   *
   * Exchanges a Google token for an application session.
   */
  async loginWithGoogle(req: Request, res: Response): Promise<void> {
    const idToken = req.body?.idToken;
    if (!idToken) {
      throw new BadRequestError('idToken is required');
    }

    const result = await this.authService.loginWithGoogle(idToken);
    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /v2/auth/login
   * Body: { email: string, password: string }
   */
  async loginWithPassword(req: Request, res: Response): Promise<void> {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password =
      typeof req.body?.password === 'string' ? req.body.password : '';

    const result = await this.authService.loginWithPassword({
      email,
      password,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /v2/auth/register
   * Body: { name?: string, email: string, password: string }
   */
  async registerWithPassword(req: Request, res: Response): Promise<void> {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const password =
      typeof req.body?.password === 'string' ? req.body.password : '';
    const name = typeof req.body?.name === 'string' ? req.body.name : undefined;

    const result = await this.authService.registerWithPassword({
      email,
      password,
      name,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * GET /v2/auth/me
   * Header: Authorization: Bearer <jwt>
   *
   * Returns the user associated with the provided JWT.
   */
  async me(req: Request, res: Response): Promise<void> {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('Authorization token missing');
    }

    const user = await this.authService.getSession(token);
    res.json({
      success: true,
      data: user,
    });
  }

  /**
   * POST /v2/auth/logout
   * Client can simply discard token; endpoint provided for completeness.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.json({ success: true });
  }
}

/**
 * Extracts a bearer token from header, query or body.
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.query?.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  if (req.body?.token) {
    return req.body.token;
  }
  return null;
}
