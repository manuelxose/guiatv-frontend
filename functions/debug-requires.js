function measure(name, fn) {
  const start = Date.now();
  try {
    const res = fn();
    const took = Date.now() - start;
    console.log(`${name} loaded in ${took}ms`);
    return res;
  } catch (err) {
    const took = Date.now() - start;
    console.error(`${name} threw after ${took}ms`, err);
    throw err;
  }
}

measure('firebase-functions', () => require('firebase-functions'));
measure('express', () => require('express'));
measure('cors', () => require('cors'));
measure('lib v1 index (compiled)', () => require('./lib/v1/index.js'));
measure('lib v2 index (compiled)', () => require('./lib/v2/index.js'));
measure('lib index (compiled)', () => require('./lib/index.js'));
console.log('Done');
