# Backend Regression Recovery Report

## Scope

This report documents the backend investigation performed after a regression in the latest backend update caused frontend screens to stop receiving enough data to render the TV guide and related experiences correctly.

## Verified frontend impact

The regression affected the data volume and route surface expected by active frontend consumers.

Impacted flows:

- TV guide page
- channel detail page
- layout-derived views still backed by `TvDataService`
- secondary admin/developer consumers still pointing to removed legacy routes

## Evidence-based root causes

### 0. Production frontend was still serving an old SSR release

Verified from the live `guiatv-ssr` systemd unit.

Problem:

- the SSR service served a frontend-only release pointer instead of a single shared application release
- the frontend release pointer still referenced an older bundle from March 20, 2026
- that old frontend bundle still called removed legacy TV endpoints such as `/v2/channels` and `/v2/programs`

Impact:

- the backend codebase and the production frontend were out of sync
- the live site kept exercising removed contracts even after the repository-local frontend had already been migrated
- SSR/API logs showed `404` for removed TV endpoints although the current source tree no longer referenced them

Fix:

- published the current runtime into a unified root release
- repointed `/var/www/guiatv/current`
- aligned both services to use the same release path
- restarted `guiatv-ssr`
- verified that live SSR traffic switched to canonical endpoints such as `/v2/discovery/home` and `/v2/tv/surface/guide`

### 1. TV guide payload truncation inside the canonical read path

Verified in `TvReadQueryService.query()`.

Problem:

- the service applied a hard global clamp of `200` items to every request
- guide and channel surfaces requested much larger limits such as `5000`
- frontend adapters that still derive layout-like data from `/tv/read` therefore received only the first 200 items

Impact:

- incomplete guide day payloads
- missing channels/programs in list views
- apparently “empty” or severely degraded guide sections from the frontend point of view

Fix:

- replaced the blanket limit with view-specific policies
- `day` now supports large reads required by the guide surface
- hot paths such as `search` and `now` remain bounded

### 2. Route surface drift after legacy TV routes were unmounted

Verified in the mounted route registry.

Problem:

- legacy routes such as `/programs`, `/layouts`, `/schedules`, `/channels/:id/programs`, and `/ssr/now-playing` were removed from the active router
- documentation and some secondary consumers still referenced them as active contracts

Impact:

- contract confusion for frontend and developer-facing integrations
- admin content tooling still pointed to `/programs`
- backend docs and Swagger no longer matched runtime behavior

Fix:

- aligned repository-local consumers with active canonical routes
- removed dead route files
- rewrote documentation and Swagger around the real active route surface

### 3. Dead backend wiring increased maintenance risk

Problem:

- the server and dependency graph still wired controllers for unmounted legacy routes
- this preserved the illusion that the legacy surface was still operational

Fix:

- removed dead controller wiring from route dependencies and server bootstrap
- retained underlying use cases where they still support admin/jobs/sitemap functionality

### 4. Runtime startup regression in AI rate limiting

Problem:

- runtime validation from `express-rate-limit` rejected the custom AI rate-limit key generator because it used the raw request IP without the library IPv6 helper

Impact:

- the backend could fail during startup before serving requests, depending on runtime validation behavior

Fix:

- replaced the raw IP fallback with `ipKeyGenerator(...)` while preserving authenticated-user based throttling

## Implemented fixes

- Restored correct guide-scale reads in `TvReadQueryService`
- Added regression tests for TV read view normalization and limit policies
- Migrated admin content frontend calls from `/programs` and `/channels` to canonical `/tv/read*`
- Removed dead legacy route files
- Removed stale route dependency wiring
- Replaced outdated Swagger generation with a static spec for active endpoints
- Fixed AI rate-limit startup validation by normalizing the IP fallback
- Rewrote backend documentation in English to match runtime behavior

## Prevention guidance

- Any endpoint consumed by the frontend must have an explicit response contract and a regression test if pagination or field semantics change.
- TV guide surfaces must never depend on a generic low global limit.
- Legacy routes must not remain documented after they are unmounted.
- Route removals require an explicit migration inventory of all repository-local consumers.
