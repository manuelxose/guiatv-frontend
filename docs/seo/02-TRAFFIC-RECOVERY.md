# 02 — Traffic recovery (2026-10-19)

## Status: the decline cannot be quantified or dated from available evidence
No Search Console, analytics or server-log data is accessible from this workspace (no credentials in the repo; `RUNBOOK.md` says a GSC service account lives at `/etc/guiatv/gsc-service-account.json` on the VPS and is used only to *submit* sitemaps). `site:` search is not usable evidence. **Nothing below is a measured traffic number.**

## What was built so the analysis can be done in minutes once data exists
`node scripts/gsc-compare.mjs <gsc-export-dir> --pivot YYYY-MM-DD --git`
Input: a standard Search Console Performance export (Dates.csv; Pages.csv/Queries.csv exported with "Compare"). Output: clicks, impressions, CTR and impression-weighted position before/after the pivot; top 15 pages and queries by click loss; the git commits within ±14 days of the pivot. Self-check: `node scripts/gsc-compare.mjs --self-check` (passes). No API, no credentials, no cost.

## Exact evidence needed (owner action)
1. GSC → Performance → last 16 months, daily, export Dates / Pages / Queries / Devices (and a "compare" export around the suspected drop).
2. GSC → Indexing → Pages: export "Not indexed" reasons and the history chart; Sitemaps → processed/discovered counts per child sitemap; Manual actions + Security issues screens; Core Web Vitals report.
3. Cloudflare/nginx access logs (`Googlebot` status mix per day) and `journalctl -u guiatv-ssr` around the dates below.
4. Analytics changes (any tag/consent change that could alter *measured* sessions).

## Deployment timeline (git, authoritative for *when code changed*)
| Date | Change | Indexing risk |
|---|---|---|
| 2025-12-19/20 | First SSR setup + sitemap controller | Before this the site was CSR-only; large rendering change |
| 2026-03-05 | Monorepo migration + "direct deploy", dynamic sitemap, JSON-LD on detail pages | Sitemap/URL set changes |
| 2026-03-26 | TV read model, BFF consolidation, **route cleanup** | URL changes/redirects |
| 2026-08-12/13 | "Rebuild guide frontend experience", SSR fixes ("stop SSR-starving isBrowser guards"), EPG OOM crash-loop fix, mongod outage (Round 12) | Outages ⇒ 5xx/empty renders |
| 2026-08-14…22 | Mobile-first shell, football vertical (100+ new URLs), nav/search rebuild | New thin URL families |
| 2026-08-31 | AdSense remediation release: sitemap shrunk 2,759 → ~450 URLs, `noindex` on sparse families, 11 unattributed Auctorio posts moved to rejected (per docs/adsense, not re-verified) | Large intentional de-indexing |
| 2026-09-02/03 | Contabo VPS config imported, GitHub-Actions deploy; "publish non-empty streaming sitemap" | Infra move |
| 2026-09-04 | Full visual reskin (design tokens, 40+ commits) + catalog/EPG changes | Template/DOM change |
| 2026-10-17 | CI/deploy hardening | — |

## Hypotheses ranked by plausibility (each states what would confirm it)
1. **Rendering/availability failures served as 200/404 (T1)** — *Observed in code and reproduced; trigger in prod unproven.* Confirm: GSC "Not found (404)" / "Soft 404" / "Crawled – not indexed" spikes on `/programas`, `/peliculas`, `/canales`, `/editorial/*` aligned with SSR error logs.
2. **Self-inflicted URL-set reduction (Aug 31 and Mar 26)** — *Observed in git + docs.* The sitemap fell from 2,759 to 453 URLs and several families went `noindex`; impressions on those families would drop to zero by design. Confirm: Pages report grouped by path prefix before/after.
3. **Thin/duplicated programmatic inventory (936 streaming + 103 football URLs) previously indexed** — prior audit evidence; quality-based demotion is possible but **unprovable** without GSC.
4. **Measurement change** (consent/analytics) — no evidence either way; check GA/GSC divergence.
5. **Algorithmic/demand change** — do not assume. Compare against Google's ranking-update status page dates only *after* 1–4 are excluded, and only if the drop is site-wide and sudden.

## Prioritized recovery plan
| # | Action | Owner | Needs |
|---|---|---|---|
| 1 | Deploy the T1/T2 fixes; read SSR logs to find why `/canales` and 13 blog URLs fail in production | dev/ops | deploy approval, server access |
| 2 | Export GSC data (above) and run `gsc-compare` with pivot at each deployment date | owner | GSC access |
| 3 | After deploy: `npm run seo:crawl` ⇒ must be 0 issues; request re-indexing only for the ~19 formerly broken URLs | dev | — |
| 4 | Remove the robots.txt Disallow for legacy redirect routes (T10) so old backlinks consolidate | dev | deploy |
| 5 | Trigger-level monitoring: alert when SSR returns 5xx/`x-ssr-cache: MISS` ratio spikes (extend `scripts/health-watchdog.mjs`) | dev | approval to change the systemd timer |
| 6 | Do not re-expand sitemaps (streaming/football entities) until each family passes the utility bar in 03 | editor | — |
