export const ensureProjectEnv = () => {
  const requiredEnvs = ['PROJECT_ID'];
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

  if (missingEnvs.length > 0) {
    console.warn(`Missing environment variables: ${missingEnvs.join(', ')}`);
    // In development/test we might want to set defaults or fail
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Running in non-production, setting defaults...');
        if (!process.env.PROJECT_ID) process.env.PROJECT_ID = 'guia-tv-8fe3c';
    }
  }
};
