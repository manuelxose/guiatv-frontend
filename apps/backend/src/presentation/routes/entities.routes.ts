import { Router } from 'express';
import { PublicContentEntityService } from '@/application/services/PublicContentEntityService';
import { ContentIdentityService } from '@/application/services/ContentIdentityService';
import { MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { errorResponse, successResponse } from '@/shared/types/ApiResponse';
import { Logger } from '@/shared/utils/logger';
import { createRateLimiter } from '../middlewares/rateLimit';

const logger = new Logger('PublicContentEntity');

export function createEntityRoutes(service = new PublicContentEntityService(new ContentIdentityService(
  new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository()
))): Router {
  const router = Router();
  router.use((_req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, follow' });
    if (process.env.CONTENT_ENTITY_PUBLIC_READ_ENABLED !== 'true') {
      res.status(404).json(errorResponse('ENTITY_PUBLIC_READ_DISABLED', 'Entity reads are disabled'));
      return;
    }
    next();
  });
  router.use(createRateLimiter());
  router.get('/resolve', async (req, res) => {
    if (typeof req.query.path !== 'string' || (req.query.redirect !== undefined && req.query.redirect !== 'false')) {
      res.status(400).json(errorResponse('ENTITY_PATH_INVALID', 'Invalid entity path'));
      return;
    }
    try {
      const result = await service.resolve(req.query.path);
      if (result.status === 'canonical' || result.status === 'redirect') {
        if (result.status === 'redirect' && req.query.redirect !== 'false') {
          res.location(result.entity.canonicalPath).status(301).end();
        } else res.json(successResponse(result.entity));
        return;
      }
      const status = { invalid: 400, not_found: 404, gone: 410, integrity_error: 503 }[result.status];
      if (status === 503) logger.warn('Entity registry integrity check failed');
      res.status(status).json(errorResponse(`ENTITY_${result.status.toUpperCase()}`, 'Entity unavailable'));
    } catch (error) {
      logger.error('Entity read failed', error instanceof Error ? error : { error: String(error) });
      res.status(503).json(errorResponse('ENTITY_UNAVAILABLE', 'Entity unavailable'));
    }
  });
  return router;
}
