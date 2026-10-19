#!/usr/bin/env node
// Compare Search Console performance before/after a pivot date from a standard GSC export (no API/credentials).
// Export in GSC > Performance > Export > Download CSV, then unzip. Needs Dates.csv; Pages.csv / Queries.csv
// are used only when they were exported with the "compare" option (columns "<period> Clicks").
// Usage: node scripts/gsc-compare.mjs <export-dir> --pivot YYYY-MM-DD [--git]
//        node scripts/gsc-compare.mjs --self-check
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i]])));
}
const num = (v) => Number(String(v ?? '0').replace('%', '').replace(',', '.')) || 0;

export function comparePeriods(dates, pivot) {
  const agg = (rows) => {
    const clicks = rows.reduce((s, r) => s + num(r.Clicks), 0), imp = rows.reduce((s, r) => s + num(r.Impressions), 0);
    const pos = imp ? rows.reduce((s, r) => s + num(r.Position) * num(r.Impressions), 0) / imp : 0; // impression-weighted
    return { days: rows.length, clicks, impressions: imp, ctr: imp ? +(100 * clicks / imp).toFixed(2) : 0, avgPosition: +pos.toFixed(1) };
  };
  const key = (r) => r.Date ?? r.date;
  const before = dates.filter((r) => key(r) < pivot), after = dates.filter((r) => key(r) >= pivot);
  return { before: agg(before), after: agg(after) };
}

if (process.argv.includes('--self-check')) {
  const csv = 'Date,Clicks,Impressions,CTR,Position\n2026-08-01,10,1000,1%,5.0\n2026-08-02,10,1000,1%,5.0\n2026-08-03,2,1000,0.2%,9.0\n"2026-08-04",2,1000,0.2%,9.0\n';
  const r = comparePeriods(parseCsv(csv), '2026-08-03');
  assert.deepEqual(r.before, { days: 2, clicks: 20, impressions: 2000, ctr: 1, avgPosition: 5 });
  assert.deepEqual(r.after, { days: 2, clicks: 4, impressions: 2000, ctr: 0.2, avgPosition: 9 });
  console.log('self-check ok');
  process.exit(0);
}

const dir = process.argv[2], pivot = process.argv[process.argv.indexOf('--pivot') + 1];
if (!dir || !/^\d{4}-\d{2}-\d{2}$/.test(pivot ?? '')) { console.error('usage: gsc-compare.mjs <export-dir> --pivot YYYY-MM-DD [--git]'); process.exit(2); }
const read = (f) => (existsSync(`${dir}/${f}`) ? parseCsv(readFileSync(`${dir}/${f}`, 'utf8')) : null);
const dates = read('Dates.csv') ?? read('Fechas.csv');
if (!dates) { console.error('Dates.csv (or Fechas.csv) not found in export'); process.exit(2); }
console.log(JSON.stringify(comparePeriods(dates, pivot), null, 1));
for (const [file, label] of [['Pages.csv', 'page'], ['Queries.csv', 'query']]) {
  const rows = read(file); if (!rows?.length) continue;
  const cols = Object.keys(rows[0]).filter((c) => /Clicks$/.test(c));
  if (cols.length < 2) { console.log(`${file}: no comparison columns (re-export with "Compare")`); continue; }
  const [cur, prev] = cols;
  const first = Object.keys(rows[0])[0];
  const lost = rows.map((r) => ({ [label]: r[first], delta: num(r[cur]) - num(r[prev]), prev: num(r[prev]) })).sort((a, b) => a.delta - b.delta).slice(0, 15);
  console.log(`\nTop 15 ${label}s by click loss (${cols[0]} vs ${cols[1]}):`); console.table(lost);
}
if (process.argv.includes('--git')) {
  console.log('\nCommits within 14 days of the pivot:');
  const d = new Date(pivot), f = (n) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  console.log(execFileSync('git', ['log', `--since=${f(-14)}`, `--until=${f(14)}`, '--format=%h %ad %s', '--date=short'], { encoding: 'utf8' }));
}
