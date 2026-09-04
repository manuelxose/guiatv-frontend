# Google AdSense final readiness review

Audited: 2026-08-31 (Europe/Madrid)  
Production target: <https://guiaprogramaciontv.com>  
Repository/worktree: `/var/www/guiatv`

## Remediation follow-up — deployed 2026-08-31

Release `20260831115951` closes the technical findings below in production:

- `/ads.txt` returns 200, `text/plain`, and the verified publisher record.
- The sitemap index contains only static, channel, resolvable programme, and approved editorial sitemaps. Provider-only streaming and football detail sitemaps are quarantined.
- Programme sitemap eligibility now uses the same TV read model, legacy slug format, indexed search tokens, and daily availability semantics as the public resolver. The original four stale programme URLs are absent. A new deterministic 42-URL production sample returned 42/42 HTTP 200.
- Public editorial output is 14 posts: 14 approved, 14 attributed, zero Auctorio. Eleven automated/no-author posts were moved to rejected drafts with a reversible migration backup.
- Direct `publish` writes are rejected. Approval requires an explicit quality gate, named reviewer, admin credential, independent editorial credential, and audit timestamps. Public reads and sitemap generation require both `publish` and `approved`.
- Sparse categories, provider-only movie/series pages, and football entity pages are excluded or `noindex`; private/account/admin routes are `noindex` and `no-store`.
- Legacy catalogue routes redirect to their canonical detail route or return a real 404.
- Placeholder identity claims (`B-12345678`, `Calle Ejemplo 123`, unverified company/registry claims) no longer appear in production.
- Owner-supplied identity update: Manuel Xosé Gonzalez Vietez, NIF `53198877S`, and domicile `Travesía de Espiñeiro 1, 55, España` are now reflected in the legal notice and privacy page. Registry details remain pending where legally applicable.
- `EDITORIAL_REVIEW_KEY` is configured in production. Approval remains explicit and gated; a smoke request with a nonexistent post reached the resource lookup (`404`) rather than the missing-key guard (`403`).

The original audit below is retained as the pre-remediation evidence snapshot. Its production-failure statements are historical.

### Current decision

**NO-GO pending registry details where legally applicable.** The owner has supplied the legal name Manuel Xosé Gonzalez Vietez, NIF `53198877S`, and domicile `Travesía de Espiñeiro 1, 55, España`; these are reflected in the legal pages. Any applicable registry details must still be supplied and verified. `EDITORIAL_REVIEW_KEY` is configured, so editors can approve new drafts through the explicit gated workflow; automated direct publication remains blocked.

## Original decision (pre-remediation snapshot)

**NO-GO — REMAINING BLOCKERS**

This is an internal engineering decision, not a prediction of Google's decision. Do not request an AdSense review yet.

## Executive summary

The site has a useful core without advertising: the current TV grid, populated channel schedules, programme airings, platform catalogue, and streaming comparator give visitors real utility. HTTPS/canonical-host handling and the single observed AdSense publisher ID are coherent.

The representative production sample does not pass an adversarial review, however:

- 5 of 42 sampled sitemap URLs returned 404 (11.9%). Four were randomly selected programme URLs.
- Six indexable 200 pages had fewer than 300 SSR main-content words; the worst were an empty channel (39), an empty trends state (118), a football match (82), and a football team (121).
- `/admin` and the `/mi-cuenta` → `/perfil` destination were 200 and indexable by default in production.
- `/pelicula-details/123` was an indexable legacy duplicate rather than a canonical redirect.
- Production `/ads.txt` was a real 404 with HTML MIME.
- 11 of 25 published articles (44%) had no author, used Auctorio-hosted images, and were mostly unrelated general-news material. Their timestamps show repeated approximately six-hour publishing intervals and one three-item cluster within four minutes.
- The content model and write path still permit `draft|publish` directly; no review state, reviewer, or editorial approval gate prevents automation from going straight to the published sitemap.
- The live legal notice exposes obvious placeholder identity data: `B-12345678` and `Calle Ejemplo 123`.
- Movie/series long-tail pages are competent metadata presentations but derive most of their value from TMDb/provider metadata, cast and related-item templates. They have not demonstrated enough site-specific value to approve all 936 streaming sitemap URLs as a class.

Safe technical defects were corrected in this worktree and tested, but those changes are not deployed and they do not solve the editorial, legal-identity, or scaled-originality blockers.

## Production sample methodology

The audit fetched the live sitemap index and all six child sitemaps, mapping 2,759 URLs: 25 static, 133 channel, 1,516 programme, 46 blog/category, 936 streaming, and 103 football URLs. It then tested 51 URLs spanning 23 route families. Forty-two were sitemap URLs and nine were private, malformed, internal, or legacy probes.

Random selections used deterministic PRNG seed `0xA5E53E`; they were selected from the live sitemap populations rather than from repository fixtures. Each URL was fetched with redirects followed and recorded for status, final URL, canonical, meta robots, X-Robots-Tag, sitemap membership, SSR `<main>`, approximate main-content words, JSON-LD types, expected indexability, actual indexability, and a quality tier. The complete per-URL records are in [`artifacts/adsense/final-readiness.json`](../../artifacts/adsense/final-readiness.json).

Rendered content checks used Firecrawl on core, sparse, editorial, programme, movie, series, football, admin, and trust pages. Playwright checked production at Pixel 7 and desktop viewports and ran axe. This is a representative sample, not a claim that all 2,759 URLs were rendered.

### URLs sampled by route family

- Home/directory/static guides: `/`, `/canales`, `/programacion-tv/que-ver-hoy`, `/programacion-tv/guia-canales`.
- Channels: `/canales/la_sexta`, `/canales/m_laligatv_3`; random `/canales/sx3_catalunya`, `/canales/cmm_tv`, `/canales/etb1_tv`, `/canales/aragontv_tv`.
- Random programmes: `/programas/guillaume-y-los-chicos-a-la-mesa`, `/programas/los-thunderman-infiltrados`, `/programas/el-amante`, `/programas/california-split`, `/programas/caso-cerrado-t3-e4`, `/programas/bosch`, `/programas/sonata-de-otono`, `/programas/equipo-danger`.
- Movies: popular `/peliculas/el-caballero-oscuro`; random `/peliculas/quien-es-carlitos`, `/peliculas/los-mercenarios`, `/peliculas/una-bonita-manana`, `/peliculas/contigo-todo`.
- Series: popular `/series/the-walking-dead`; random `/series/expediente-x`, `/series/el-mentalista`, `/series/la-costa-de-los-mosquitos`.
- Editorial: `/editorial/que-ver-hoy-en-tv-y-streaming`, `/editorial/plataformas-streaming-mas-baratas`, `/editorial/mejores-series-netflix`, random general-news slugs `/editorial/marruecos-pide-a-espana-que-devuelva-a-los-migrantes-supervivientes-y` and `/editorial/el-psoe-se-enzarza-con-el-pp-por-sus-bulos-y-feijoo-reta-a-sanchez`, plus `/editorial`, `/editorial/rankings`, and `/editorial/categoria/streaming`.
- Trends/streaming: `/tendencias`, `/plataformas`, `/comparador-streaming`.
- Football: `/deportes/futbol`, `/deportes/futbol/competiciones/premier-league`, `/deportes/futbol/partido/real-madrid-cf-malaga-cf-2026-08-30`, random `/deportes/futbol/equipos/le-mans-fc`.
- Private: `/admin`, `/mi-cuenta` (ending at `/perfil`), `/iniciar-sesion`.
- Legacy/internal/malformed: `/detalles/123`, `/pelicula-details/123`, `/program-full-details/123`, `/contenido/123`, `/peliculas/slug-que-no-existe-adsense-audit`, `/ruta-que-no-existe-adsense-audit`.
- Additional trust renders: `/sobre-nosotros`, `/avisolegal`, `/privacidad`.

## Ownership and ads.txt

### Ownership verification

- `http://guiaprogramaciontv.com` redirects to `https://guiaprogramaciontv.com`.
- `https://www.guiaprogramaciontv.com` redirects to the HTTPS apex host.
- Sampled canonicals consistently used `https://guiaprogramaciontv.com` except the expected final `/perfil` canonical after the account redirect.
- Production and repository searches found one publisher ID only: `ca-pub-9653385567378817`.
- `apps/frontend/src/index.html` exposes `google-adsense-account` for that account.

This confirms a coherent ownership mechanism; it does not establish account-side verification or policy approval.

### ads.txt result

**Production: fail.** `https://guiaprogramaciontv.com/ads.txt` returned HTTP 404, `text/html`, and the site's not-found document—so it was not a misleading 200 SPA fallback, but it was absent.

The worktree now builds a root `ads.txt` containing:

```text
google.com, pub-9653385567378817, DIRECT, f08c47fec0942fa0
```

The built asset was confirmed at `apps/frontend/dist/guiatv/browser/ads.txt`, and the local built server returned 200. Production must be checked again after deployment.

## Sitemap and indexability findings

**Production sitemap result: fail.** The index listed six child sitemaps and 2,759 URLs. Of the 42 sampled sitemap URLs, these returned 404:

- `https://guiaprogramaciontv.com/canales`
- `https://guiaprogramaciontv.com/programas/guillaume-y-los-chicos-a-la-mesa`
- `https://guiaprogramaciontv.com/programas/el-amante`
- `https://guiaprogramaciontv.com/programas/caso-cerrado-t3-e4`
- `https://guiaprogramaciontv.com/programas/sonata-de-otono`

The programme generator indexed yesterday/today/tomorrow while the slug resolver only searched today/tomorrow. The worktree aligns those windows. Channel sitemap generation now requires a current schedule, and an unresolved channel surface becomes a 404/noindex instead of an indexable empty page. `/canales` was added to the SSR server's known routes.

Private-route handling also failed in production: `/admin` and `/perfil` had neither meta nor header robots directives. The production SSR server now injects `X-Robots-Tag: noindex, follow`, a matching meta directive, and `Cache-Control: no-store` for private/auth/account routes. Local built-server checks passed.

Malformed catalogue and unknown routes generally returned proper 404/noindex. `/contenido/123` returned 404 but lacked an explicit robots directive in production; the worktree handles it as a noindex route. The legacy `/pelicula-details/123` returned 200/index with a self-canonical. The worktree redirects resolvable legacy movie IDs to the canonical `/peliculas/:slug` path; local `/pelicula-details/155` correctly returned 301 to `/peliculas/el-caballero-oscuro`.

One sitemap URL, `/programacion-tv/que-ver-hoy`, redirects to `?types=program,movie,series` before declaring the clean sitemap URL canonical. It is not a duplicate canonical, but publishing a redirecting sitemap URL is unnecessary and should be normalized.

## Content quality, originality, and completeness

### Core product utility

The populated guide and channel pages pass the “useful without ads” test. They expose current/next schedules, day navigation, and discovery data in the initial SSR response. The streaming hub and comparator also provide usable product surfaces. The home and guide pages had 2,120–5,639 approximate SSR main words in the HTTP capture; this count includes repeated programme cards and is not being used as a proxy for editorial quality.

### Thin and broken indexable inventory

Six 200/index pages had fewer than 300 SSR main words:

- `/canales/sx3_catalunya` — 39 words; rendered “Canal no disponible”.
- `/editorial/categoria/streaming` — 244 words.
- `/tendencias` — 118 HTTP-main words; the rendered core was only “Todavía no hay contenidos populares disponibles.”
- `/deportes/futbol/competiciones/premier-league` — 224 words.
- `/deportes/futbol/partido/real-madrid-cf-malaga-cf-2026-08-30` — 82 words.
- `/deportes/futbol/equipos/le-mans-fc` — 121 words.

The word threshold is only a discovery signal. These pages fail because the actual answer/utility is absent or consists almost entirely of provider facts, not merely because they are short. Empty states and provider-thin football entity pages must be noindexed/removed from sitemaps until they meet an explicit utility threshold.

### Editorial corpus

The production API returned 25 published posts. Eleven (44%) have no author and use `auctorio.com` featured images. Their topics include migration, party politics, weather, health administration, train procurement, and a personal “boñiga” story—material unrelated to the site's TV/streaming proposition. The Auctorio posts were published in obvious clusters: 2026-08-23/24 at roughly 04:00, 10:00, and 16:00 UTC, plus three posts on 2026-08-22 at 10:27, 10:29, and 10:31 UTC.

Rendered samples showed generic prose and visible markdown tokens (`**`, `###`). They had no visible author and weak sourcing. Length did not rescue them: the two sampled articles had approximately 870 words each but still failed relevance, provenance, and distinctive-value review.

The curated guide `/editorial/que-ver-hoy-en-tv-y-streaming` has an author and integrates current catalogue cards, but much of its editorial core is generic advice followed by “Siguiente paso recomendado”, “Dónde conseguirlo”, and an autogenerated FAQ. `/editorial/plataformas-streaming-mas-baratas` does not provide actual current prices or a genuine cheapest-platform comparison; it gives generic selection criteria and sends the visitor to the comparator. That fails the title's promise. Rankings require item-specific reasoning and verification dates, not just templated lists and FAQ expansion.

### External-data route families

- **EPG/IPTV:** valuable when it powers current schedules, time navigation, current/next state, and channel comparison. Empty channels and expired programme slugs are feed republication failures and should not be indexed.
- **TMDb/streaming providers:** sampled movie/series pages have synopsis, cast, metadata, related items and valid Movie/TVSeries JSON-LD. The long-tail page `/peliculas/quien-es-carlitos` was only about 426 HTTP-main words and mostly provider metadata. These pages are conditional, not approved as a 936-URL class, until GuíaTV-specific availability, current airings, comparison, or editorial selection is reliably present.
- **Football provider:** the hub has useful navigation, but sampled competition/team/match entity pages were largely scores, standings, and provider facts. Index only pages with substantive broadcaster/where-to-watch, match context, or independently useful analysis.

No exact sampled body hashes duplicated. That does not demonstrate originality: the material risk is near-duplicate template structure and provider-field substitution across large route families. A full-corpus similarity measurement was not available from the public sitemaps alone and remains an explicit pre-submission task.

## Trust and data-quality findings

`/sobre-nosotros` is substantial and identifies TecnoRia S.L., describes data sources, and publishes support/legal/press email addresses. It also says the editorial is “written by experts”, which conflicts with the 11 published no-author Auctorio posts.

The live `/avisolegal` is a P0 trust failure. It displays `B-12345678`, `Calle Ejemplo 123, 28001 Madrid`, and only a generic statement about registry registration. These are unmistakable placeholders. The audit did not replace them because the actual legal identity must come from an authorized owner. `/privacidad` exists and rendered, but all legal/privacy/cookie/terms data must be owner-verified as one set after the identity correction.

Pattern searches and sampled HTTP bodies did not reveal a systemic visible `undefined`, `null`, lorem, TODO, raw XML/JSON, or provider-support-URL leak. Generic shell text produced false-positive matches such as “No Data” and “todo”; those were manually discounted. Real bad states were the explicit empty trends/channel messages, missing descriptions/low-data entities, raw markdown in Auctorio articles, and repeated channel-icon 503s in the browser.

## AI and automation publishing pipeline

**Result: fail.** The repository has no defensible editorial gate:

- `apps/backend/src/infrastructure/database/models/BlogPost.model.ts` defines only `draft | publish`.
- `apps/backend/src/presentation/controllers/BlogController.ts` accepts a write payload with that status and can create/update a published record directly (admin-key protection is authorization, not editorial review).
- `apps/backend/src/presentation/controllers/SitemapController.ts` includes every record with `status: publish`.
- There is no required `origin`, `reviewState`, `reviewedBy`, review timestamp, or quality-gate result.

Therefore automation can still perform keyword/feed → generated record → `publish` → sitemap/index without an explicit human/editorial checkpoint. The production Auctorio pattern is evidence this is not merely theoretical. This audit did not invent an approval policy or retroactively approve/unpublish content; that requires an accountable editorial owner and a content decision.

## Monetization review

No AdSense placements were observed in the sampled rendered pages. The repository has reusable affiliate-disclosure components and applies them around several commercial blocks. The sampled editorial output nevertheless mixed “Dónde conseguirlo”/related-offer sections with generic editorial content, while the no-author corpus did not establish commercial/editorial provenance. Before ads are enabled:

- ad eligibility must be route/state based, not merely URL based;
- private, auth, admin, error, unresolved, empty and deliberately noindex pages must never receive ads;
- thin channel/football/trends states must not become ad containers;
- affiliate blocks must have visible disclosure adjacent to the commercial links;
- a page's primary answer must remain complete when all ad and affiliate components are removed.

## Browser experience

Production Playwright checks at 412 px showed no horizontal overflow on the home or TV guide page, and `<main>` was visible. Across sampled pages, axe found serious color-contrast failures and a repeated `landmark-contentinfo-is-top-level` issue; the about page also had a serious `link-in-text-block` result. Repeated channel-icon requests returned 503, including `la_1.webp`, `la_2.webp`, `cuatro.webp`, `antena_3.webp`, and `telecinco.webp`. These are P2 in isolation but reinforce the incomplete-production-state finding.

## Remediation performed during this audit

The following deterministic, review-independent fixes were implemented:

1. Added a root `ads.txt` build asset for the one verified publisher ID.
2. Changed programme sitemap generation from yesterday/today/tomorrow to the today/tomorrow window supported by slug lookup.
3. Filtered channel sitemap entries through the same consumer-visible TV read model used by channel pages; retained a raw-program compatibility fallback and added `canonicalChannelId` to its minimal projection.
4. Made an unresolved channel surface return 404/noindex.
5. Added `/canales` to known SSR routes.
6. Added production SSR noindex/no-store handling for private/auth/account routes and `/contenido`.
7. Restored X-Robots-Tag on cached SSR documents.
8. Redirected resolvable legacy catalogue routes to canonical detail paths and returned 404 for unresolved IDs.
9. Added regression tests for the programme window, channel sitemap eligibility, and unresolved channel behavior.

No production data was deleted or republished. No legal identity, authorship, or review approval was fabricated.

## Validation run

- Backend TypeScript build: passed.
- `SitemapController` targeted tests: 6/6 passed.
- `canal-completo` targeted Karma tests: 5/5 passed (two expected test-fixture image 404 warnings).
- Frontend production SSR build: passed. Existing SCSS budget and CommonJS dependency warnings remain.
- `node --check apps/frontend/scripts/ssr-server.mjs`: passed.
- Built asset check: `dist/guiatv/browser/ads.txt` contains the expected record.
- Local built-SSR smoke test: `/ads.txt` 200, `/canales` 200, `/admin` noindex/no-store, `/mi-cuenta` → `/perfil` noindex/no-store, `/pelicula-details/155` 301 to the canonical movie URL, invalid/internal routes 404.
- Production browser/axe check: completed; findings recorded above.

The frontend and backend builds ran in a worktree that already contained unrelated user changes to catalogue DTO/service/component files. Build success therefore validates the combined worktree, not only this audit patch.

## Remaining blockers

### P0 — must resolve before another readiness audit

1. **Replace and owner-verify legal identity.** Responsible URL: `/avisolegal`; corresponding legal components/content. Replace the fake CIF/address with accurate registered data, then verify privacy, cookies, terms, contact details and footer identity consistently.
2. **Stop direct automated publication.** Responsible services: `BlogPost.model.ts`, `BlogController.ts`, and blog sitemap generation. Add explicit origin and review states, named reviewer/audit timestamps, a server-enforced transition to publish, and a sitemap gate that only includes approved records.
3. **Quarantine and manually adjudicate the published corpus.** Responsible data: production `BlogPost` records. Remove/noindex unrelated, unsourced, no-author Auctorio items unless an accountable editor rewrites, sources, dates, and approves them. Do not bulk relabel automation as human-authored.

### P1 — required for GO

1. **Deploy and re-audit sitemap/index fixes.** Every sitemap URL must return a canonical 200 indexable page with adequate utility; run a full sitemap status/indexability crawl, not only this sample.
2. **Gate thin programme-generated routes.** Responsible families: empty channel, trends, football match/team/competition, sparse category, and weak movie/series entities. Use data/utility thresholds and remove/noindex failures; do not pad pages with prose.
3. **Establish distinctive long-tail value.** Responsible components/services: catalogue detail and football/channel surfaces backed by TMDb/EPG/football providers. Show current availability/airings, useful comparison or verified site-specific context on every indexable entity page.
4. **Repair editorial intent satisfaction.** Add actual dated price tables to “cheapest platforms”, item-specific ranking rationale, source/verification dates, and complete answers before affiliate detours.
5. **Deploy and verify ads.txt.** It must return 200, `text/plain`, the exact expected record, and no HTML fallback.
6. **Normalize the redirecting static sitemap URL** `/programacion-tv/que-ver-hoy`, or make the sitemap target return its canonical 200 directly.
7. **Measure template similarity across the full indexable corpus** and set a documented acceptance threshold; no full-corpus near-duplicate result was fabricated here.

### P2 — correct before launch if practical

1. Resolve repeated channel-icon 503 responses and add a stable local fallback.
2. Fix axe contrast, footer landmark nesting, duplicate-main error-state semantics, and the about-page text-link distinction.
3. Recheck mobile on representative long-tail, empty, error, affiliate, and consent states after deployment.

## Final manual AdSense resubmission checklist

- [ ] Authorized owner confirms the real legal name, tax/company identifier, registered address, registry details, and contact emails; production legal pages contain no examples/placeholders.
- [ ] Publishing schema and server transitions require explicit editorial approval; attempt an automation-to-publish bypass and prove it fails.
- [ ] Every currently published article has an accountable author/origin, sources where needed, verification date, appropriate topic relevance, and manual quality decision.
- [ ] A fresh full sitemap crawl has zero non-200 URLs, redirects, noindex URLs, empty states, or canonical mismatches.
- [ ] Random long-tail samples from every large route family pass the utility/originality rubric, including sparse movies, series, channels, programmes and football entities.
- [ ] Production `/ads.txt` returns 200 `text/plain` and exactly the intended publisher relationship.
- [ ] HTTP→HTTPS and www→apex redirects remain correct; only `ca-pub-9653385567378817` is present; account-side ownership is confirmed by an authorized operator.
- [ ] Admin/auth/account/private/error/empty/noindex routes are excluded from both ads and sitemaps.
- [ ] Affiliate disclosures are visible adjacent to commercial links and editorial answers remain complete without them.
- [ ] Channel icons and critical assets return successfully; mobile and axe regressions are rechecked.
- [ ] Re-run this representative random audit against the deployed release and obtain `GO — READY TO REQUEST ADSENSE REVIEW` before manually requesting review.
