# Affiliate Engine — Operations Runbook

Companion to [`affiliate-engine-architecture.md`](./affiliate-engine-architecture.md) (the design
record). This document is the day-to-day how-to: adding commercial entities, wiring a new
placement, configuring secrets, testing, and reading the analytics.

## 1. Domain model recap

`AffiliateNetwork` (e.g. AWIN, Partnerize, direct) → `AffiliateMerchant` (a brand, e.g. Netflix) →
`AffiliateProgram` (one merchant's commercial deal with GuíaTV, in one market, through one
network — carries `allowedHosts`, `relationship`, `attribution.secretRef`) → `AffiliateOffer` (a
concrete plan/price under one program, category-scoped: `streaming`, `smart-tv`, `device`, ...).
`AffiliatePlacement` is a lookup row, not a lifecycle entity — it just says which surfaces a
placement key may appear on.

## 2. Adding a new network

1. Insert an `AffiliateNetwork` row (`slug`, `name`) — via the admin UI (`/admin` → Afiliación →
   Networks) or `IAffiliateNetworkRepository`.
2. If the network needs its own deep-link shape, add a strategy — see §5. Most networks fit the
   existing `network_redirect`/`tag_param`/`url_template` strategies without new code.
3. No central switch/case ever names a network — `DeepLinkStrategyRegistry` dispatches purely on
   `AffiliateOffer.destination.strategy`, so adding a network never touches the resolver.

## 3. Adding a new merchant

1. Admin UI → Afiliación → Merchants → New, or `IAffiliateMerchantRepository.create()`: `slug`
   (stable, lowercase, used to build legacy-compatible offer ids), `name`, `aliases` (free-text
   spellings users/chatbot might type — resolved case/accent/whitespace-insensitively by
   `findByAlias`, see `AffiliateMerchant.ts`).
2. A merchant only becomes usable once it has at least one active `AffiliateProgram`.

## 4. Adding a new offer

1. Ensure the merchant has an active `AffiliateProgram` in the target market.
2. Admin UI → Afiliación → Offers → New, or `IAffiliateOfferRepository.create()` /
   `upsertByMerchantProgramPlan()` for scripted/idempotent creation. Required: `category`,
   `plan`, `pricing`, `requirements`, `destination` (see §5), `status: 'active'`,
   `verification.status`.
3. `destination.url` (and any templated base) must be `https://` and match the owning program's
   `allowedHosts` — `isSafeAffiliateBaseUrl`/`isAllowedAffiliateDestination`
   (`AffiliateDestinationValidator.ts`) reject anything else at write time; the same gate runs
   again at resolve time on the *built* URL, so a bad secret or template can never slip through.
4. `recommendationIntents`/`placements` control where and for which intents the offer surfaces —
   they never affect ranking-by-commission (see §16, unchanged).

## 5. Creating a deep-link strategy

Adapters live in `apps/backend/src/infrastructure/affiliate/deeplink/`, implement the interface
in `types.ts`, and are registered by name in `DeepLinkStrategyRegistry.ts`
(`AffiliateOffer.destination.strategy` selects one — `direct_url`, `url_template`,
`network_redirect`, `tag_param`, or `api_generated`). A strategy receives
`{ offer, program, network, merchant, secret, clickId, context }` and returns `{ url,
relationship }`. Rules:

- Never hardcode a merchant/network name inside a strategy — a strategy is a *shape* (e.g. "append
  a tag query param"), reusable across any merchant that fits it.
- Never throw for a missing secret — return the offer's static `destination.url` instead (see
  `NetworkRedirectStrategy.ts` for the pattern); `AffiliateResolverService.resolveRedirect`
  degrades the same way if the adapter itself throws, so tracking failure never blocks navigation.
- The output URL is re-validated by `validateAffiliateDestination` regardless — a strategy cannot
  bypass the HTTPS/allowlist gate even if it tries to.

## 6. Configuring environment secrets

- One env var per program, referenced by `AffiliateProgram.attribution.secretRef` (e.g.
  `AFFILIATE_NETFLIX_URL`). Never commit a value — set it in the server's `.env`
  (`/var/www/guiatv/.env`, not in git) or the process manager's environment.
- A program with no configured secret (`secretRef` unset, or the env var absent) still resolves —
  `relationship` falls back to the program's `defaultRelationship`/`direct_commercial_link` and the
  offer's static `destination.url` is used. GuíaTV never blocks a user from finding where to watch
  something because a commercial deal isn't live yet.
- `AUTO_SEED_AFFILIATE_ENGINE=false` disables the auto-seed-on-empty-collection behavior (set this
  in CI/tests, never in production).

## 7. Adding a new placement

1. Admin UI → Afiliación → Placements → New, or `IAffiliatePlacementRepository.upsertByKey()`:
   `key` (canonical, e.g. `streaming-comparison`), `enabled`, optional legacy-key aliases.
2. Call the placement key from the frontend via `AffiliateService.resolveMany(context, options)`
   (`apps/frontend/src/app/services/affiliate.service.ts`) with `context.placement` set — see
   `where-to-watch.component.ts`, `football-match-card.component.ts`, or
   `blog-affiliate-block.component.ts` for the established call pattern.
3. A disabled or unknown placement key resolves to zero offers (impression path) or a
   `ValidationError` (redirect path) — never a 500, and never a client-supplied placement bypassing
   this check.

## 8. Testing affiliate flows

- Unit: `AffiliateResolverService.test.ts`, `AffiliateCatalogService` coverage, deep-link strategy
  tests, `MonetizationService.test.ts` (includes the Mongo-facade + static-fallback cases).
- Run just the affiliate suite: `npx tsx --test apps/backend/src/application/services/Affiliate*.test.ts apps/backend/src/application/services/MonetizationService.test.ts` from `apps/backend`.
- Manual live check (no test credentials required): `curl -X POST $API/v2/affiliate/resolve -d
  '{"context":{"placement":"catalog-detail","market":"ES"}}'` then follow one `outbound.path` with
  `curl -D -` and confirm a `302` to an allowlisted `https://` host with `Cache-Control: no-store`
  and `Referrer-Policy: no-referrer`.
- E2E (Playwright, when a Chromium binary is available in the environment — not always true on a
  headless server): the five flows in `affiliate-engine-architecture.md` §21, one per surface
  family.

## 9. Analytics events reference

Emitted by `AffiliateAnalyticsService` (`emit()` → `AnalyticsService.trackEvent`), stored with a
shared `clickId` correlating a click to its redirect:

| Event | Emitted by | When |
|---|---|---|
| `affiliate_impression` | frontend `affiliate-impression.directive.ts` → `POST /v2/affiliate/impression` | an offer set actually renders on screen |
| `affiliate_click` | `AffiliateResolverService.resolveRedirect` | a resolved redirect is about to be served |
| `affiliate_redirect` | `AffiliateResolverService.resolveRedirect` | same request, alongside `affiliate_click`, carrying `destinationHost`/`strategy` |
| `affiliate_error` | `AffiliateResolverService` (`trackError`) | offer not found/expired, market/placement mismatch, inactive program, or unsafe destination |

None of these ever carry a secret, an affiliate token, or a raw commissioned URL — only ids,
placement/market, `destinationHost` (not the full URL), and `clickId`. Tracking failure never
throws past the resolver — see the `try/catch` around every `trackEvent` call.

## 10. Commercial verification workflow

Each `AffiliateOffer`/`AffiliateProgram` carries `verification.status`
(`current`/`stale`/`needs_review`) and `verification.verifiedAt`/`source`. An offer older than the
120-day freshness window (`freshnessStatus` in `AffiliateMigrationService.ts`) should be
re-checked against its `sourceUrl` and re-saved via the admin UI (bumping `verifiedAt`) or the
migration script. `verification.status !== 'current'` never blocks resolution — it's a merchandising
signal (surfaced to admins, not hidden from users) that a price/plan needs a human to re-confirm
it, not a functional gate.
