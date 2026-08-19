import { Router } from 'express';
import { FootballController } from '../controllers/FootballController';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { analyticsAdminGuard } from '../middlewares/analyticsAdminGuard';

export const createFootballRoutes = (controller: FootballController): Router => {
  const router = Router();

  router.get('/home', asyncHandler(controller.home.bind(controller)));

  router.get('/matches/live', asyncHandler(controller.liveMatches.bind(controller)));
  router.get('/matches', asyncHandler(controller.matches.bind(controller)));
  router.get('/matches/:idOrSlug', asyncHandler(controller.matchDetail.bind(controller)));

  router.get('/competitions', asyncHandler(controller.competitions.bind(controller)));
  router.get('/competitions/:slug', asyncHandler(controller.competitionDetail.bind(controller)));

  router.get('/teams/:slug', asyncHandler(controller.teamDetail.bind(controller)));

  router.get('/news', asyncHandler(controller.news.bind(controller)));
  router.get('/search', asyncHandler(controller.search.bind(controller)));

  // Broadcast reconciliation overrides (admin-only).
  router.post(
    '/broadcasts/override',
    analyticsAdminGuard,
    asyncHandler(controller.upsertBroadcastOverride.bind(controller))
  );
  router.delete(
    '/broadcasts/override',
    analyticsAdminGuard,
    asyncHandler(controller.clearBroadcastOverride.bind(controller))
  );

  return router;
};
