const { existsSync } = require('node:fs');
const { chromium } = require('@playwright/test');

// Keep Karma and Playwright on the same repository-managed browser. This
// avoids depending on a host-level Chrome installation while preserving an
// explicitly supplied CHROME_BIN for environments that manage Chrome itself.
if (!process.env.CHROME_BIN) {
  const playwrightChromium = chromium.executablePath();
  if (!existsSync(playwrightChromium)) {
    throw new Error(
      `Playwright Chromium was not found at ${playwrightChromium}. ` +
      'Install repository dependencies (including Playwright browsers) before running frontend tests.'
    );
  }
  process.env.CHROME_BIN = playwrightChromium;
}

module.exports = (config) => {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      clearContext: false,
    },
    reporters: ['progress', 'kjhtml'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: true,
  });
};
