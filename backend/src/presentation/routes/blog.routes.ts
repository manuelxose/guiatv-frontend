import { Router } from 'express';
import { BlogController } from '../controllers/BlogController';

export const createBlogRoutes = (blogController: BlogController): Router => {
  const router = Router();

  router.get('/', blogController.getPosts);
  router.post('/', blogController.createPost);
  router.get('/categories', blogController.getCategories);

  return router;
};
