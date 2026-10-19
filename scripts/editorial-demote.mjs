#!/usr/bin/env node
// Moves merged editorial posts back to draft (they are 301-redirected by ssr-server.mjs) so they leave the
// sitemap. Reversible: the post is kept, only status/reviewState change. Needs ANALYTICS_ADMIN_KEY.
// Usage: node scripts/editorial-demote.mjs slug [slug ...]
const base = (process.env.API_BASE || 'http://127.0.0.1:4000').replace(/\/$/, '');
const headers = { 'content-type': 'application/json', 'x-admin-key': process.env.ANALYTICS_ADMIN_KEY || '' };
for (const slug of process.argv.slice(2)) {
  const list = await (await fetch(`${base}/v2/blog?slug=${encodeURIComponent(slug)}&status=all`, { headers })).json();
  const id = list[0]?.id;
  if (!id) { console.log(`skip ${slug}: not found`); continue; }
  const res = await fetch(`${base}/v2/blog/${id}`, { method: 'PUT', headers, body: JSON.stringify({ status: 'draft' }) });
  console.log(`${res.ok ? 'drafted' : 'FAILED ' + res.status} ${slug} (${id})`);
}
