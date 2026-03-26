import { Router } from 'express';
import { TvController } from '../controllers/TvController';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createTvRoutes = (controller: TvController): Router => {
  const router = Router();

  router.get('/read', asyncHandler(controller.read.bind(controller)));
  router.get('/read/channels', asyncHandler(controller.readChannels.bind(controller)));
  router.get('/surface/guide', asyncHandler(controller.guideSurface.bind(controller)));
  router.get(
    '/surface/channels/:channelId',
    asyncHandler(controller.channelSurface.bind(controller))
  );
  router.get(
    '/read/channels/:channelId',
    asyncHandler(controller.readChannelDetail.bind(controller))
  );
  router.get('/read/items/:airingId', asyncHandler(controller.readItem.bind(controller)));

  return router;
};
