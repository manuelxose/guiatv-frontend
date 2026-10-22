# Phase 3E: legacy-first enrichment, EPG integration and SEO consolidation (2026-10-22)

Written for: the owner and the engineers who will decide the first rollout. Builds on [Phase 3D](PHASE-3D-IMPLEMENTATION-2026-10-22.md) (PR #48); stacked on its branch.

| Category | Status |
|---|---|
| Engineering | **Complete** in this PR: flag-gated enrichment of the existing `/peliculas`, `/series`, `/programas` pages, verified 7-day broadcasts, SSR cache epoch, tests |
| Production | **Not deployed, not merged.** Merging needs an owner-approved window (see §8). Every flag stays unset; the new flag is `CONTENT_LEGACY_ENRICHMENT_ENABLED` (off) |
| Evidence | Real: public legacy pages of the 20 films measured today (§6). Fixture: enrichment/schedule results (§6). No production database was read or written |

## 1. Decision: enrich the page that already ranks, do not replace it

Measured on production today (public GETs, 20 films): **10 legacy pages are `index, follow`, 10 `noindex`; 0/20 carry genres, 0/20 a runtime** (the legacy TMDB mapper emits `genres: []` and no runtime, `CatalogService.mapTmdbToCatalogItem`). So the legacy pages already hold the TMDB synopsis, cast and artwork, and lack exactly the facts the media catalogue has plus the schedule beyond today/tomorrow. Phase 3E adds those to the same URL. No new URL, no entity record, no collection, no write.

## 2. Architecture

```
GET /v2/catalog/slug/:type/:slug  ┐
GET /v2/catalog/:id, /v2/content/:id ┴─> CatalogService.getBySlug / getDetail
                                          └─ withLegacyEnrichment(detail)      (never throws)
                                              └─ LegacyEnrichmentService.apply
                                                  ├─ LegacyEnrichmentPolicy.decide(path)   flag / scope / kill (no I/O)
                                                  ├─ media catalogue row (1 read)  + EPG read model (1 indexed read)   cached 60 s, shared by concurrent requests
                                                  ├─ legacyBindingRefusals(page, row)      identity gate (domain/services/legacyEnrichment.ts)
                                                  ├─ legacyMetadataGaps                    only facts the legacy payload lacks
                                                  └─ selectWorkBroadcasts                  the 3D join, now shared with the entity path
```

- **Additive contract.** The only change to the payload is one new key, `enrichment`. `airings`, `synopsis`, cast, artwork, slug, `detailPath` and everything robots-relevant are untouched (parity tests: backend with the real read model, SSR bundle, Karma). Flag off, out of scope, killed, no TMDB identity, failed check, slow read, open breaker: the **same object** comes back.
- **Identity binding** (stricter than title similarity): the row's TMDB type and id must equal the page's; the row must come from a full TMDB fetch (`lastEnrichedAt`, not the catalogue's last-writer field); the page title's identity key must be one of the row's titles; years agree within ±1 where both exist; a page reached through the TMDB "first result" fallback (the slug did not name it) is refused (`slug_unbound`).
- **Metadata** (`metadata`): original title (only if different), runtime (only if the legacy payload has none; a programme's airing length is never replaced), genres (only if the legacy list is empty). Synopsis, cast and artwork are never offered: the legacy ones stay. `attribution` (TMDB notice + the row's TMDB freshness date) accompanies any TMDB fact shown.
- **Broadcasts** (`broadcasts`): 7 Madrid days from one indexed query (`program.tmdbId` + date, limit 40, `maxTimeMS` = the request timeout). An airing is kept only on **catalogue-row evidence** (same TMDB id, same title key, `program.mediaId` equal to the validated row). A title-only match is rejected (`no_catalogue_row`) and stays visible in the legacy list. Ended airings are dropped at read time; times carry the Madrid offset (CET/CEST, tested across 2026-10-25). An unreadable schedule **omits** `broadcasts` (nothing claimed); an empty one says `none`. Programme pages (`contentType: program`) keep their own now/next layout and get metadata only.
- **Provenance** stays internal: counters `attached`, `refused:<reason>`, `rejected:<reason>`, `skipped:<reason>`, `timeout`, `error` (`LegacyEnrichmentService.counters`); the public DTO carries no matching internals.
- **Safety**: 800 ms total budget (`Promise.race`, plus `maxTimeMS` on the schedule read), per-process breaker (5 consecutive failures → 60 s pause), `/content/batch` opts out (no per-card reads), no write path exists (tests give the catalogue a Proxy that throws on any method but `findByTmdbId`, and count every collection before/after).

## 3. Frontend

`catalog-detail.component.ts` (the legacy page) gains, only when `enrichment` is present:

- the shared `app-entity-broadcast-list` replaces the generic "Próximas emisiones" grid for movies/series (channel links, Madrid day/time with `<time datetime>` and zone in the accessible label, duration, relative time, empty and unreadable states); **any legacy airing the verified list does not contain is still rendered after it** (`scheduleView`), so nothing the page listed before disappears;
- original title under the `h1`; verified genres and runtime in the existing hero slots; TMDB notice footer;
- structured data: the same single `Movie` extended with `alternateName` and `publication` (`BroadcastEvent`s), never a second entity; `serializeJsonLd` escaping as in 3D.
- Meta title/description/robots/canonical are computed from the legacy payload as received (a Karma test compares them with and without enrichment).
- Pre-existing contrast defect fixed at the root while testing: the legacy airing-card call to action (`text-[var(--accent-live)]`) failed WCAG AA on the light surface (axe).

## 4. Flags and rollout

| Variable | Meaning |
|---|---|
| `CONTENT_LEGACY_ENRICHMENT_ENABLED=true` | master switch; anything else = off, payloads identical to before |
| `CONTENT_LEGACY_ENRICHMENT_SCOPE=/peliculas/a,/series/b` or `all` | the flag alone serves nothing; a list bounds the rollout (≤ 200 detail paths; any malformed entry disables the list); `all` must be written out |
| `CONTENT_LEGACY_ENRICHMENT_KILL=true` or `CONTENT_LEGACY_ENRICHMENT_KILL_FILE=<path>` | instant off (file re-checked every 5 s), no restart |

Independent of every `CONTENT_ENTITIES_*`, identity-write, public-read, canary and `EPG_YEAR_PROVENANCE` flag; needs no content collection (production has none) and creates none. A static test forbids any workflow from setting it.

**Mixed versions.** The API reports the rollout state in `X-Legacy-Enrichment-Epoch` on `/v2/health`; `ssr-server.mjs` polls it every 30 s and clears its rendered-page cache when it changes (tested: `ssr-cache.test.mjs`). nginx also caches SSR 200s for 5 minutes (`proxy_cache_valid 200 5m`) and cannot be told: after any switch, purge it (below).

**Rollout (owner-approved window only).**
1. Merge PR #48 then this PR; deploy with `deploy-artifact.yml` (§8).
2. `api.env`: `CONTENT_LEGACY_ENRICHMENT_ENABLED=true`, `CONTENT_LEGACY_ENRICHMENT_SCOPE=<3–5 film paths>`; restart `guiatv-api`. Check `curl -sI …/v2/health | grep -i epoch`, the film's `/v2/catalog/slug/movie/<slug>` (`enrichment` present, `airings` identical), the page's robots/canonical unchanged, then purge nginx: `sudo find /var/cache/nginx/guiatv -type f -delete` (or `rm -rf …/*`) and `nginx -s reload`.
3. Watch `refused:*` / `timeout` / `error` counters and p95 of `/catalog/slug` for a day; widen the list; `all` last.

**Rollback (no database step).** `touch` the kill file (or unset the flag and restart `guiatv-api`); within ~35 s the SSR cache clears itself; purge nginx. Nothing was written, so nothing is undone.

## 5. Tests

| Check | Result |
|---|---|
| Backend `npm test` (scratch MongoDB 8) | 608 tests: 607 pass, 1 skip (existing Redis skip), **0 fail** (the flake did not recur) |
| New backend: service rules, policy/epoch, DST, breaker/timeout, no-write proxy; real-read-model parity + zero-write count | pass |
| `SyncEPGData.icon-cache-deferred` flake | root cause: a wall-clock bound (`elapsed < serial/2`) on a scheduler-sensitive fetch pool. Now asserts the property itself: **peak in-flight fetches = 8** (and 16 fetches, one per channel). Deterministic; would fail at concurrency 1 |
| Frontend Karma | **310/310** (300 before; new: `legacy-enrichment.spec`, `catalog-detail.enrichment.spec`) |
| SSR (compiled bundle) | `legacy-enrichment-ssr.test.mjs`: status, robots header+meta, canonical, title, description identical with/without/unreadable enrichment; one `Movie`; hostile title inert; plus the 3D entity SSR tests |
| Playwright desktop + mobile (Windows, compiled SSR bundle) | **18 passed, 2 skipped by design** (mobile-only tests on desktop); includes the 4 new legacy specs ×2 projects: SEO surface equality, schedule/facts, empty/unreadable, axe wcag2a/aa/21aa light+dark, one column on mobile |
| Node SSR tests (compiled bundle) | 9/9 (`legacy-enrichment-ssr`, `entity-read-ssr`, `ssr-cache`) |
| Static workflow tests | `deploy.yml` manual-only, flag never set by a workflow |
| Deploy sandbox script | `scripts/test-deploy-script.sh`: passed |

## 6. Evidence: real versus fixture

**Real (production, public GETs only, 20 URLs paced 1.5 s, 2026-10-22; `phase-3e/live-evidence-20261022.json`):** 20/20 HTTP 200; 10 `index, follow` and 10 `noindex, follow`, exactly the split the airings rule predicts; 0/20 with genres, 0/20 with runtime; 10/20 with schedule rows (1–2 each, 2026-10-23); no `enrichment` key (production runs the pre-3D build, flags unset). The production database and the EPG 7-day window were **not** read.

**Fixture (3D inputs: committed TMDB checks + stored payloads, `phase-3e/film-before-after.{json,md}`, reproducible with `node apps/backend/dist/scripts/legacy-enrichment-report.js`):** through the real `LegacyEnrichmentService`, 20 films:

| | Before (legacy page) | After |
|---|---|---|
| Genres | 0/20 | 20/20 |
| Runtime | 0/20 | 20/20 |
| Original title (when it differs) | 0/20 | 15/20 |
| TMDB notice | 0/20 | 20/20 |
| Schedule rows | 13 (today/tomorrow) | 13 verified (the snapshot cannot show more) |
| Robots / synopsis / airings changed | | **0 / 0 / 0** |

Reading it honestly: the **metadata gain is real** (it corrects a measured gap on the real pages). The **schedule gain is not demonstrated**: the fixture can only reproduce the airings the legacy payload already listed, and the production 7-day window was not read, so "more broadcasts than today and tomorrow" is a property of the code, not a measured result. The 10 `noindex` films still have no schedule in the snapshot, so for them enrichment adds facts, not original value. TMDB synopsis length is not counted as value.

## 7. SEO and AdSense

Non-regression: canonical path, robots, meta title and description, sitemap membership, redirects, `airings` and synopsis are unchanged (tests above); no new URL, no sitemap entry; one `Movie` per page. **Not claimed:** no ranking effect and no AdSense compliance — technical tests prove no regression, not value. Value that can be argued: verified runtime/genres/original title, an accurate Madrid-time schedule with channel links on pages that have broadcasts. Structured data validated structurally and parsed from the real SSR HTML; not run through Google's Rich Results test.

## 8. Phase 3D integration and deployment

- PR #48: `verify` and `ssr-resilience` green, mergeable, open. This branch is stacked on it; merge #48 first.
- Flake: fixed (above); backend suite passes locally, §9.
- `deploy.yml` (builds **on the VPS**) now runs **only by `workflow_dispatch`**; a merge to `main` no longer starts it. The default path is `deploy-artifact.yml` (CI builds; the server verifies, unpacks, publishes, smoke-tests); both share `concurrency: deploy-prod` (no cancel) and the server takes its own lock. `RUNBOOK.md` and `workflows.test.mjs` say so. This reverses an auto-deploy trigger the owner never explicitly changed: revert one hunk if undesired.
- **Not merged, not deployed**: no operational authorisation for a production deploy was given in this session, and the artifact route needs root SSH to the VPS. With every flag unset the code is inert.

## 9. CI

PR #49: `verify` pass (6 m 0 s), `ssr-resilience` pass (2 m 29 s), `live-crawl` skipped by design. `graphify update` was not run (the CLI is not installed here).

## 10. Limits and next phase

1. The join is deterministic and labelled but not independent of the EPG's own TMDB match (`program.tmdbId` is set upstream); airing references (`entity_ref`) stay off.
2. Programme pages without a TMDB id get nothing; series pages get metadata and the schedule of the series id (episodes are not distinguished).
3. nginx's 5-minute SSR cache cannot be invalidated from the app.
4. Recommended next: owner-approved rollout of 3–5 indexable films (§4), measure `/catalog/slug` p95 and the counters, then Search Console impressions over 4–6 weeks; entity pages only for works with no legacy page.
