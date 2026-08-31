import { timingSafeEqual } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../shared/errors';

function equalSecret(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const editorialReviewGuard = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const requiredKey = String(process.env.EDITORIAL_REVIEW_KEY || '').trim();
  if (!requiredKey) throw new ForbiddenError('Editorial review is not configured');

  const provided = String(req.header('x-editorial-review-key') || '').trim();
  if (!provided || !equalSecret(provided, requiredKey)) {
    throw new ForbiddenError('Invalid editorial review key');
  }
  next();
};
