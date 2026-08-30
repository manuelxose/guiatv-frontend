import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../shared/errors';

export const analyticsAdminGuard = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const requiredKey = process.env.ANALYTICS_ADMIN_KEY;
  if (!requiredKey) {
    throw new ForbiddenError('Admin key is not configured');
  }

  const headerKey = req.header('x-admin-key');
  const bearer = req.header('authorization');
  const bearerKey = bearer?.toLowerCase().startsWith('bearer ')
    ? bearer.slice(7)
    : undefined;
  const provided = headerKey || bearerKey;

  if (!provided || provided !== requiredKey) {
    throw new ForbiddenError('Invalid admin key');
  }

  next();
};
