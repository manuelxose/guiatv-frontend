# Affiliate Engine — Phase 1 Architecture

Status: proposed, not implemented. Scope: architecture + migration plan only, per phase-1 mandate.

## 0. Method note (Graphify mapping)

Graph queried (`graphify-out/graph.json`, 8114 nodes, built at `e02aaf6c`) instead of a full repo scan:

- `MonetizationService` → service, controller, DTOs, config data, container wiring, tests (52 nodes).
- `AnalyticsService` (+ click/redirect symbols) → backend `AnalyticsService`, `IAnalyticsRepository`, frontend `analytics.service.ts`, `AnalyticsController` (103 nodes, truncated).
- `streaming comparison / WhereToWatch / content detail` → `StreamingComparisonComponent`, `WhereToWatchComponent`, `content-page.component.ts`, `catalog-detail.component.ts`, `TvDataFacade` (765 nodes, truncated).
- `chatbot + monetization` → `ChatbotRecommend*`, `chat-recommendation-list.component.ts`, `ChatbotRecommendation` interface — **no existing edge to Monetization**.
- `football + monetization` → football models/components — **no existing edge to Monetization**.
- `BlogPost + editorial + monetization` → `BlogPost.model.ts`, `EditorialService`, `BlogController` — **no existing edge to Monetization**.
- `container.ts` registration graph → confirms DI pattern (`registerServices`, `registerControllers`, dynamic `import()`, `this.dependencies.set(...)`).

Followed by direct reads of the small, decisive files (`MonetizationService.ts`, `MonetizationDTO.ts`, `monetizationOffers.ts`, `MonetizationController.ts`, `monetization.routes.ts`, `AnalyticsService.ts`, frontend `monetization.service.ts`) plus a targeted grep confirming **`streaming-comparison.component.ts` is the only frontend consumer** of the monetization API today. No unrelated files were opened; no secrets were read (env var *names* like `AFFILIATE_NETFLIX_URL` appear in code, values were not accessed).

---

## 1. Current monetization architecture

```
apps/frontend/.../streaming-comparison.component.ts
        │ (only caller)
        ▼
apps/frontend/.../services/monetization.service.ts   (Angular HttpClient wrapper)
        │  GET /v2/monetization/offers?market=ES&intent=&features=&sort=
        │  <a [href]="buildOutboundUrl(offer.outbound.path, 'comparison-card')">
        ▼
MonetizationController.getOffers / .go   (presentation/controllers)
        ▼
MonetizationService                       (application/services)
   - listOffers(query): filters + sorts MONETIZATION_OFFERS (in-memory array)
   - resolveOutbound(providerId, offerId, placement): validates placement against
     a hardcoded `Set(['comparison-card','comparison-table','comparison-selection',
     'content-detail','provider-summary'])`, resolves either env-var affiliate URL
     or a static destinationUrl, host-allowlist-checks it
   - trackAndResolveOutbound(...): same + fires `affiliate_click` via AnalyticsService
        ▼
monetizationOffers.ts   — MONETIZATION_OFFERS: MonetizationOfferConfig[]
   (10 hardcoded provider/plan objects; provider id/name, plan, pricing, features,
    destinationUrl, allowedHosts, affiliateEnvKey, defaultRelationship, verifiedAt)
        ▼
AnalyticsService → IAnalyticsRepository → MongoAnalyticsRepository | ValkeyAnalyticsRepository
   (generic session/event store, swappable via ANALYTICS_STORE env var — already
    provider-agnostic and reusable as-is)
```

Route surface: `GET /v2/monetization/offers`, `GET /v2/monetization/go/:providerId/:offerId?placement=`.

Redirect response sets `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, 302 to `destinationUrl`. Client never sees or builds the raw affiliate URL — it only knows the `outbound.path` returned by the API and appends `?placement=`. That contract is correct today and should be preserved unchanged.

---

## 2. Current weaknesses

1. **Zero persistence** — `MONETIZATION_OFFERS` is a hardcoded TS array. Adding/editing/pausing an offer requires a code deploy; no admin surface, no audit trail, no per-market variants.
2. **No network/program layer** — network (AWIN, Amazon Associates, direct) and merchant identity are flattened into a single offer object; there is no way to represent "one merchant, several programs across networks/markets."
3. **No alias resolution** — a provider is matched only by the exact `provider.id` string baked into the offer. "Movistar+", "M+", "Movistar Plus" have no canonical resolution path; every new surface that wants to reference a provider must know the exact id.
4. **Placement allowlist is a code-level `Set`** in `MonetizationService.ts` (`comparison-card`, `comparison-table`, `comparison-selection`, `content-detail`, `provider-summary`) — adding EPG, football, blog, or chatbot placements means editing service code, not configuration.
5. **Single consumer** — despite `content-detail` and `provider-summary` already being valid placement strings, grep confirms only `streaming-comparison.component.ts` actually calls the API. EPG, channel pages, catalog detail, where-to-watch, search, chatbot, football, blog have no monetization wiring at all today.
6. **Category-locked domain model** — `MonetizationOfferDTO.features` (sports/football/movies/family/4K, fibreRequired, mobileRequired) is streaming-TV shaped. It cannot represent a Smart TV, a ticket, or a device without abusing those fields.
7. **No verification workflow** — `verifiedAt`/`sourceUrl`/`verificationStatus` are static fields set by hand in the same file as the business logic; there is no review/approval state machine.
8. **No impression tracking** — only `affiliate_click` exists; there is no `affiliate_impression` or `affiliate_error` event, so CTR and error-rate cannot be computed.
9. **Commission is absent from the model entirely** — which is safe today (nothing to leak into ranking) but also means there is no structured place to add it later without risking exactly the coupling the brief warns against.

---

## 3. Components to preserve as-is

- **Outbound redirect contract**: client holds only a relative `path`, server resolves and redirects. Keep verbatim.
- **`AnalyticsService` + `IAnalyticsRepository` + Mongo/Valkey dual backing** — already generic, already event-shaped (`AnalyticsEventRecord` with `type`, `name`, `path`, `data`), already swappable via `ANALYTICS_STORE`. The new affiliate events are additional `type`s through the *same* pipeline, not a new pipeline.
- **DI container pattern** (`container.ts`: dynamic `import()`, `registerServices()`, `registerControllers()`, `this.dependencies.set(key, instance)`) — new services/controllers register the same way.
- **`successResponse()` / `ApiResponse` envelope**, `ValidationError`/`NotFoundError` shared error types, `asyncHandler` route wrapper — reuse unchanged.
- **Security posture on redirect**: `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, https-only + host-allowlist check before redirecting. Carry this forward as the resolver's non-negotiable last step regardless of which adapter produced the URL.
- **`MonetizationOfferDTO` field shape** for streaming plans specifically — it's a good *streaming offer* shape; it becomes one category profile inside the generic Offer model, not something to discard.

## 4. Components to refactor

- `monetizationOffers.ts` static array → becomes seed/fallback data feeding a Mongo-backed `AffiliateOffer` collection (migration path in §19).
- The `PLACEMENTS` hardcoded `Set` in `MonetizationService.ts` → becomes a `Placement` config collection/enum resolved by the resolver, extensible without code changes to the service.
- `MonetizationService.resolveOutbound` (provider/offer lookup + destination selection in one method) → split into resolver stages (context → candidates → provider match → active program → deeplink strategy → tracking) per the required resolver flow.
- Provider identity, currently just `{ id, name }` embedded in each offer → becomes a first-class `AffiliateMerchant` with aliases, and offers reference it by id.
- `MonetizationController`/`monetization.routes.ts` naming → generalized to an `AffiliateController`/`affiliate.routes.ts` that also serves the legacy `/v2/monetization/*` paths during migration (see §20).

---

## 5. Proposed domain model

Five entities, each independently useful, composing into the resolver:

```
AffiliateNetwork  1───n  AffiliateProgram  n───1  AffiliateMerchant
                              │
                              │ 1
                              ▼ n
                        AffiliateOffer  n───n  AffiliatePlacementRule
```

### AffiliateNetwork
`id, slug, displayName, status(active|paused), trackingType(url_template|redirect_endpoint|tag_param|api), supportedMarkets[], attributionWindowDays?, metadata{}`. No credentials here (see §17).

### AffiliateMerchant
`id, slug, canonicalKey, displayName, aliases[] (lowercased, accent-stripped), logoUrl?, category(streaming|smart-tv|device|ticketing|event|...), supportedMarkets[], officialUrl, networkIds[], status`. `aliases` is what resolves "Movistar+"/"M+"/"Movistar Plus" → one `canonicalKey`.

### AffiliateProgram
`id, merchantId, networkId, market, externalProgramId?, status(active|inactive|pending), allowedHosts[], disclosure, commission{ type, value, currency, notes } (commercial metadata only), attribution{ cookieDays?, clickIdParam? }, verification{ source, verifiedAt, reviewStatus(pending|approved|needs_review) }`.

### AffiliateOffer
`id, merchantId, programId, market, category, plan{id,name}, pricing{...same shape MonetizationOfferDTO.pricing already has}, features{} (category-specific, see §5a), destination{ strategy, template|url, params{} }, active, validFrom, validUntil?, verification{...same as program or offer-level override}, recommendationIntents[]`.

### AffiliatePlacement (config, not a domain entity with lifecycle — a lookup table)
`key, page, description, active`. Seeded with every value already named in the brief (`home`, `epg-program-card`, `epg-program-detail`, `channel-page`, `catalog-card`, `catalog-detail`, `where-to-watch`, `search-result`, `chatbot-answer`, `football-match`, `football-competition`, `football-home`, `blog-inline`, `blog-footer`, `streaming-comparison`, `provider-summary`) plus the 5 legacy placement strings mapped 1:1 (`comparison-card`→`streaming-comparison`, etc., see §20).

### 5a. Category feature profiles

Rather than one flat `features` object trying to serve TV plans, Smart TVs, and tickets, `AffiliateOffer.features` is `Record<string, unknown>` validated against a **category schema** (`streaming-plan`, `smart-tv`, `device`, `ticket`) picked by `category`. The existing `MonetizationOfferDTO.features` shape becomes the `streaming-plan` schema, migrated verbatim — no behavior change for existing offers.

---

## 6. Mongo collections

Following the existing `*.model.ts` / mongoose `Schema` + `collection:` + compound-index convention (`UserContentInteraction.model.ts` as the template):

| Collection | Model file | Key indexes |
|---|---|---|
| `affiliate_networks` | `AffiliateNetwork.model.ts` | `{slug:1}` unique |
| `affiliate_merchants` | `AffiliateMerchant.model.ts` | `{slug:1}` unique, `{canonicalKey:1}` unique, `{aliases:1}` |
| `affiliate_programs` | `AffiliateProgram.model.ts` | `{merchantId:1,networkId:1,market:1}` unique, `{status:1}` |
| `affiliate_offers` | `AffiliateOffer.model.ts` | `{merchantId:1,active:1}`, `{category:1,market:1,active:1}`, `{recommendationIntents:1}` |
| `affiliate_placements` | `AffiliatePlacement.model.ts` | `{key:1}` unique |

Analytics events reuse the **existing** `analytics_events` collection (`AnalyticsEvent.model.ts`) with new `type` values — no new collection needed for click/impression tracking, consistent with "preserve existing analytics infra."

No collection stores network/program credentials (§17).

---

## 7. Repository interfaces

New, under `apps/backend/src/domain/repositories/`, matching the existing `I*Repository.ts` interface convention:

- `IAffiliateNetworkRepository` — `findBySlug`, `list(filter)`.
- `IAffiliateMerchantRepository` — `findBySlug`, `findByAlias(text)` (normalize + match against `aliases`), `list(filter)`.
- `IAffiliateProgramRepository` — `findActiveForMerchant(merchantId, market)`, `list(filter)`.
- `IAffiliateOfferRepository` — `findCandidates({ category?, market, intents?, merchantIds? })`, `findByMerchantAndOffer(merchantId, offerId)`.
- `IAffiliatePlacementRepository` — `findByKey(key)`, `listActive()`.

Each gets one `Mongo*Repository` implementation in `infrastructure/repositories/`, same pattern as `MongoAnalyticsRepository`. No Valkey variant needed initially (low write volume, admin-edited data) — cache reads instead (§18).

---

## 8. Services

- **`AffiliateCatalogService`** — replaces the offer-listing half of `MonetizationService` (`listOffers`-equivalent): queries `IAffiliateOfferRepository` + `IAffiliateMerchantRepository`, applies category feature filters, sorts by the *existing* neutral comparator (`priceForSort` / `intentScore`, ported unchanged — commission never enters this path, per §5/§17 non-negotiable).
- **`AffiliateResolverService`** — the new generic resolver (§9). Owns provider-alias matching, active-program selection, placement validation against `affiliate_placements`, deeplink adapter dispatch (§ Deep Link Strategy in the brief), and the final host-allowlist + https check ported from `MonetizationService.isAllowedDestination`.
- **`AffiliateAnalyticsService`** — thin wrapper over the existing `AnalyticsService.trackEvent`, adding the four typed events (`affiliate_impression`, `affiliate_click`, `affiliate_redirect`, `affiliate_error`) with a shared payload shape (§ Analytics). Not a new pipeline.
- **`MonetizationService`** — kept as a thin backwards-compatible facade during migration (§19/§20), internally delegating to `AffiliateCatalogService` + `AffiliateResolverService`.

Deeplink strategies live as adapters, not branches inside the resolver:

```
apps/backend/src/infrastructure/affiliate/deeplink/
  DirectUrlStrategy.ts        (today's destinationUrl fallback)
  UrlTemplateStrategy.ts      (query-param / path-template substitution)
  NetworkRedirectStrategy.ts  (AWIN/Partnerize-style network redirect endpoint)
  AmazonTagStrategy.ts        (tag= param appended to a canonical Amazon URL)
  ApiGeneratedStrategy.ts     (future: call out to a network API for a one-off link)
```
`AffiliateProgram.networkId` → `AffiliateNetwork.trackingType` selects the strategy; adding a network never touches `AffiliateResolverService`.

---

## 9. Resolver flow

```
AffiliateContext (placement, pageType, contentType, contentId, providerHint?, market, …)
        │
        ▼
1. Candidate lookup      IAffiliateOfferRepository.findCandidates({category, market, intents})
        │
        ▼
2. Provider matching     IAffiliateMerchantRepository.findByAlias(providerHint) → canonical merchantId
        │                (skip if candidates already carry merchantId, e.g. EPG channel → known provider)
        ▼
3. Active program        IAffiliateProgramRepository.findActiveForMerchant(merchantId, market)
        │                → 404/NotFoundError if none active (never silently show a dead offer)
        ▼
4. Placement check       IAffiliatePlacementRepository.findByKey(context.placement) must be active
        │
        ▼
5. Deeplink strategy     pick adapter by program.network.trackingType, build destination URL
        │
        ▼
6. Safety gate           https-only + allowedHosts check (ported verbatim from MonetizationService)
        │
        ▼
7. Tracking              AffiliateAnalyticsService.trackClick/trackRedirect (fire-and-forget, never
        │                blocks the redirect — same try/catch-and-log pattern as today)
        ▼
8. Outbound redirect     302, Cache-Control: no-store, Referrer-Policy: no-referrer
```
Steps 1–4 are also exactly what powers `affiliate_impression` (the offer card rendering) without step 5–8 — the same candidate/program/placement pipeline serves both "what do I render" and "where does the click go."

---

## 10. Routing / API changes

New generic surface, additive (nothing removed yet):

```
GET  /v2/affiliate/offers?category=&market=&intent=&placement=&contentId=&contentType=
GET  /v2/affiliate/go/:merchantId/:offerId?placement=&contentId=&contentType=
POST /v2/affiliate/impression        (batched impression beacon, sendBeacon-friendly)
```
`/v2/monetization/offers` and `/v2/monetization/go/:providerId/:offerId` remain mounted, implemented by the compatibility facade (§20), until every frontend caller migrates.

---

## 11. Frontend integration points

- One shared Angular `AffiliateOfferCardComponent` + `AffiliateService` (Angular) replacing the page-specific ad-hoc rendering in `streaming-comparison.component.ts`, reusable by any placement.
- `AffiliateContext` built at the point of use (e.g. `content-page.component.ts` supplies `contentType`/`contentId`; `epg-grid.component.ts` supplies `channelId`/`programId`) and passed down, never constructed inside the shared component from route params implicitly — keeps context explicit and testable.
- Client continues to only ever hold `outbound.path` + placement, exactly as today — no new client-side URL construction capability is introduced.
- Rollout order matches the milestone plan (§22): keep `streaming-comparison.component.ts` on the legacy path until milestone 2 proves the new resolver, then cut it over first (it's the one real caller today), then add the net-new placements.

---

## 12. Chatbot integration

Graphify found **no existing edge** between `ChatbotRecommend*`/`ChatbotRecommendation` and `MonetizationService` — this is genuinely new wiring, not a refactor. `chat-recommendation-list.component.ts` renders `RecommendationGroup`/`ChatbotRecommendation` items; when a recommendation names a watchable title, the backend recommend use-case (`ChatbotRecommend.ts`) attaches a `contentId`/`contentType` the same way `content-page.component.ts` already does, and the frontend list component asks `AffiliateService` for a `chatbot-answer`-placement offer keyed off that context. Recommendation ranking inside the chatbot is untouched — the affiliate lookup is a read *after* ranking, never an input to it (§ Recommendation Neutrality).

## 13. Football integration

Also no existing edge to monetization. `football.models.ts` / match & competition detail components gain `football-match` / `football-competition` / `football-home` placements the same way: the component already knows `matchId`/`competitionId`/`teamIds` (present in `AffiliateContext`), and looks up offers whose `category` matches (e.g. sports-streaming plans with `features.football === true`, or future `ticket` category for `Ticketmaster`-style ticketing offers) filtered by that context. No football-specific branch in the resolver — category + context filtering handles it generically.

## 14. EPG integration

`epg-grid.component.ts` / channel pages know `channelId` and (for a given `Program`) which `Channel` it airs on. Channel → provider is **not** currently modeled as an affiliate relationship (Channels are broadcast metadata, not merchants). Two safe options, decided at implementation time, not here: (a) `AffiliateMerchant` gains an optional `channelIds[]` back-reference for channels that map 1:1 to a merchant (e.g. a Movistar Plus+ channel), or (b) EPG placements resolve purely by category/intent context with no channel-to-merchant claim. Either way, `epg-program-card`/`epg-program-detail` are ordinary placements through the same resolver — no EPG-specific service.

## 15. Blog integration

No existing edge either. `EditorialService`/`BlogController`/`post-detail.component.ts` gain `blog-inline`/`blog-footer` placements. Editorial posts already can reference content (`EditorialPost` model) — the same `contentId`/`contentType` context threading applies; a post with no content reference simply passes `category`/`market` only and gets category-general offers (e.g. "best streaming deals this month").

---

## 16. Analytics strategy

Four event types through the existing `AnalyticsService.trackEvent` → `IAnalyticsRepository` pipeline (Mongo or Valkey, unchanged):

| Event | When | Payload (`AnalyticsEventRecord.data`) |
|---|---|---|
| `affiliate_impression` | offer/placement rendered client-side (batched, `POST /v2/affiliate/impression`) | `merchantId, programId, offerId, placement, contentType?, contentId?, page` |
| `affiliate_click` | user activates the outbound link (existing event, kept) | same + `relationship` |
| `affiliate_redirect` | server actually issues the 302 (distinguishes "clicked" from "successfully redirected") | `merchantId, offerId, placement, destinationHost, strategy` |
| `affiliate_error` | resolver fails (`NotFoundError`/`ValidationError`/unsafe destination) | `merchantId?, offerId?, placement, reason` (no stack traces, no PII) |

All events carry `anonId`/`sessionId` (already anonymous per `AnalyticsEventRecord`), a `clickId` (`randomUUID()`, ported from today's `trackAndResolveOutbound`), and `occurredAt`. No user id, no raw affiliate URL, no query-string secrets are ever stored — only `destinationHost`, matching current behavior (`new URL(...).hostname`, not the full URL).

## 17. Security model

- **No affiliate/network credentials in Mongo, ever.** `AffiliateProgram`/`AffiliateNetwork` store an `envKey`/`secretRef` *name* (string), exactly like today's `affiliateEnvKey: 'AFFILIATE_NETFLIX_URL'` pattern — the value is read from `process.env` (or the platform's secret manager) at resolve time only, never persisted, never logged, never returned in an API response.
- Destination safety check (https + `allowedHosts` allowlist) is mandatory on **every** strategy output, ported verbatim from `MonetizationService.isAllowedDestination` — an adapter cannot bypass it.
- Placement and merchant/program **active** checks happen server-side only; a disabled program must 404, not redirect to a stale/expired URL.
- Redirect response keeps `Cache-Control: no-store` + `Referrer-Policy: no-referrer`.
- Admin write endpoints (creating/editing networks/merchants/programs/offers) require the existing admin auth guard used elsewhere in the backend (`AdminController` pattern) — out of scope to design in Phase 1, called out as a Milestone-3 dependency.
- No secrets were read or printed while producing this document.

## 18. Caching strategy

- `AffiliateCatalogService.findCandidates` results are cacheable per `(category, market, intents, placement)` key with a short TTL (minutes, not hours — offers can be paused) using the existing `ICacheRepository`/Valkey pattern already used elsewhere in the backend (e.g. `AIAnalyticsService` uses `cacheRepository`).
- `AffiliateMerchant` alias resolution is small and near-static — safe to cache aggressively (hours) and bust on admin write.
- `AffiliateResolverService.resolveOutbound` itself is **not** cached — must always re-check active state and re-read the env-backed URL, same as today.

## 19. Migration path from `monetizationOffers.ts` — COMPLETE (Phase 10)

1. ~~Write a one-time seed script~~ Done: `scripts/seed-affiliate-offers.ts` + `ensureAffiliateSeedData()` (auto-runs on `initializeDatabase()` whenever `affiliate_merchants` is empty; opt out with `AUTO_SEED_AFFILIATE_ENGINE=false`). Reads `MONETIZATION_OFFERS` and creates one `AffiliateMerchant`/`AffiliateNetwork`/`AffiliateProgram`/`AffiliateOffer` per entry, verbatim.
2. `monetizationOffers.ts` stays in the repo — now **only** the seed script's input and the test fixture/last-resort fallback (see below). No runtime code path reads it directly for a live request anymore.
3. **Done**: `MonetizationService` (`apps/backend/src/application/services/MonetizationService.ts`) is now the facade described here. `listOffers()`/`resolveOutbound()` read `AffiliateOffer`/`AffiliateMerchant`/`AffiliateProgram` via the same repositories `AffiliateResolverService` uses (wired in `container.ts`), reshape the result into `MonetizationOfferDTO` (id reconstructed as `${merchant.slug}-${offer.plan.id}`, matching the original static ids exactly), and fall back to the static `MONETIZATION_OFFERS` array only if the Mongo read throws or returns zero streaming offers (e.g. before the first seed run) — a redirect or the comparison page can never hard-fail on this. `MonetizationController` and the frontend `monetization.service.ts` required zero changes.

Verified live in production (2026-08-29): `/v2/monetization/offers` returns the identical 11-offer id set before and after the cutover; `streaming-comparison` page unchanged; `/v2/affiliate/resolve`/`/v2/affiliate/go/:offerId` live and returning the same underlying Mongo data.

## 20. Backwards compatibility

- `/v2/monetization/offers` and `/v2/monetization/go/:providerId/:offerId` keep working unchanged (facade above) for as long as `streaming-comparison.component.ts` and any external references to them exist. They are **not deleted** — deleting them would drop the only route that page calls; they are correctly the permanent legacy-DTO-shaped facade, not a temporary shim.
- The five legacy placement strings map 1:1 to new placement keys (`comparison-card`→`streaming-comparison`, `comparison-table`→`streaming-comparison`, `comparison-selection`→`streaming-comparison`, `content-detail`→`catalog-detail`, `provider-summary`→`provider-summary`) inside the facade, so old query strings resolve correctly against the new `affiliate_placements` table.
- `MonetizationOfferDTO` response shape is preserved byte-for-byte by the facade. The frontend can migrate to the generic `/v2/affiliate/*` surface later (it would need the resolver DTO extended with the feature-comparison fields the comparison table renders — out of scope here since the actual Phase 10 gate, killing the static-array runtime dependency, doesn't require it); at that point the legacy routes can be deprecated (not deleted) per the repo's stated deprecation practice.

## 21. Tests required

- Unit: `AffiliateMerchant` alias-resolution (`findByAlias`) — case/accent/whitespace variants of "Movistar+".
- Unit: resolver step-order (candidate → provider match → active program → placement → strategy → safety gate), including each failure branch (`NotFoundError` on no active program, `ValidationError` on inactive placement, rejection on disallowed host) — mirrors the existing `MonetizationService.test.ts` / `MonetizationController.test.ts` structure.
- Unit: each deeplink strategy in isolation (template substitution, Amazon tag param, network redirect URL shape).
- Integration: legacy `/v2/monetization/*` routes still return identical shapes post-facade (snapshot against current `MonetizationService.test.ts` fixtures).
- Integration: new `/v2/affiliate/*` routes for at least one placement per surface family (EPG, catalog, chatbot, football, blog).
- Analytics: all four event types are recorded with the correct `data` shape and no PII/secret leakage (assert on stored document, not just "no throw").
- E2E (Playwright, per repo convention): streaming-comparison page still redirects correctly end-to-end after migration to the new resolver.

## 22. Rollout plan (independently verifiable milestones)

1. **M0 — Domain + collections, no traffic.** Add models, repositories, seed script, unit tests for merchant/alias/program/offer CRUD. Nothing routes through this yet. Verifiable: seed script populates Mongo from `monetizationOffers.ts` and unit tests pass.
2. **M1 — Resolver behind the existing facade.** `MonetizationService` delegates to `AffiliateCatalogService`/`AffiliateResolverService`; legacy routes unchanged externally. Verifiable: existing `MonetizationService.test.ts`/`MonetizationController.test.ts` pass unmodified against the new implementation; `streaming-comparison` page unchanged in Playwright.
3. **M2 — Generic `/v2/affiliate/*` routes + placement table live**, still only `streaming-comparison`-equivalent category wired for real traffic. Verifiable: new routes tested, old routes untouched.
4. **M3 — Analytics expansion**: add `affiliate_impression`/`affiliate_redirect`/`affiliate_error` events; admin auth gate on write endpoints (dependency called out in §17). Verifiable: analytics tests pass; no write endpoint reachable unauthenticated.
5. **M4 — First new surface**: pick one (recommend catalog-detail or where-to-watch, since `TvDataFacade`/`content-page.component.ts` already carry `contentId`/`contentType`) and wire it end-to-end. Verifiable: E2E test + real impression/click events observed in the analytics store.
6. **M5+ — Remaining surfaces** (EPG, chatbot, football, blog, home), each its own milestone, each independently shippable and revertible since they only add placement rows + a frontend call site, never touch the resolver core.

Each milestone ships with lint/typecheck/test/build green per repo `Definition of done`, and failures classified as introduced/pre-existing/environmental before merge.

---

## Definition of Done — Phase 1 checklist

- [x] Graphify mapping performed (subgraphs listed in §0), no full-repo dump.
- [x] Current monetization flow read and understood from source (§1).
- [x] Proposed architecture is additive/compatible with existing `MonetizationService`, `AnalyticsService`, DI container, error/response conventions (§3, §19, §20).
- [x] No provider-specific branches required anywhere in the resolver (network/strategy selection is data-driven, §8–9).
- [x] Migration strategy defined (§19–20).
- [x] Security and analytics implications documented (§16–17).
- [x] Implementation milestones explicit and independently verifiable (§22).
- [x] No secrets read or exposed.

**Stopping here per Phase 1 scope. No implementation code has been written.**
