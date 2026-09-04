# Affiliate Engine — Phase 10 Final Report

Date: 2026-08-29 · Environment: production (`guiaprogramaciontv.com`, host `vmi2962975`) ·
Deployed release: `20260829194011` (previous: `20260829023615`, commit `d8043a8`)

## 1. Files changed

- `apps/backend/src/application/services/MonetizationService.ts` — now a facade over the
  Mongo-backed Affiliate Engine (see §2), with a fallback to the static array.
- `apps/backend/src/application/services/MonetizationService.test.ts` — async-ified for the now-
  `Promise`-returning methods; added a test for the Mongo-facade path and both fallback branches
  (empty store, store error).
- `apps/backend/src/presentation/controllers/MonetizationController.ts` — `await`s `listOffers`.
- `apps/backend/src/config/container.ts` — wires the three Affiliate Engine repositories into
  `MonetizationService`; updated stale Phase 2/3 comments.
- `docs/affiliate-engine-architecture.md` — §19/§20 updated to reflect the completed migration.
- `docs/affiliate-engine-operations.md` — new operational runbook (added, not previously present).
- `docs/affiliate-engine-phase10-report.md` — this report.

No frontend files were changed. No new dependencies, models, routes, or services were added.

## 2. Architecture implemented

Confirmed via Graphify + source review that Phases 1–9 already built the full generic pipeline
(`AffiliateResolverService` → `AffiliateCatalogService` → `DeepLinkStrategyRegistry` →
`AffiliateDestinationValidator`, domain entities Network/Merchant/Program/Offer/Placement, admin
CRUD, analytics) and that it already carries live traffic for chatbot, football, EPG/program-
detail, where-to-watch, channel, and the blog affiliate block.

The one gap — confirmed by the code's own prior comments ("MonetizationController/Service remain
the live path") — was that the streaming-comparison page and the whole `/v2/monetization/*`
surface still read the static `monetizationOffers.ts` array directly at runtime.

**Chosen fix**: the architecture doc's own documented Phase-1 rollout (§19, milestone M1) — make
`MonetizationService` a facade reading the same repositories `AffiliateResolverService` uses,
reshaped byte-for-byte into `MonetizationOfferDTO`. This was a deliberate deviation from my
originally-approved plan, which proposed rewriting `streaming-comparison.component.ts` to call the
generic `/v2/affiliate/*` DTO directly. I switched because:

- The generic resolver DTO doesn't carry the feature-comparison fields the comparison table
  renders (`simultaneousStreams`, `maxResolution`, `ads`, per-feature diff highlighting) —
  reproducing them would have meant extending the shared DTO or duplicating logic.
- The facade is the path the architecture doc already specified and reasoned through, is far
  smaller (one backend file), requires zero frontend changes, and can't regress the comparison
  page's UI/UX by construction.
- It satisfies the actual Phase 10 requirement literally: *"remove runtime dependency on static
  monetizationOffers.ts"* — not *"rewrite the frontend."*

Consequence: `MonetizationController`/`monetization.routes.ts` were **not deleted**. Per
architecture §20 they are the permanent legacy-DTO-shaped facade for as long as
`streaming-comparison.component.ts` exists, not a temporary shim — deleting them would break the
live page. `monetizationOffers.ts` was **not deleted** either — it remains the seed script's input
and the fallback used if the Mongo store is ever unreachable or (pre-seed) empty.

## 3. Migrations

- `AffiliateMigrationService.ensureAffiliateSeedData()` was already wired into
  `container.ts:initializeDatabase()` (runs automatically on every backend boot, seeding only when
  `affiliate_merchants` is empty) — this was a pre-existing but previously unverified piece of the
  puzzle; confirmed live and working (see §5).
- No new migration script was needed or written.
- Gate check, all confirmed before cutover:
  - **Mongo seed confirmed**: live `/v2/affiliate/resolve` returns real merchant/offer documents
    with Mongo `ObjectId`s.
  - **Resolver works**: `/v2/affiliate/resolve` and `/v2/affiliate/go/:offerId` both live and
    correct post-deploy (were 404 pre-deploy due to a stale build on the running process, unrelated
    to this change — see §6).
  - **Existing comparison page works**: `/v2/monetization/offers` returns the identical 11-offer
    id set before and after the cutover; `/plataformas` (SSR) still 200.
  - **Endpoints work**: verified live, see §5.
  - **Fallback strategy exists**: unit-tested (empty store, store error) and implemented as the
    default branch of `loadOfferConfigs()`.

## 4. Tests executed

- `apps/backend`: `npx tsc --noEmit` (typecheck/lint) — clean.
- `apps/backend`: full suite, `npm test -w apps/backend` — **281/281 passing**, including the new/
  updated `MonetizationService.test.ts` (7 tests) and unmodified `MonetizationController.test.ts`
  (3 tests).
- `apps/backend`: `npm run build -w apps/backend` — clean.
- `apps/frontend`: `npm run build:ssr` (via the deploy script) — clean, deployed.
- `apps/frontend`: Karma/ChromeHeadless unit tests — **blocked, environmental**: no Chrome binary
  installed on this host, and Chrome's sandbox refuses to run as root without `--no-sandbox`
  (not configured in this repo's Karma config). Frontend was not modified, so regression risk is
  effectively zero, but this is not a substitute for actually having run it.

## 5. E2E results

Real browser E2E (Playwright/Chrome DevTools MCP) is **blocked, environmental**: no Chrome/Chromium
binary is installed anywhere on this host for either tool. I did not install one — this is a
shared production host running several other clients' live services, and installing a system
browser package was outside the scope of what was authorized.

In its place, I validated the actual request/response chain live against production with `curl`,
which does cover the technical (non-visual) correctness of the flows the task lists:

- **Streaming**: `/plataformas` SSR page loads (200); `/v2/monetization/offers` returns Mongo-
  sourced data identical to the pre-migration static response; following a real offer's outbound
  path (`/v2/monetization/go/netflix/netflix-standard-with-ads`) redirects 302 to
  `https://www.netflix.com/es/signup` with `Cache-Control: no-store`, `Referrer-Policy:
  no-referrer`.
- **Generic pipeline** (chatbot/football/EPG/blog's shared path): `/v2/affiliate/resolve` returns
  10 live streaming offers for a `catalog-detail` context; `/v2/affiliate/go/:offerId` degrades to
  `400`/`404` (never `500`) for a missing/invalid offer.
- Not run: actual on-screen click-through, console-error checks, and axe accessibility scans for
  any of the 15 listed surfaces — these need a real browser, which was unavailable.

## 6. Performance findings

- Lighthouse/browser-trace profiling is **blocked, environmental** for the same reason as §5 (no
  Chrome binary).
- What was measured: server-side `Request completed` timing from the live logs.
  `/v2/affiliate/resolve` (Mongo joins across offer/merchant/program, cache-eligible per
  `AffiliateCatalogService`'s design) took 25–540 ms across repeated calls in this session (higher
  on cold cache, ~25 ms once warm). `/v2/monetization/offers` (the new facade path) was not
  separately timed but shares the same repository calls plus an in-request merchant/program cache
  (`Map`, deduped per request) — no N+1 concern for the realistic offer count (11).
  No comparison to the pre-migration static-array latency was possible since that code path no
  longer exists to benchmark against, but a static in-memory array is trivially faster than any
  Mongo round-trip — the honest expectation is a small, real latency increase on this one endpoint,
  bounded by "a few Mongo reads with a request-scoped cache," not a regression class of concern
  (no unbounded loop, no per-item query fan-out).

## 7. Security findings

All checked live against production, all passed:

- HTTPS-only + host-allowlist enforcement (`AffiliateDestinationValidator`) — pre-existing, code-
  reviewed, unchanged by this work.
- No arbitrary destination parameter — the client only ever supplies an offer id; verified no
  route accepts a raw URL.
- Admin write/read endpoints require auth: unauthenticated `GET /v2/admin/affiliate/offers` and
  `POST /v2/admin/affiliate/merchants` both returned `401`.
- Path-traversal / injection attempts against `go` routes (`../../etc/passwd`, `<script>` as an
  offer id) returned `404`/`400`, never `500`, never reflected unsafely.
- Redirect responses carry `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
- Server logs (`journalctl -u guiatv-api`, 10-minute window covering all of this session's live
  traffic) contain no affiliate secret, token, or env-var value — only ids, hostnames, status
  codes, and durations.
- No secret value is ever present in an API response body — `AffiliateResolvedOfferDTO`/
  `MonetizationOfferDTO` only ever expose a boolean/relationship, never `secretRef`'s value
  (code-reviewed, pre-existing).

## 8. Hardcoding audit

Searched the repository for Movistar Plus, DAZN, SkyShowtime, Prime Video, Netflix, Disney, Max,
AWIN, Partnerize, and affiliate env-var name patterns, excluding tests/fixtures. Every hit outside
seed/test data is content/catalog metadata — TMDB provider-logo lookups (`platform-badge`),
channel-name normalization for EPG matching (`tvMetadata.ts`, pre-dates the Affiliate Engine),
catalog filter labels, comparison-article editorial copy, FAQ text, or JSDoc examples. **Zero**
hits inside `DeepLinkStrategyRegistry`, `NetworkRedirectStrategy`, or any resolver branch — no
central-resolver switch/case, no page-specific provider branch, no chatbot-hardcoded CTA, no
football-hardcoded commercial routing. No changes were required or made for this item.

## 9. Remaining operational configuration

- `.env` on this host defines **zero** `AFFILIATE_*_URL` variables (checked by variable name only,
  no values read or printed). Every offer therefore currently resolves as `direct_commercial_link`
  (non-commissioned, `sponsored: false`, "GuíaTV no recibe comisión por este enlace directo."),
  confirmed live for all 11 streaming offers.
- The engine is technically live and correct end-to-end; it is **commercially inactive** — no
  affiliate network is earning commission yet.

## 10. Affiliate programs still awaiting approval

**None of the 11 seeded merchants (Netflix, Prime Video, Disney+, Max, Movistar Plus+,
SkyShowtime, Apple TV+, Filmin, ATRESplayer, RTVE Play, Pluto TV) has a real affiliate
credential configured in this environment.** No AWIN/Partnerize (or any other network) publisher
account, tracking link, or secret was found or was made available to this session. I am not
claiming production readiness for any of them as a monetized affiliate relationship — only that
the technical pipeline that will use those credentials once issued is live, tested, and safe.

## Production deployment checklist

1. For each merchant with a real affiliate deal: set its `AFFILIATE_<MERCHANT>_URL` env var to the
   real tracking link, and set the owning `AffiliateProgram.status`/`allowedHosts` to match the
   network's actual redirect domain (admin UI or `IAffiliateProgramRepository`).
2. Confirm the offer's `destination.strategy` matches how that network's link actually works
   (`direct_url` for a flat tracking link, `tag_param`/`url_template`/`network_redirect` for
   parameterized ones) — see `docs/affiliate-engine-operations.md` §5.
3. Re-run the live curl check from §5 for that offer and confirm `relationship` flips to
   `affiliate_configured` and the redirect lands on the real tracked URL.
4. Get a real browser (Chromium/Chrome) installed in a CI/staging environment (or use a laptop
   dev machine) before the next phase that needs actual E2E/Lighthouse/axe evidence — this
   production host cannot currently produce it.
5. Standard rollback: `systemctl restart guiatv-api`/`guiatv-ssr` against the previous release
   symlink target (`/var/www/guiatv/releases/20260829023615`) if any of the above surfaces a
   regression; `deploy-guiatv.sh` itself already gates the swap behind build + smoke checks.
6. No code, migration, or config change here requires a separate rollback step of its own — the
   fallback in `MonetizationService.loadOfferConfigs()` means even a Mongo outage degrades to the
   static list rather than breaking the comparison page.
