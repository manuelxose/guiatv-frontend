const history = require('connect-history-api-fallback');

module.exports = {
  server: {
    // Angular outputs the browser bundle to dist/guiatv/browser
    baseDir: 'dist/guiatv/browser',
    // Serve index.html as the default entry for CSR builds
    index: 'index.html',
    // Angular 20 writes index.html for the CSR build when SSR is disabled
    middleware: [ history({ index: '/index.html', verbose: true }) ]
  },
  files: [ 'dist/guiatv/browser/**/*' ],
  watchOptions: {
    ignored: '**/*.map',
    ignoreInitial: true
  },
  reloadDebounce: 1000,
  port: 4200,
  ui: { port: 3001 },
  open: false
};
