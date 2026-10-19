# 03 — AdSense readiness ("Low value content") — 2026-10-19

**Decision (internal, not a prediction of Google's): NOT READY to request a re-review.** No compliance score is given; Google publishes none.

## Policy basis
AdSense Program policies (Behavioral → *Inventory value*, <https://support.google.com/adsense/answer/9335564>, fetched today): Google-served ads are not allowed on screens "without publisher-content or with low-value content", "under construction", or used for navigation/alerts. Google publishes no word-count or article-count minimum; none is assumed here. Google Search's spam policies on scaled content and "helpful, people-first content" are the companion criteria — not re-fetched this session, so cited only as the general framework.

## What GuíaTV contributes beyond third-party data (honest assessment)
- **Real utility, no ads needed [Observed]:** populated guide/channel pages (1,300–4,500 words of live schedule), current/next airing, day navigation, platform comparator (630 words), football hub. A visitor can answer "what is on now on La Sexta" without leaving.
- **Derived, not original:** programme/movie/series pages (286 in sitemap) are TMDB synopsis + EPG airings + related lists (211–850 words). Value = "when is it on Spanish TV and where to stream it", which is real but formulaic. Movies already `noindex` by `catalogRobotsPolicy` when thin (e.g. `/peliculas/el-caballero-oscuro`).
- **Original editorial:** the only place original judgement can live is `/editorial` — and it is the weakest part (below).

## Editorial corpus, measured today (50 public posts; `scripts/editorial-audit.mjs`)
| Metric | Result |
|---|---|
| Body < 250 words (the backend's own approval floor) | **10** (11 posts are 73–275 words; all `origin: human`, all "approved") |
| Non-human origin (`ai-assisted`) | **39** of 50; **23** contain no external source link |
| Raw Markdown (`**…**`, `<p>### …</p>`) visible to readers | **17** (+3 excerpts) |
| Auto-truncated SEO metadata (ends "…", description repeats title) | **17** |
| Featured image hot-linked from `auctorio.com` (no own copy / licence record) | **17** |
| No internal links | **17** |
| Near-duplicate structure (4-gram Jaccard ≥ 0.35) | **19** posts: a "hoy-en-tv / dónde ver / qué ver" cluster (10), a "mejores-{series,películas}-{max,prime,netflix}-españa" cluster (7) and 2 more |
| Time-bound titles not updated for > 45 days (La Vuelta 2026, Champions, "esta semana", "septiembre") | **14** |

**Discrepancy to resolve:** `docs/adsense/editorial-corpus-strengthening-2026-08-31.md` says the three curated guides were rewritten with a dated price table and sources. Production today serves `plataformas-streaming-mas-baratas` as a 908-character stub with no table (`modified 2026-08-31T08:48:18Z`, the same instant as the other 10 stubs). Either the rewrite never reached the production database or was overwritten (e.g. `npm run seed:editorial` with overwrite). Nothing in the repo proves which; check the DB history before trusting any "improved" claim.

Interpretation: length of the AI batch is fine (850–2,100 words) but it is unsourced, template-shaped, partly stale and visibly unedited; the human-labelled pieces are stubs. That combination is what a "low value" review looks for. Similarity scores are a flag, not proof of (un)originality.

## Remediation by URL class
| Class | URLs | Action | Why / constraint |
|---|---|---|---|
| Guide, channel pages, platform comparator, football hub | ~100 | **Retain**; fix T1 so they never render as error shells | genuine utility |
| Programme/movie/series | 286 | **Retain**; clamp metadata (done); keep thin ones `noindex` via existing policy; fix `/programas/deportes` | derived but useful |
| 10 human stubs (73–275 words) | 10 | **Improve substantially or `noindex`** — they sit on the target keywords ("series Netflix", "plataformas más baratas") and answer none | rewrite with dated prices from official pages |
| 17 unsourced AI posts with markdown/truncated meta | 17 | **Hold**: set `reviewState: in-review`, rewrite with sources or consolidate; do not delete before checking GSC clicks/backlinks | need editor + GSC |
| Near-duplicate clusters | 19 | **Consolidate** into 1 pillar per cluster (e.g. one "Qué ver hoy" hub that links to live pages; one "mejores series por plataforma" comparison) and 301 the rest | cannibalization; use the 301s only after checking traffic |
| Stale event posts (Vuelta, Champions 26-27 matchdays, "esta semana") | 14 | **Update or unpublish → 410**; evergreen ones get a dated "verificado el" line | freshness |
| 13 category pages (~125 words) | 13 | **Enrich or `noindex, follow`** and drop from the sitemap | listings |
| Account/admin/auth | — | already `noindex`; never place ads | policy |

Do not bulk-noindex: confirm per URL in GSC first (see 02).

## Trust & accountability
- Public: `/sobre-nosotros` (521 words, FAQ/Organization JSON-LD), `/avisolegal`, `/privacidad`, `/cookies`, `/terminos`, `/accesibilidad`, `/prensa`, `/developers`. Contact e-mails present (obfuscated by Cloudflare).
- **Gaps [Observed]:** (1) `/avisolegal` carries an internal note about the AdSense review and mixes an individual owner with "TecnoRia" (T11). (2) The "Equipo editorial" byline is a team label: no named editor, no editorial policy page (sourcing, corrections, AI-assistance disclosure, update dates). (3) AI-assisted origin is not disclosed to readers anywhere. (4) Affiliate disclosure exists in components (prior audit) but was not re-verified this session. (5) Consent/CMP for ads not audited (no ads are active; `ads.txt` and `google-adsense-account` meta are in place).

## Pre-review checklist (all unticked = state today)
- [ ] T1/T2 fixes deployed; `npm run seo:crawl` ⇒ 0 issues on production.
- [ ] `/avisolegal` and `/sobre-nosotros` consistent, no drafting notes; registry data if legally applicable (owner).
- [ ] Editorial policy page + named editor; AI-assistance disclosure.
- [ ] `npm run seo:editorial-audit` ⇒ 0 blocking findings (today: 33 posts block).
- [ ] No post under 250 words is indexable; no raw Markdown; every non-human post cites ≥ 1 external source and shows "verificado el".
- [ ] Clusters consolidated; stale event posts updated or 410.
- [ ] Ad placeholders gated by route state (never on error/empty/noindex pages).
- [ ] Wait for GSC to show the fixed URLs as indexed; then request review. **Approval is Google's decision.**
