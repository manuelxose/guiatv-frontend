// Compares every schema index of the collections in production-index-specs-*.json (index metadata
// read from production 2026-10-21, no documents) with the live name, key and options.
// Run from apps/backend after `npm run build`: node ../../docs/seo/phase-2d2/check-index-names.cjs
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = path.resolve('dist/infrastructure/database/models');
for (const f of fs.readdirSync(models)) if (f.endsWith('.model.js')) require(path.join(models, f));
const prod = JSON.parse(fs.readFileSync(path.join(__dirname, 'production-index-specs-2026-10-21.json'), 'utf8'));
const byCollection = Object.fromEntries(mongoose.modelNames().map((n) => [mongoose.model(n).collection.name, mongoose.model(n)]));
let checked = 0;
let mismatches = 0;
for (const [collection, live] of Object.entries(prod)) {
  for (const [key, { background, name, ...options }] of byCollection[collection].schema.indexes()) {
    checked++;
    const expected = name || Object.entries(key).map(([k, v]) => `${k}_${v}`).join('_');
    const index = live.find((i) => i.name === expected);
    const liveOptions = index && Object.fromEntries(Object.entries(index).filter(([k]) => k !== 'key' && k !== 'name'));
    if (!index || JSON.stringify(index.key) !== JSON.stringify(key) || JSON.stringify(liveOptions) !== JSON.stringify(options)) {
      mismatches++;
      console.log('MISMATCH', collection, JSON.stringify(key), expected);
    }
  }
}
console.log(JSON.stringify({ checked, mismatches }));
process.exitCode = mismatches ? 1 : 0;
