import { Router } from 'express';
import { createCertificationReader } from '@/application/services/ContentCertification';
import { PublicContentEntityService } from '@/application/services/PublicContentEntityService';
import { Decision, EntityPublicReadPolicy, entityPublicReadPolicy } from '@/application/services/EntityPublicReadPolicy';
import { EntityBroadcastService } from '@/application/services/EntityBroadcastService';
import { ContentIdentityService } from '@/application/services/ContentIdentityService';
import { MongoContentEntityRepository, MongoContentSlugRepository, MongoContentTitleKeyRepository } from '@/infrastructure/repositories/MongoContentIdentityRepositories';
import { errorResponse, successResponse } from '@/shared/types/ApiResponse';
import { Logger } from '@/shared/utils/logger';
import { createRateLimiter } from '../middlewares/rateLimit';

const logger = new Logger('PublicContentEntity');

export function createEntityRoutes(
  service = new PublicContentEntityService(new ContentIdentityService(
    new MongoContentEntityRepository(), new MongoContentSlugRepository(), new MongoContentTitleKeyRepository()
  ), createCertificationReader(), new EntityBroadcastService()),
  policy: EntityPublicReadPolicy = entityPublicReadPolicy()
): Router {
  const router = Router();
  // Disabled, killed, breaker open, scope unset and "path not in the canary" all answer the same
  // way, so the frontend keeps rendering the legacy page. They never touch Mongo or the limiter.
  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, follow' });
    const decision = policy.decide(typeof req.query.path === 'string' ? req.query.path : '');
    if (decision.action === 'legacy') {
      res.status(404).json(errorResponse('ENTITY_PUBLIC_READ_DISABLED', 'Entity reads are disabled'));
      return;
    }
    res.locals.entityDecision = decision;
    next();
  });
  router.use(createRateLimiter());
  router.get('/resolve', async (req, res) => {
    if (typeof req.query.path !== 'string' || (req.query.redirect !== undefined && req.query.redirect !== 'false')) {
      res.status(400).json(errorResponse('ENTITY_PATH_INVALID', 'Invalid entity path'));
      return;
    }
    const decision = res.locals.entityDecision as Extract<Decision, { action: 'entity' }>;
    const legacy = () => res.status(404).json(errorResponse('ENTITY_PUBLIC_READ_DISABLED', 'Entity reads are disabled'));
    const canary = decision.mode === 'canary';
    try {
      const result = await service.resolve(req.query.path);
      // Canary: the registry must still agree with the approved pin, at this read.
      if (canary && !(result.status === 'canonical' && result.entity.entityId === decision.entry.entityId && result.entity.canonicalPath === decision.entry.canonicalPath)) {
        policy.outcome(req.query.path, result.status === 'integrity_error' ? 'integrity_error' : 'revalidation_failed');
        legacy();
        return;
      }
      // Per-URL safeguard (Phase 3D): the legacy page turns `index, follow` the moment its work is scheduled today or
      // tomorrow. An indexable page is never replaced by a noindex entity page, whatever else says this entity is ready.
      if (result.status === 'canonical' && result.guard && result.guard.legacyIndexableNow !== false) {
        policy.outcome(req.query.path, 'legacy_indexable');
        legacy();
        return;
      }
      if (canary) policy.outcome(req.query.path, 'served');
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
      if (canary) {
        policy.outcome(req.query.path, 'error');
        legacy();
        return;
      }
      res.status(503).json(errorResponse('ENTITY_UNAVAILABLE', 'Entity unavailable'));
    }
  });
  return router;
}
