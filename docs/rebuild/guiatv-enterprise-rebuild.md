# GuíaTV enterprise rebuild

Last updated: 2026-08-27. This is the concise execution ledger for milestones M0–M10.

## M0 — Discovery

Status: audited; implementation evidence is tracked below.

- Stack: Angular 20 standalone SSR frontend, Node/TypeScript/Express backend, MongoDB read models, npm workspaces.
- Baseline worktree: clean at start on `main` (`e02aaf6`). Existing production evidence reports backend and frontend builds passing, 108/108 frontend and 90/90 backend tests, full E2E green with one retry allowance, and no serious/critical axe findings.
- Existing visual authority: `design-system/guiatv/MASTER.md` plus semantic tokens in `apps/frontend/src/styles/design-tokens.scss`. The rebuild extends this identity; it does not create a parallel visual system.
- Channel pipeline: configured XMLTV feeds → parser → `SyncEPGData` → channel/program persistence and source snapshots → `TvReadModelBuilder` → `tv_read_airings` → TV read/surface services → Angular facades/views.
- Pay-TV source finding: the default primary and secondary feeds contain Spanish pay channels. The visibility failure is downstream, not primarily missing source data.
- Root causes found:
  - full-day reads are clamped to 5,000 airings and sorted by channel group/order;
  - `/read/channels` derives its directory from that bounded airing page;
  - the frontend day guide renders at most 960 airings in the browser and 240 in SSR;
  - one exclusive `channel.group` mixes distribution/provider with content category, so sports channels lose their Movistar/pay identity;
  - secondary feeds are fully ingested despite documentation describing fallback-only behavior, inflating and duplicating the model;
  - completeness gates track totals/TDT signals but not provider/pay coverage.
- Product gaps confirmed: no first-class channel catalogue route, mobile day guide still exposes the desktop matrix, comparator data is checked-in frontend data with no affiliate engine, async retry/error behavior is inconsistent, and the home football module is a generic CTA rather than live match data.
- Current baseline rerun: repository verification, lint and production builds pass; backend is 102/102 green. Frontend Karma is now portable through Playwright Chromium rather than an undeclared system Chrome dependency. Five historical review screenshots were overwritten by the pre-fix E2E run and remain visible as generated-artifact diffs.

## Decisions

- Model channel distribution, access, operator/provider, content facets, market, quality and EPG capabilities as orthogonal fields. Unknown remains explicit; no fabricated provider or affiliate data.
- Make the channel directory independent of airing pagination.
- Keep desktop timeline EPG and create a channel-centric mobile schedule mode.
- Centralize offers and outbound-link tracking before adding commercial CTAs.
- Preserve public URLs and SSR/indexable content while consolidating shared cards and states.

## M1/M4 delivered slices

- Canonical channel metadata now separates distribution, access, operator/providers, content facets, market, quality, capabilities and classification provenance.
- The channel directory is independently aggregated and has no global airing limit. Legacy rows receive a compatibility inference only when operational metadata is absent; the 5,002-channel regression case runs in tens of milliseconds rather than seconds.
- Provider/content filtering is overlap-aware: a Movistar sports channel remains discoverable in both Movistar and Deportes views.
- `/tv/read/schedule` groups and sorts airings per channel, applies server-side date/group/category/channel/search filters, supports up to 192 entries per channel, and reports any truncated channels explicitly. The guide now uses the backend's bounded 32-entry default rather than downloading up to 144 entries for every channel.
- Read-model rebuilding now treats the configured secondary XMLTV feed as fallback-only: it may enrich channels present in the primary or TDTChannels core, but cannot introduce hundreds of secondary-only channel variants. A regression test fixes that source policy before the next operational rebuild.
- The Angular day guide consumes the grouped schedule contract, uses a dedicated channel-centric mobile presentation, keeps the desktop timeline, applies local capability/type/region filters, and exposes a retryable error state without discarding filters. Browser validation recovered from three forced 503 responses on the fourth request.
- `/canales` is now an SSR-compatible, indexable channel catalogue with canonical detail links, name/alias/operator search, group and free/pay filters, current/next schedule context, complete loading/empty/error states and responsive keyboard-accessible cards. It is linked from the TV guide and included in navigation and both sitemap sources.
- CI now runs frontend lint/tests, Karma resolves the Playwright Chromium binary, and review screenshots default to test-owned output directories unless an explicit baseline-update flag is set.

## M2/M3/M5 delivered slices

- `ChannelCard` is the canonical current/next/access channel primitive, with context-aware heading levels. `UnifiedAsyncState` now provides consistent accessible empty/error treatments and retry actions across the channel catalogue, TV guide, home and catalogue detail.
- The home is backed by bounded real sources: 4 TDT + 4 pay-channel summaries, 8 movies, 8 series and live/today football highlights. Mobile channel discovery is a snap rail; desktop is a four-column grid. Real-browser checks at 1440 and 390 px found zero page overflow or console errors.
- The channel endpoint accepts an optional, capped compact-surface limit while its default remains complete; the 5,002-channel regression still verifies no default global limit.
- Catalogue detail now labels movie/series/programme explicitly, separates streaming/rent/buy messaging from linear broadcasts, links each airing to its canonical channel, uses shared skeleton/empty states, and emits BreadcrumbList JSON-LD alongside Movie/TVSeries schemas. A real programme exposed 13 canonical channel links; a real movie exposed Movie + BreadcrumbList schemas.
- Channel detail now retains and presents canonical access, distribution, providers, content facets and quality metadata, reuses `ChannelCard` for related discovery, exposes accessible live progress, uses shared loading/error/empty states and replaces the incorrect Antena 3 image fallback with neutral channel initials. It no longer labels the first programme as current when no live airing exists. Programme CTAs use the stable `program:<airingId>` catalogue route instead of unreliable title slugs; LA 1 opened the canonical Mañaneros 360 detail successfully. The channel surface now hydrates its identity from the complete canonical directory rather than the compact airing row; its contract regression and the full 106-test backend suite pass. Real-browser checks for LA 1 and AMC at 1440 and 390 px found the correct free/pay metadata, four related channels, complete schedule access, zero overflow, no visible broken images and no console errors. A forced 503 recovered on retry.

## M6 delivered slices

- The editorial landing now has a clear lead story, latest-post list, topic navigation, three concise guide recommendations, ordered rankings, trend coverage and deduplicated category families. Cine/Películas is treated as one discovery family and a multi-category story cannot repeat across category sections.
- Rankings now use a single semantic ordered list with visible ordinals, a stronger lead entry and meaningful thematic filters; the technical Rankings taxonomy is excluded from the filter rail. Category archives reserve their featured and ranking stories from the remaining archive, eliminating repeated editorial items across modules.
- Editorial list and detail failures now propagate to consistent shared error states instead of becoming false empty content. Landing and article retries recover in place without losing the current URL; category archives use the same loading and recovery primitives.
- Article detail preserves optional backend author metadata, emits a Person author in Article JSON-LD when present, distinguishes materially updated dates, constrains rich figures, responsive embeds and tables, and keeps a readable 48rem measure. Long articles receive stable heading anchors and a responsive table of contents. The related-card grid now has a zero-minimum main track and encapsulated 16:10 media, fixing a mobile intrinsic-width expansion from 2,352px to 340px.
- Real-browser checks at 1440, 768 and 390 px cover the landing, rankings, a populated category archive and a real rich article. The surfaces have no horizontal overflow, duplicate promoted stories or console errors. Forced landing, rankings and article API failures recover through their visible Retry actions without changing the URL.

## M7 delivered slices

- A backend-owned Provider/Plan/Offer contract now normalizes pricing, annual pricing, promotions, activation fees, trial, screens, resolution, downloads, ads, live content, sport, football, movies, series, family, bundles, devices, permanence and fibre/mobile requirements for 11 Spanish services. Verification provenance and freshness remain explicit; prices without a current official public source are shown as “Consulta proveedor”, never guessed.
- `GET /v2/monetization/offers` provides bounded market, intent, feature, maximum-price and sort filters. Recommendation scoring is based on user value and capabilities; regression coverage proves that configuring an affiliate destination cannot change ranking.
- Commercial relationships are explicitly classified as configured affiliate, direct commercial link, unavailable, unknown or requiring manual agreement. Optional affiliate destinations live in server environment configuration, must be HTTPS and match a provider allowlist, and fall back to the official direct destination when absent or unsafe. No affiliate identifiers were invented.
- `GET /v2/monetization/go/:providerId/:offerId` is the only outbound path exposed to the UI. It validates placement, returns a non-cacheable/no-referrer 302, records only minimal attribution and continues the redirect if analytics storage is unavailable. Sponsored relation and disclosure are emitted only for a valid configured affiliate.
- The comparator now loads the normalized API, filters and sorts server-side, selects up to three offers, highlights differing rows, exposes verification and commercial disclosure, and uses internal tracked links. Loading, empty and failure states are explicit; retry restores the result without changing the URL.
- Real-browser checks covered selection limits, intent reload, internal CTA shape, retry after a forced 503, console errors, WCAG A/AA automation and horizontal overflow at 1440 plus 320/360/375/390/412/430 px. The page has no document overflow; the wide comparison table remains independently scrollable on mobile. Backend and frontend suites pass at 115/115 and 138/138, with both production builds green.

## M8 delivered slices

- The global search uses the real cross-domain discovery contract and groups results into TV programmes and streaming films/series. Empty result families are omitted, and keyboard traversal follows the same grouped order presented visually.
- Suggestions retain canonical detail destinations and the complete-results action preserves the query through the unified guide URL state. The search remains one responsive shell affordance rather than competing desktop/mobile implementations.
- The channel catalogue is a first-class TV destination at `/canales`, discoverable from global and contextual navigation, with provider/name search, access and group filters, canonical channel detail links and mobile-safe information architecture.
- Focused component regressions now protect result grouping, keyboard order and canonical detail navigation. Existing navigation E2E coverage protects channel-catalogue discovery, responsive shell behavior and the single-search-affordance contract; the frontend suite is green at 140/140.

## M9 delivered slices

- Playwright now starts an isolated backend from the current worktree on port 4310 and proxies same-origin `/v2` and `/storage` traffic through the Angular server. Scheduled jobs are disabled only in this test process; browser security remains enabled. This removes stale shared-backend and CORS false positives.
- The serialized browser gate covers 48 journeys. The complete run passed 46 and exposed two data/latency-sensitive cases; both corrected cases pass on focused rerun. The responsive overflow matrix covers 11 critical routes across nine viewports.
- The day guide request is bounded to 32 programmes per channel, avoiding the observed ~24 MB response generated by the former 144-entry request. Its unit contract and mobile/desktop browser journey pass.
- A tracked TMDB bearer credential was removed from frontend configuration. Runtime dependencies were upgraded to patched Nodemailer 9.0.5 and Sharp 0.35.4; production audit reports no high or critical vulnerabilities. Three moderate `uuid` findings remain transitively through `gaxios`/`node-cron`; npm's proposed complete fix requires the breaking node-cron 4 migration.
- Current gates: backend 115/115, frontend 140/140, repository lint with zero errors (existing warning backlog retained), and backend plus Angular SSR production builds green. The known non-blocking build warnings remain the 148.22 kB channel-detail stylesheet budget and two Socket.IO CommonJS dependencies.

## M10 release-readiness slices

- The historical legacy-component list was rechecked against the current graph and source references. Thirteen listed components are already absent; `CatalogRail`, `CatalogCard`, `ProgramList` and `Banner` remain actively consumed and were not deleted. The custom Sharp declaration removed in M9 was the only newly proven orphan. Non-streaming assistant methods and date helpers also retain real consumers.
- `publish-release` now rejects path-like or malformed release IDs, unknown options and invalid retention values. `npm run check:release` provides a non-destructive artifact/fingerprint preflight; it completed with status `ready` without creating a release or changing the active symlink.
- Deployment smoke commands now have bounded HTTP timeouts, and readiness waits require an actual 2xx response rather than treating any non-zero HTTP status as healthy.
- The active production release remains `20260825175541`; both systemd services are active and canonical discovery plus the guide route return 200. Read-only checks also exposed SSR render timeouts and one 36.7 s uncached night-guide API read while the scheduled EPG sync was running. This operational latency must be observed during a staged deployment.
- No release was published, symlink changed, service restarted or production data mutated during M10 preparation. Rollback instructions and quantitative triggers are recorded in `docs/release-workflow.md`.
- After explicit approval, the EPG sync, precompute and cleanup cron callbacks were moved to isolated Node child processes with per-job overlap guards. A regression suite covers process isolation, overlap suppression and failure recovery. The backend test glob was also quoted after the new shallow test exposed shell expansion that had silently reduced the suite; the real complete backend gate is 118/118.
- Unified release `20260827124645` was built, published and activated successfully. Public API/SSR smokes passed; authenticated discovery/user and Socket.IO smokes were skipped because `SMOKE_AUTH_TOKEN` was not configured. During an explicitly triggered EPG sync parsing feeds up to 47.7 MB, health remained at 10 ms, home SSR at 17 ms, guide SSR at 14 ms and an uncached night read at 1.11 s, versus the pre-fix 36.7 s read and SSR timeouts. All four primary date slices completed; the manual validation was then stopped before saving the long-running secondary enrichment batch, avoiding redundant load before the regular 18:00 isolated run.

## Milestones

| Milestone | State | Gate |
| --- | --- | --- |
| M0 discovery/baseline | Complete | architecture, product/data audit, current checks |
| M1 channel/data foundation | Code complete; backfill pending | provider-aware directory and tested read contract |
| M2 design system | In progress | canonical cards/states/tokens, responsive checks |
| M3 home | Complete | real now/soon/tonight/film/series/sport/channel/editorial discovery |
| M4 TV guide | Complete | complete desktop timeline + dedicated mobile mode + retry |
| M5 content/channel details | In progress | complete metadata, schedule and related discovery |
| M6 editorial | Complete | hierarchy, taxonomy, rich content and related modules |
| M7 comparator/affiliate | Complete | normalized offers, real comparison, safe tracked links |
| M8 search/navigation | Complete | grouped cross-domain results and channel catalogue IA |
| M9 quality | Complete | current-code security, performance, build/test, E2E and responsive visual gates |
| M10 production | Complete; deployed | dead-code audit, isolated maintenance jobs, immutable release and production smoke evidence |

## External limitations known so far

- Affiliate identifiers or commercial agreements not already configured cannot be invented.
- A programme poster absent from all legal/current sources remains unavailable; channel artwork is an explicit fallback, not a claimed poster.
