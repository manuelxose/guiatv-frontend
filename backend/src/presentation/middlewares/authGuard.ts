import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../domain/services/AuthService';
import { UnauthorizedError } from '../../shared/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

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

export const createAuthGuard =
  (authService: AuthService) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new UnauthorizedError('Authorization token missing');
      }
      const user = await authService.getSession(token);
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
