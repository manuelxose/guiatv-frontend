import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../domain/services/AuthService';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';
import { AuthenticatedRequest } from './authGuard';

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export const createAdminAccessGuard =
  (authService: AuthService) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const requiredKey = process.env.ANALYTICS_ADMIN_KEY;
      const headerKey = req.header('x-admin-key');
      const authHeader = req.header('authorization') || '';
      const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7)
        : undefined;

      if (
        requiredKey &&
        (headerKey === requiredKey || bearerToken === requiredKey)
      ) {
        next();
        return;
      }

      const token = extractToken(req);
      if (!token) {
        throw new UnauthorizedError('Authorization token missing');
      }

      const user = await authService.getSession(token);
      (req as AuthenticatedRequest).user = user;

      if (user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
