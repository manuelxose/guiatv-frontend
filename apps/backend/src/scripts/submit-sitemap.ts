#!/usr/bin/env node
import '../config/bootstrap';

import { logger } from '../shared/utils/logger';
import { submitSitemapToSearchConsole } from '../application/services/submitSitemapToSearchConsole';

async function main() {
  try {
    const result = await submitSitemapToSearchConsole({
      throwOnError: false,
      logger,
    });

    if (result.submitted) {
      logger.info('Sitemap submit completed', result);
      process.exit(0);
      return;
    }

    if (result.skipped) {
      logger.info('Sitemap submit skipped', result);
      process.exit(0);
      return;
    }

    logger.warn('Sitemap submit did not complete successfully', result);
    process.exit(1);
  } catch (error) {
    logger.error('Unexpected error while submitting sitemap', error as Error);
    process.exit(1);
  }
}

main();
