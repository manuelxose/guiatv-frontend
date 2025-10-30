const path = require('path');
const start = Date.now();
try {
  console.log('Loading functions lib entry...');
  const mod = require(path.join(__dirname, 'lib', 'index.js'));
  const took = Date.now() - start;
  console.log(`Loaded in ${took}ms`);
  console.log('Export keys:', Object.keys(mod));
} catch (err) {
  const took = Date.now() - start;
  console.error(`Error during require (after ${took}ms):`, err);
  process.exit(1);
}
