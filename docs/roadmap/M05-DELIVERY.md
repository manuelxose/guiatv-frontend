# M05 — movie and series experience

Date: 2026-10-22 (Europe/Madrid). Scope: the owner's M05 specification, resumed from unfinished local changes based on `47da923`.

## Delivery state

Engineering implemented; independent final browser checks and CI in progress. Merge, release and production verification are separate gates. **M05 is not PASS until those gates complete.**

Baseline: production release `20261022182542`, code `ece2b03`. Repository `main` was `47da923`, with no open PRs. The GitHub repository now redirects from `guiatv-frontend` to `manuelxose/guiatv`.

## Product and navigation

- Movie and series pages reuse the existing design tokens, hero, broadcast list and related-content rail. The mobile hero is compact, exposes a direct emissions action, and avoids duplicating the original title. A whole series never displays an episode/slot runtime.
- Work broadcasts and other channel programmes have separate API arrays, selection logic and Spanish sections. Explicit media/TMDB/type conflicts cannot be grouped as the same work. Unknown identity falls back to an exact normalized work-title comparison within the same inferred kind; this is scheduling presentation, not persistent identity linking.
- Current and upcoming broadcasts are sorted and deduplicated by slot; simultaneous airings on different channels remain visible. Finished legacy slots are removed. Empty inventory has an explicit empty state.
- Guide/card targets use known airing IDs under `/contenido/program:<id>` rather than invented episode/work slugs. These routes render SSR and remain noindex. Existing public movie/series/programme URLs retain their canonical and indexability rules. Older responses without a resolved target lead to the known channel.
- An unmatched TMDB search result is never substituted for the requested slug. Wrong-kind EPG fallback is rejected. The old `/series/camino-a-la-perdicion` report is historical: the baseline route returned 200, so it was tested rather than treated as a current 404.
- No reliable episode collection exists in the current detail DTO. Episode-labelled EPG entries remain informative and use known airing destinations; no unsupported episode collection, episode URL, season, or number is fabricated.

## Quality and safety

Local backend build/full tests: 563 pass, 24 intentionally skipped Mongo-dependent tests, zero failures. Mongo-enabled CI remains required. Local full Angular suite: 314 pass; final focused frontend checks: 14 pass, application/spec typechecks pass, lint zero errors (697 pre-existing warnings), production SSR build passes Angular budgets.

Independent QA added deterministic SSR/Playwright coverage for broadcast separation, simulcasts, four viewport widths (375/768/1280/1440), light/dark axe checks, absent metadata, series runtime, CTA scrolling, exact-ID link navigation, noindex aliases and structured-data safety. QA exposed and implementation corrected a live-badge contrast failure, unfocusable horizontal rails, a low-contrast availability eyebrow and a bare-fragment CTA that navigated to the homepage.

SEO: existing canonical/robots/title/description parity and hostile JSON-LD tests retained; known-ID routes have their own rendering/redirect/noindex regression. No new aggregate ratings, VideoObject, indexable aliases, sitemap entries or invented facts. No dependency added, schema migration, database maintenance, identity flag activation or unrelated roadmap phase.

## Measurement method

`artifacts/m05/capture.mjs` captures seven real representative routes, each at four widths. Reports contain three API/SSR latency samples per route, SEO/JSON-LD, console errors, overflow, image state, lab LCP/CLS and axe findings. These are internet/cache observations, not a controlled load benchmark or field Core Web Vitals; INP is not claimed.

Baseline report and selected screenshots are versioned; the remaining screenshots stay in the local evidence directory. Baseline mobile hero heights ranged 400.5–712.5 px. Existing screenshots demonstrate unrelated channel programmes displayed under the work's emissions and a series showing a 75-minute runtime. Original mobile/desktop captures show zero document overflow; serious accessibility defects were present in availability labels/related rails.

## Multi-agent work and tools

- Integrator: baseline/release checks, SSR exact-ID rendering, shared card/channel navigation, PRs, CI, release and evidence.
- Backend engineer: broadcast identity partition, conservative route resolution, DTOs, cache-key renewal and deterministic regression tests; independent frontend review.
- Frontend engineer: existing component UX, metadata/schedule semantics, accessibility, typechecks/tests/build; independent backend/SSR review.
- Independent QA: real baseline capture, deterministic SSR/browser/axe tests, visual/performance/SEO comparison and defect reports.

Ponytail, verification-before-completion, local technical SEO/schema skills and Graphify query were used. Graphify was found in its installed uv environment despite not being on PATH. Context Mode CLI memory search found no existing M05 entry. Named design plugins were not installed; implementation reused the repository's design system, Angular tooling, installed Playwright and axe. No redundant framework was installed.

## Release gates and follow-up

1. Focused semantics/navigation PR.
2. Shared UX/accessibility and independent QA PR.
3. Merge only after green CI and review, then one ordinary artifact-workflow release.
4. Verify live release SHA, API/SSR health, rendered samples, routes, grouping, SEO parity, browser/axe/viewport results, resource consumption and nginx errors. Roll back on the documented critical-regression thresholds.

Final PR/run/release identifiers and measured post-release results will be recorded after verification. Next user-facing milestone: M07 programme/channel discovery (clear now/next and actual three-day coverage), since the M05 specification also covers the original M06 series-detail scope. Historical stored identity residue stays bounded debt.
