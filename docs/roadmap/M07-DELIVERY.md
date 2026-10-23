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

## Release gates

Implementation and local checks are complete; final rebuilt browser checks, green CI, PR merge, one gated artifact deployment and post-release verification remain required. Do not interpret this record as M07 PASS until those gates are recorded below.

Preflight: API/SSR healthy, activation flag-name inventories empty in both API/SSR env files, no recent API/SSR error journal entries, previous immutable release present for rollback. No persistent-data change is involved.

Next milestone: M08 global UX/UI consistency after the M07 release is verified.
