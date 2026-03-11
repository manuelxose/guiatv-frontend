import { Router } from 'express';
import { BlogController } from '../controllers/BlogController';
import { analyticsAdminGuard } from '../middlewares/analyticsAdminGuard';

export const createBlogRoutes = (blogController: BlogController): Router => {
  const router = Router();

  router.get('/', blogController.getPosts);
  router.get('/categories', blogController.getCategories);
  router.post('/', analyticsAdminGuard, blogController.createPost);
  router.put('/:id', analyticsAdminGuard, blogController.updatePost);
  router.delete('/:id', analyticsAdminGuard, blogController.deletePost);

  return router;
};
