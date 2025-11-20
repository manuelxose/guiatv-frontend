import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { getSwaggerSpec } from '../swagger/swagger.config';

export const createSwaggerRoutes = (): Router => {
  const router = Router();
  const spec = getSwaggerSpec();

  // Swagger UI options
  const uiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Guía TV API Documentation',
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      persistAuthorization: true,
    },
  };

  // Swagger UI
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(spec, uiOptions));

  // JSON spec
  router.get('/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
  });

  return router;
};
