# GuíaTV — SEO master report (2026-10-19)

> **Current continuation status:** the fixes and editorial policy are now committed and deployed as `30b41e3`, release `20261019210550`; CI and deployment passed. TecnoRia is confirmed as the owner's trade name; Max Nova, Beatriz Olmedo and Arturo Baroja are the configured human reviewers. Auctorio is assisted and its API approval credentials are removed. The complete public corpus is **52 posts, 35 with blocking editorial findings**, superseding the original default-limited 50-post count. A full 453-URL crawl and a final 20-URL recheck are recorded in [08 — automated continuation](08-AUTOMATED-CONTINUATION.md). The final recheck leaves one known sitemap 404 (`/programas/deportes`), three short discovery pages and one long title. **AdSense remains no-go.** Authorized Search Console access now works; the visibility decline is dated and quantified in the private local report `.runtime/gsc/TRAFFIC-RECOVERY.md`. Raw analytics and measured totals are deliberately excluded from this public repository. Sections below preserve the original audit state, including its superseded access and deployment blockers.

## Continuation 2 (2026-10-19, runtime `b940130` + follow-up) — single running status

**Evidence vs hypothesis.** Search Console data (private, `.runtime/gsc/`) shows the site never had meaningful organic visibility: its best period was impressions at average positions ~50–70 for generic head terms, with ~0 clicks. The 1 September cut-off is abrupt (day-level zero after ~55–60 impressions/day), but its cause is **unproven**: it coincides with the 31 Aug/1 Sep releases and is equally consistent with Google ceasing to show the home at positions 50–70. The later improvement in average position reflects a change in which queries still show, not a recovery. No recovery is claimed. Equivalent-window comparisons are in the private report.

**Confirmed and fixed**
| Defect | Cause (confirmed in code + production API) | Fix | Verified |
|---|---|---|---|
| `/programas/deportes` in sitemap, 404 (only 1 of 286 programme URLs) | slug resolver read a 500-row, start-sorted candidate set per search token; `searchTokens` also contains category/channel names, so "deportes" tags thousands of airings and never reached the exact title | resolve through distinct titles, then load the exact match (`CatalogService.findTvReadItemBySlug`) | unit tests; production after deploy: 200, own title/canonical, unknown slug still 404 noindex |
| Home had no topical H1 (carousel title "Telediario 2" was the H1) | design: media-only hero | visible H1 "Programación de TV hoy en España" + intro; carousel title is H2 | SSR + 390/1440 px, production HTML: one H1 |
| Generic titles on `/programacion-tv/que-ver-hoy` ("Qué Ver"), `/programacion-tv/guia-canales` ("TV Directo"), `/plataformas` | tab name reused as SEO title | descriptive `seoTitle` per tab | unit suite; production check pending |
| Possible MongoDB pool exhaustion on cache expiry | **hypothesis, mechanism in code**: no coalescing of identical concurrent TV reads → N aggregations per expiry | single-flight in `TvReadQueryService` (no limit changes) | unit test; production effect unproven (SSH to the VPS was refused, logs not re-read) |

**Tests.** Backend 343 pass / 0 fail / 1 skipped; frontend 255/255. Playwright, full local run: **81 passed, 26 failed, 4 skipped**. The same specs on the previous commit (`18f4ea6`) fail in the same way (24 failed; `home-live` failed there too; `admin-affiliate` desktop is flaky and passes on rerun). The failures are environmental (local data without live airings, TMDB 401, local 429 rate limit) and pre-existing: **the e2e suite is complete but not green; this is not a passing end-to-end run.**

**Editorial.** Drafts prepared, not published, no human reviewer assigned: [`editorial-drafts/`](editorial-drafts/README.md) (Champions League 2026-27, LaLiga 2026-27) built only from primary sources (UEFA, LaLiga, DAZN) with unverified claims and prices omitted; consolidation map for the 52 posts with proposed redirects (nothing executed). The 35 blocking posts remain blocking.

**Published 2026-10-19 (owner instruction, reviewer of record Arturo Baroja, who delegated verification to Claude).** Three consolidated guides replace 10 posts: `donde-ver-champions-league-2026-27-espana`, `donde-ver-laliga-2026-27-espana`, `precios-plataformas-streaming-espana`. Each post's body discloses AI assistance and its primary sources (UEFA, LaLiga, DAZN, official operator/platform pages); the approval note records that Claude drafted and checked it. Verified in production: 200, one H1, own canonical, Article + BreadcrumbList JSON-LD, no raw Markdown, reviewer shown. The 10 old posts 301 to them (`apps/frontend/scripts/ssr-server.mjs`, `EDITORIAL_REDIRECTS`; checked live) and were moved back to draft (reversible), so `sitemap-blog.xml` went from 63 to 56 URLs and public posts from 52 to 45. No sitemap was resubmitted to Google. Streaming prices come from each service's page on 19 Oct 2026; SkyShowtime, DAZN, Filmin, Atresplayer and RTVE Play are not covered (not verifiable from an official page). Finding: the platform formerly named "Max" is "HBO Max" on its official Spanish site; other posts still say "Max".

**Second batch (same day):** `netflix-hbo-max-disney-prime-video-que-plan-elegir` (plans, quality, screens, ads, monthly vs annual cost computed from official prices) replaces `netflix-vs-max-espana`, `max-vs-disney-plus-espana`, `netflix-vs-prime-video-espana` (301 live, old posts drafted); the prices guide now states, from Prime Video's official help, that Prime Video carries limited non-skippable ads and that the ad-free option is a separate monthly add-on. Public posts: 43.

**Application review (2026-10-19, crawl of the 444 sitemap URLs: title/description/H1/words).** Fixed and deployed (`8d3345b`, `9e4d864`): menu/footer label "Blog" → "Editorial" (route `/editorial`), `/editorial` now has a real H1 ("Guía TV Editorial", not the featured post's title), `/embed` H1/intro replaced developer notes with user copy, footer jargon ("Portal premium", "Abrir superficie") and the duplicate "Mi cuenta" link (a 301) removed, football pages got descriptive titles/descriptions (were 41–43 character descriptions), program/film pages "<title>: cuándo ver en TV | Guía TV" / "…: dónde ver | Guía TV", the five legal pages each got their own description (all five shared a wrong generic one about programme schedules), channel-card links name the channel in their anchor text, and `/perfil`, `/para-ti` (noindex, client-rendered) no longer answer **503** to crawlers: they were linked from every footer and returned an outage status since the empty-render rule was added. Measured but not changed: 3 of 444 URLs answered 503 once under a 4-way crawl (re-probed: 200, resolver 45–80 ms), 12 posts with truncated titles/H1 ("opci…"), 10 older posts with missing accents in title/H1 ("Que ver esta noche…"), `/plataformas` and the football hubs are thin (~170–440 words) because they are mostly live data.

**Blocker found: TMDB.** Production logs show HTTP 401 from TMDB on every call and `/etc/guiatv/api.env` has no `TMDB_API_KEY` (nor do the backups taken before today's edits). Result: `/v2/discovery/browse` and `/v2/catalog` return zero items, so `/plataformas` and discovery views have no catalog. Needs the owner's TMDB read-access token; platform rankings from the catalog cannot be written until then.

**Still open**
1. Fresh audit after publishing (`artifacts/seo/editorial-audit-2026-10-19-after-publish.json`): **45 public posts, 27 with blocking findings** (was 52 / 35); 12 posts with raw Markdown/hotlinked images, 11 thin bodies, 16 AI posts without external sources. They still need verification/rewrite or retirement per the consolidation map; the "Max" → "HBO Max" naming fix; blog-slug redirects currently live only as a code map, not a data-driven feature.
2. 17 posts with hotlinked `auctorio.com` images and raw Markdown tokens; 23 AI posts without external sources.
3. Short discovery pages (`/plataformas`, football today/live) and the 71-character Netflix-vs-Prime title.
4. Home HTML carries ~650 KB of duplicated transfer state (61 KB brotli): low priority.
5. Mongo pool / SSR timeouts: confirm in production logs after this release (needs server access).
6. Field Core Web Vitals: insufficient Google data.
7. Next Search Console comparison: same 28-day windows from 16 Nov 2026, home generic queries separately.

Detail: [01 technical](01-TECHNICAL-AUDIT.md) · [02 traffic](02-TRAFFIC-RECOVERY.md) · [03 AdSense](03-ADSENSE-READINESS.md) · [04 implementation](04-IMPLEMENTATION-REPORT.md) · [05 content](05-CONTENT-STRATEGY.md) · [06 Auctorio](06-AUCTORIO-INTEGRATION.md) · [07 validation](07-VALIDATION.md) · [skills](SKILL-INVENTORY.md)

## 1. Executive summary
- **Not ready for an AdSense re-review, and no ranking/traffic improvement is claimed.** Nothing here is deployed, committed, or measured in Search Console.
- Healthy base: SSR Angular 20, content in initial HTML, 432 of 453 sitemap URLs rendered correctly with clean canonicals/JSON-LD, correct 404s for unknown channels/programmes.
- Biggest technical defect found (P0): when an API call fails during SSR, pages were served as **cacheable, indexable 200s** (14 sitemap URLs failing continuously in production today, 5 more intermittently) or as **false 404s** for valid programme/movie pages. Fixed in code; the production *trigger* is unknown and needs server logs.
- Biggest content defect (P1): the editorial section — the only place original value can live — is 10 stub posts (73–275 words) plus 39 unsourced/templated AI-assisted posts with visible Markdown, truncated metadata, hot-linked images and near-duplicate clusters. The Aug-31 documents describe rewrites that production does not contain.
- Governance gap (P0/P1): Auctorio can approve and publish to GuíaTV under a bot reviewer identity. The GuíaTV gate now refuses it; ops must switch Auctorio to assisted mode.
- Traffic decline: cannot be dated or sized without GSC. A ready-to-use comparison tool and an exact data request are in 02.

## 2. Architecture discovered
Monorepo (Angular 20.3 SSR via custom Express wrapper, Express/Mongo/Valkey API, nginx + Cloudflare, GitHub Actions SSH deploy); Auctorio separate (Fastify/Prisma/BullMQ) posting drafts to `/v2/blog`. See 01.

## 3. Skills
claude-seo (9 skills) and marketingskills (8, prefixed `mk-`) installed project-scoped and git-ignored after manual review; hooks, sub-agents and the global installer deliberately skipped. Python runtime not set up; invocation needs a new session. Four repo scripts cover the same checks without dependencies. See SKILL-INVENTORY.

## 4–6. Findings (technical / traffic / AdSense)
See 01–03. Matrix below.

## 7. Implemented fixes
T1–T6 and the approval-policy hardening — files and verification in 04.

## 8–9. Content strategy and Auctorio
30 topic opportunities (qualitative, no fabricated volumes), 10 briefs, consolidation plan for the existing corpus (05). Auctorio already implements research→brief→draft→QA→approval→publish; the gaps are reviewer identity, rendered sources, image ownership (06).

## 10. Quality gates now machine-checkable
Approval policy (reviewer, sources, Markdown, ≥250 words, author, SEO fields, relevance), `seo-crawl`, `seo-ssr-resilience`, `editorial-audit`, `gsc-compare`; PR workflow `seo-regression.yml`.

## 11. Tests
Frontend Karma 254/254; backend 341 pass/0 fail/1 skipped; resilience check 7/7; builds OK. Not run: Playwright e2e, axe, Lighthouse/CWV, Rich Results Test, anything against a deployed build (07).

## 12. Operational cost
No paid API used. Recurring: none activated. Auctorio's text API is its existing paid dependency (capped per its budgets); weekly editorial/GSC work is human time. Optional future: claude-seo Python runtime (free, local), DataForSEO etc. **not** enabled.

## 13. Remaining risks
Unknown production trigger of T1 (may recur until fixed at source); un-sized traffic loss; stored editorial data still defective until edited; Auctorio autopilot config unseen; legal identity text; discrepancy between Aug-31 docs and production data; Cloudflare/nginx/SSR cache layers can pin a bad render for ≤ 10 min.

## 14. Pending external access / permissions
Deploy approval · server logs (`guiatv-ssr`, nginx) · GSC exports or service-account read access · Auctorio production config · owner decisions (legal entity, named editor, editorial policy) · `claude-seo setup` (download) · approval to enable any scheduled job.

## 15. Next actions
1. Review and commit the working tree; deploy; run the post-deploy checks in 07. 2. Pull server logs to find why `/canales` and 13 blog URLs fail in production. 3. Set `EDITORIAL_HUMAN_REVIEWERS`; put Auctorio in assisted mode. 4. Export GSC data → `gsc-compare` at each timeline date. 5. Editor pass: rewrite 10 stubs, source/consolidate the AI clusters, retire stale event posts. 6. Fix legal page + add editorial policy/named editor. 7. Remove legacy-route Disallows from robots.txt. 8. Only then reconsider an AdSense review.

## Issue priority matrix
| Pri | Issue | State |
|---|---|---|
| P0 | T1 SSR error states served as 200/404, cacheable | fixed in code, undeployed; prod trigger unknown |
| P0 | Bot identity can approve/publish AI content | policy fixed in code; ops config pending |
| P1 | Editorial stubs, unsourced/templated/stale AI posts, Markdown, truncated metadata, hot-linked images | audited; needs editor + deploy |
| P1 | Unknown editorial URLs 302 (soft 404) | fixed in code |
| P1 | Home title/description; 500-char descriptions | fixed in code |
| P1 | Legal notice drafting note / identity mismatch; no editorial policy or named editor | owner action |
| P1 | Traffic loss unquantified | blocked on GSC |
| P2 | Duplicate breadcrumb JSON-LD | fixed in code |
| P2 | `/programas/deportes` sitemap 404; 13 thin category pages in sitemap; robots Disallow on legacy redirects; home transfer-state weight; Docs/production discrepancy | open |
| P3 | `/deportes/futbol/partidos-hoy`, `/en-directo` thinness; blog post double breadcrumbs | open |
