#!/usr/bin/env node
// 3B: verifies a public entity canary from the outside, after an SSR restart or a kill.
//   node entity-canary-verify.mjs --origin https://guiaprogramaciontv.com --allowlist /etc/guiatv/entity-canary.json [--expect-off] [--control /peliculas/x]
// Exit 0 only when every check passes. --expect-off (after a kill or rollback): no allowlisted path may be an entity page.
// Read-only: GET requests only.
import fs from 'node:fs';

const ENTITY_HEADER = 'x-entity-public-read';
const SITEMAP_LIMIT = 40;

/** `entries`: [{canonicalPath}]. Returns { ok, checks: [{check, path?, ok, detail}] }. */
export async function verifyCanary({ fetch: get = fetch, origin, entries, expectOff = false, control = '/peliculas/canary-control-not-an-entity' }) {
  const checks = [];
  const add = (check, ok, detail, path) => checks.push({ check, ok, detail, path });
  const text = async (path) => {
    const response = await get(`${origin}${path}`, { redirect: 'manual' });
    return { response, body: await response.text() };
  };
  for (const { canonicalPath: path } of entries) {
    const { response, body } = await text(path);
    const isEntity = response.headers.get(ENTITY_HEADER) === '1';
    if (expectOff) {
      add('not_served_as_entity', !isEntity, isEntity ? 'still an entity page' : `status ${response.status}`, path);
      continue;
    }
    add('status_200', response.status === 200, String(response.status), path);
    add('entity_marker', isEntity, String(response.headers.get(ENTITY_HEADER)), path);
    add('noindex_header', /noindex/.test(response.headers.get('x-robots-tag') ?? '') && /follow/.test(response.headers.get('x-robots-tag') ?? ''), String(response.headers.get('x-robots-tag')), path);
    add('noindex_meta', /<meta[^>]+name="robots"[^>]+content="noindex, follow"/.test(body), 'meta robots', path);
    add('no_store', /no-store/.test(response.headers.get('cache-control') ?? ''), String(response.headers.get('cache-control')), path);
    const canonicals = [...body.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    add('single_self_canonical', canonicals.length === 1 && new URL(canonicals[0]).pathname === path, canonicals.join(' | ') || 'none', path);
  }
  const control$ = await text(control);
  add('control_not_entity', control$.response.headers.get(ENTITY_HEADER) !== '1', `control ${control} status ${control$.response.status}`);
  // Sitemap exclusion: no allowlisted path anywhere in the sitemap index or its children.
  const index = await text('/sitemap.xml');
  const children = [...index.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).slice(0, SITEMAP_LIMIT);
  const bodies = [index.body];
  for (const child of children) bodies.push((await text(child)).body);
  const listed = entries.filter(({ canonicalPath }) => bodies.some((b) => b.includes(`${origin}${canonicalPath}<`) || b.includes(`${canonicalPath}</loc>`)));
  add('sitemap_excludes_canary', !listed.length, listed.length ? `listed: ${listed.map((e) => e.canonicalPath).join(', ')}` : `${bodies.length} sitemap documents checked`);
  return { ok: checks.every((c) => c.ok), checks };
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const origin = option('--origin');
  const file = option('--allowlist');
  if (!origin || !file) throw new Error('usage: entity-canary-verify.mjs --origin <url> --allowlist <file> [--expect-off] [--control <path>]');
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = await verifyCanary({ origin: origin.replace(/\/$/, ''), entries: doc.entities ?? [], expectOff: args.includes('--expect-off'), control: option('--control') });
  for (const c of result.checks.filter((x) => !x.ok)) console.error(`FAIL ${c.check} ${c.path ?? ''} ${c.detail}`);
  console.log(JSON.stringify({ ok: result.ok, checks: result.checks.length, failed: result.checks.filter((c) => !c.ok).length }));
  process.exit(result.ok ? 0 : 2);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
