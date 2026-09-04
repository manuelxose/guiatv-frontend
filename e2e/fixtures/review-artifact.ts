import type { TestInfo } from '@playwright/test';

/**
 * Routine runs keep screenshots in Playwright's generated test-results tree.
 * Set GUIATV_UPDATE_REVIEW_ARTIFACTS=1 only for an intentional visual-review
 * capture that should refresh the tracked .impeccable reference images.
 */
export function reviewArtifactPath(testInfo: TestInfo, filename: string): string {
  if (process.env.GUIATV_UPDATE_REVIEW_ARTIFACTS === '1') {
    return `.impeccable/review/${filename}`;
  }
  return testInfo.outputPath(filename);
}
