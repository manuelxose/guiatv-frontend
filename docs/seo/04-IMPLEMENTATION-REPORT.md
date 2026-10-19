# 04 — Implementation report (2026-10-19)

All changes are **in the working tree of `guiatv-frontend`, uncommitted and undeployed** (no commit/deploy/AdSense action was authorised). Auctorio untouched.

## Changes
| ID | Change | Files | Verification |
|---|---|---|---|
| T1 | Data-load failure ⇒ 503 + `noindex, nofollow` + `no-store` + `Retry-After: 120`, never cached; catalog detail distinguishes 404/410 from backend errors; `channel-catalog` gets title/description/canonical | `apps/frontend/scripts/ssr-server.mjs`, `services/meta.service.ts` (`markUnavailable`), `services/catalog.service.ts` (`getDetailState`, `getBySlugState`), `pages/catalog-detail`, `pages/channel-catalog`, `pages/canal-completo`, `blog/pages/{post-detail,category,blog-home}` | `npm run seo:ssr-resilience`: 7/7 routes 503/no-store/noindex with a dead API; live-API local SSR: good pages 200, unknown 404 |
| T2 | Unknown post/category ⇒ 404 + `noindex` instead of 302 to `/editorial` | `blog/pages/{post-detail,category}/*` | local SSR against production API: both 404 |
| T3 | Home `<title>`/description rewritten | `pages/home/home.component.ts` | local SSR shows new title (64 ch) |
| T4 | Descriptions clamped to 160 at word boundary; detail title name ≤ 55 | `services/meta.service.ts`, `catalog-detail.component.ts` | `meta.service.spec.ts` |
| T5 | Leftover Markdown repaired at render; approval gate rejects it | `blog/utils/markdown-leftovers.ts`(+spec), `editorial.service.ts`, `EditorialReviewPolicy.ts` | Karma + node tests |
| T6 | Breadcrumb JSON-LD: skip < 2 items, `[emitSchema]` opt-out | `components/breadcrumb/breadcrumb.component.ts`, `catalog-detail.component.ts` | local SSR: 1 BreadcrumbList on movie/series/program pages (was 2) |
| 06 | Reviewer must be accountable; non-human content needs ≥ 1 external source | `apps/backend/.../EditorialReviewPolicy.ts` (+tests) | 7 policy tests pass; full backend suite 341 pass |
| Tools | crawl, SSR-resilience, editorial audit, GSC comparison, npm scripts, `.github/workflows/seo-regression.yml` (PR job + manual live crawl; **no schedule**) | `scripts/*.mjs`, `package.json`, workflow | see 07 |

## Not changed (and why)
Sitemap generator (`/programas/deportes`, 1/286), legal text (owner), stored post bodies/metadata (editor + deploy), robots.txt (T10, small but deploy-affecting), home transfer-state size (T9, needs measurement), Auctorio (separate repo, config belongs to ops).

## Rendering decision
No SSR/prerender change: SSR is already in place and healthy content is in the initial HTML. The fix is about *failure semantics*, not rendering strategy.

## Proposed (not built) — SEO operations & recurring workflows
Admin "SEO" section (only real sources, otherwise "no data"): (1) last `seo:crawl` result + sitemap counts (from a stored JSON), (2) editorial queue by `reviewState` with `editorial-audit` findings, (3) 5xx/`x-ssr-cache` ratio from the existing health watchdog, (4) GSC imports once a service account is wired (`seo:submit-sitemap` already holds the credential path). No fabricated scores.

Recurring (all **disabled until approved**): daily `seo:crawl --limit 60` on the sitemap head + probes and `seo:ssr-resilience` on PRs; weekly `seo:editorial-audit` + `gsc-compare` on a fresh GSC export; monthly full crawl, cluster/cannibalization review (`seo-cluster` skill), AdSense checklist reassessment. The workflow file contains the commented cron.

## Performance
Not re-measured (PageSpeed API quota 429; no local Lighthouse). Last recorded: mobile LCP 5.3 s home, 4.2 s guide (docs/performance-rebuild-final.md, 2026-08-22). No performance claim is made for these changes; the only size-related edits are shorter meta descriptions.
