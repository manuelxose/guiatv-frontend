// src/v2/presentation/routes/swagger.routes.ts

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../swagger/swagger.config';

export const createSwaggerRoutes = (): Router => {
  const router = Router();

  // Swagger UI
  router.use('/', swaggerUi.serve);
  router.get(
    '/',
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Guía TV API Documentation',
    })
  );

  // JSON spec
  router.get('/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  return router;
};
