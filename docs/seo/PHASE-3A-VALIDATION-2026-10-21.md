# Phase 3A — public entity read foundation

Engineering validation: PASS locally. Publication remains disabled. CI and deployment outcomes are recorded in the PR and final delivery report.

## Implementation

`GET /v2/entities/resolve?path=/peliculas/example` reuses `resolvePath` and the slug registry. The DTO contains `entityId`, `kind`, `title`, `canonicalPath`, optional `originalTitle`, `year`, `synopsis`, `genres`. It excludes matching, moderation, evidence, external IDs and provenance. Publication requires active status, manual matching and named matching/lifecycle reviewers using the existing validator.

Canonical cache, registry canonical and path owner must agree, with valid syntax and kind prefix. Duplicate entity/canonical rows fail closed even without uniqueness indexes. Indexed lookups return at most two rows and have a two-second server limit. Reads create no collections or indexes.

HTTP: 200 canonical; 301 verified alias/merge; 400 invalid; 404 missing/candidate/unverified/disabled; 410 removed; 503 corrupt registry/database failure. `redirect=false` returns the verified target DTO for Angular to issue the site redirect without following an API redirect into HTML. Responses are no-store and noindex, follow. Disabled probes neither query Mongo nor consume rate limits; enabled reads have an independent limiter.

`CONTENT_ENTITY_PUBLIC_READ_ENABLED` accepts only literal `true`; unset/false stays off independently of ingestion flags. Existing detail routes retain legacy rendering only for the explicit disabled error. Enabled errors never use title guessing. Entity views use existing design tokens and async-state UI, omit unavailable metadata, and emit correct SSR status, one verified canonical, noindex, follow, and no-store. No discovery links were added.

Enabled sitemaps exclude detail paths in all three entity namespaces, with caches partitioned by flag state. Disabled sitemaps retain existing EPG URLs. Future activation must restart SSR to clear cached legacy HTML; activation is outside Phase 3A.

## Executed validation

| Check | Result |
|---|---|
| Full backend suite with scratch MongoDB on port 27118 | 481 tests: 480 pass, 0 fail, 1 existing Redis skip |
| Backend lint/typecheck | PASS |
| Frontend lint | PASS: existing 696 warnings, no errors |
| Full frontend suite | 284 pass |
| Production frontend/SSR build | PASS: one worker, 1536 MB Node heap; larger concurrent builds exhausted host memory |
| SSR cache/canonical tests and live entity SSR smoke | 13 pass |
| `npm run seo:ssr-resilience` | PASS |
| `npm run test:deploy` | PASS |
| `git diff --check` | PASS |

The Mongo test uses only `guiatv_test_3a_<pid>`, creates candidates with `createEntity`, verifies through `verifyEntity`, exercises removal and merge, and drops its database. Direct mutations create deliberately corrupt scratch fixtures only. Command monitoring confirms zero mutations during HTTP reads with identity creation disabled. Coverage includes missing/conflicting canonical ownership, invalid input, unknown paths, both flag states, redirects and DTO privacy. Existing EPG parity tests passed.

The live smoke runs the compiled production SSR entrypoint against isolated HTTP fixtures, checking rendered content, robots headers/meta, canonical uniqueness, 301/404/410/503 and disabled legacy fallback. Mongo/lifecycle coverage is provided separately by the HTTP integration test. The smoke runs in SEO CI.

## Fresh production replay: BLOCKED by script/authorization discrepancy

Inspected `phase-2d2f/run-evidence.sh`, trace dumper, baseline and TMDB helper. Mongo operations are reads and the dumper installs its write/DDL guard. However, the runner requires filesystem writes: `ln -sfn` replaces `build/node_modules`, redirects overwrite evidence artifacts, and the TMDB helper writes a cache. The owner instructed: “If it requires writes, stop that operation and report the discrepancy.” The runner was therefore **not executed**. No fresh replay result or database-access refusal is claimed. No privilege bypass, database mutation, production seeding or credential extraction was attempted.

Read-only checks confirmed API/SSR active and healthy on starting release `20261021183250`. Identity/public-read/provenance flags were absent from the inspected environment files (disabled defaults). Post-deployment checks must confirm runtime flags, EPG and sitemaps; results belong in the delivery report.

## Activation boundary

Reads/writes remain off; M1 and year provenance remain inactive. The human validation gate is unchanged and unmet: 0 labels versus the required 300, 98% precision and 50 second-reviewer rows. Fresh replay remains unmeasured.

Phase 3B recommendation: resolve the replay authorization discrepancy, validate a named-reviewer production sample and canonical ownership, then separately approve a bounded publication rollout and content quality criteria. Discovery and indexing require separate approval. Phase 3B is not started.
