# M07 — channels, programmes and EPG

Date: 2026-10-23 (Europe/Madrid). Baseline main `1346f1d`, clean checkout, no open PRs. M05 was merged; production independently confirmed release `20261023010043`, code `cb5a860`, API/SSR active. The later main commit records M05 verification only.

## Product

- Channel pages reuse M05 cards and existing design tokens. Current/next are selected from valid intervals, upcoming slots are chronological, the existing evening inventory now has its own section, and past/future states are explicit. A coverage notice identifies the schedule as confirmed inventory that may be incomplete; no unsupported horizon or date completeness is invented.
- Programme pages expose verified slot state, Madrid/end times and a direct channel schedule destination. Public programmes without a verified schedule get a useful empty state. Movie/series availability requires the matching content kind; series never inherit a slot runtime.
- Desktop EPG channel names now open canonical channel routes. Mobile schedule selection rejects invalid intervals and refreshes both cached live flags without mutating responses. Shared card times use the existing Madrid helper, including DST.
- Cached channel surfaces rehydrate runtime flags using the existing helper, one reference instant and no extra queries. Verified destinations are preserved; no DTO, identity, database or activation-policy change.
- Contrast defects found by real-page axe and independent visual review were corrected: live badges/pills, expired rows, filter labels, guide eyebrows and light-channel breadcrumbs. The existing strong live-red token now supports white small text at WCAG AA.

## Verification

- Angular full suite: 325 passed. Application/spec TypeScript checks and SSR production build passed. Frontend lint: zero errors; pre-existing warning backlog retained.
- Focused backend schedule, query, detail-route and sitemap checks passed. Full local backend: 563 passed, 24 Mongo-dependent skips, one Windows POSIX permission assertion failure in the unrelated owner-key CLI test. Linux CI with Mongo is a mandatory merge gate; the security assertion was not weakened.
- Existing legacy SSR metadata/JSON-LD/exact-ID tests: 4 passed. Independent QA covers M05/M07 SSR navigation, broadcast separation, canonical/noindex/schema, empty/missing channels, keyboard filters and four widths in both themes.
- `artifacts/m07/before/report.json` and selected screenshots record production baseline. `capture.mjs` checks real channel, verified programme destination and guide, with read-only timings, page errors, viewport overflow, SEO and axe. These are lab/network samples, not field Core Web Vitals or a controlled tail-latency benchmark.

## Team and scope

Integrator owned shared navigation/time formatting, baseline, release and integration. Channel engineer owned channel UX/tests; programme engineer owned programme/public entity UX/tests; independent QA/backend/SEO engineer owned cache correction, browser coverage and review. Programme engineer independently reviewed backend changes. Explicit file ownership avoided conflicts.

Available Ponytail/Serena and installed Angular/Playwright/axe tooling were used. Requested design/SEO/Context Mode equivalents were not available as session skills; no dependencies, frameworks, graphs or redundant audits were introduced. Native memory tools were unavailable; this concise delivery record is the handoff.

## Release gates — recorded

Preflight (2026-10-23 14:22 CEST): API/SSR `200`, live release `20261023010043` on `cb5a860`, activation flag-name inventories empty in both `/etc/guiatv/api.env` and `/etc/guiatv/ssr.env` (only `ENABLE_CRON` set), journal for the previous 30 minutes showed only expected `NOT_FOUND` probes, load average 0.52, four retained immutable releases for rollback. No persistent-data change is involved.

Gates, in order:

1. Rebuilt browser checks on the merged tree: `npx playwright test -c playwright.entity.config.ts` → 32 passed, 2 project-skips (M05 + M07 + entity + legacy suites, 375/768/1280/1440, light and dark, axe WCAG AA, no horizontal overflow).
2. CI on PR #72: `Build, test, and performance budgets` success (13m27s, backend with Mongo, frontend, lint, deploy/ops scripts, Angular budgeted build) and `SEO regression` success (3m13s).
3. Independent review of `main...HEAD`: no significant issues; time/DST handling, live-flag rehydration (no cached-snapshot mutation), `detailPath` preservation, template null-safety and SSR/SEO invariants explicitly checked.
4. Merge: PR #72 squash-merged as `da9ec11`.
5. One gated artifact deployment: `deploy-artifact.yml` run `39952795817` on `main@da9ec11` → release `20261023142416`, `gitSha da9ec11`, API/SSR `active`, both health checks `200`.

Post-release verification (public, read-only):

- `/canales/la-1` `200`, canonical correct, confirmed-inventory notice, `Finalizado`/`Próximamente`/`En directo` states and the evening section present in SSR.
- Surface `/v2/tv/surface/channels/la-1`: `current` = the slot covering the request instant with both live flags true, `next` = the first later slot, six evening items; no cached snapshot mutation.
- Verified programme destination `/contenido/program:20261023_la_1_20261023103500` `200` with canonical to itself, Madrid start/end, channel-schedule link and its existing `noindex, follow`.
- Unknown channel `404` with `noindex, nofollow`; `/programacion-tv/en-directo`, `/programacion-tv/guia-canales` and `/` `200`.
- Browser check against production: EPG day grid channel names are `<a href="/canales/…">` for every sampled row, axe 0 violations, 0 page errors; channel page at 375 px has `scrollWidth == innerWidth`, visible keyboard focus, `aria-pressed` toggling, axe 0 violations.
- Performance: server-side channel-surface duration 6–20 ms (one 158 ms outlier) versus 62–115 ms baseline client samples, so the hydration costs nothing measurable; `tv/read` warm p95 70–179 ms. Lab samples, not field CWV.

Rollback target if a critical regression appears: repoint `current` to `20261023010043` and restart `guiatv-api` and `guiatv-ssr` (documented recovery). Not used.

**M07 status: PASS** (engineering, CI, merge, deploy and post-release verification observed).

Next milestone: M08 global UX/UI consistency. It is the right next step, but the milestone graph lists M06 (series/episode pages, EPG films classed as `Series`) as a dependency: either verify that M05's series-detail scope already covers M06 and close it with evidence, or run that narrower remainder first.
