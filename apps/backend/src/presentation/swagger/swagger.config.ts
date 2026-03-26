import { openApiSpec } from './openapi.spec';

export const getSwaggerSpec = () => openApiSpec;

export const swaggerSpec = new Proxy({}, {
  get: (_target, prop) => {
    const spec = getSwaggerSpec();
    return (spec as any)[prop];
  },
});
