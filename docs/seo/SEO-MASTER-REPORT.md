# GuíaTV — SEO master report (2026-10-19)

Detail: [01 technical](01-TECHNICAL-AUDIT.md) · [02 traffic](02-TRAFFIC-RECOVERY.md) · [03 AdSense](03-ADSENSE-READINESS.md) · [04 implementation](04-IMPLEMENTATION-REPORT.md) · [05 content](05-CONTENT-STRATEGY.md) · [06 Auctorio](06-AUCTORIO-INTEGRATION.md) · [07 validation](07-VALIDATION.md) · [skills](SKILL-INVENTORY.md)

## 1. Executive summary
- **Not ready for an AdSense re-review, and no ranking/traffic improvement is claimed.** Nothing here is deployed, committed, or measured in Search Console.
- Healthy base: SSR Angular 20, content in initial HTML, 432 of 453 sitemap URLs rendered correctly with clean canonicals/JSON-LD, correct 404s for unknown channels/programmes.
- Biggest technical defect found (P0): when an API call fails during SSR, pages were served as **cacheable, indexable 200s** (14 sitemap URLs failing continuously in production today, 5 more intermittently) or as **false 404s** for valid programme/movie pages. Fixed in code; the production *trigger* is unknown and needs server logs.
- Biggest content defect (P1): the editorial section — the only place original value can live — is 10 stub posts (73–275 words) plus 39 unsourced/templated AI-assisted posts with visible Markdown, truncated metadata, hot-linked images and near-duplicate clusters. The Aug-31 documents describe rewrites that production does not contain.
- Governance gap (P0/P1): Auctorio can approve and publish to GuíaTV under a bot reviewer identity. The GuíaTV gate now refuses it; ops must switch Auctorio to assisted mode.
- Traffic decline: cannot be dated or sized without GSC. A ready-to-use comparison tool and an exact data request are in 02.

## 2. Architecture discovered
Monorepo (Angular 20.3 SSR via custom Express wrapper, Express/Mongo/Valkey API, nginx + Cloudflare, GitHub Actions SSH deploy); Auctorio separate (Fastify/Prisma/BullMQ) posting drafts to `/v2/blog`. See 01.

## 3. Skills
claude-seo (9 skills) and marketingskills (8, prefixed `mk-`) installed project-scoped and git-ignored after manual review; hooks, sub-agents and the global installer deliberately skipped. Python runtime not set up; invocation needs a new session. Four repo scripts cover the same checks without dependencies. See SKILL-INVENTORY.

## 4–6. Findings (technical / traffic / AdSense)
See 01–03. Matrix below.

## 7. Implemented fixes
T1–T6 and the approval-policy hardening — files and verification in 04.

## 8–9. Content strategy and Auctorio
30 topic opportunities (qualitative, no fabricated volumes), 10 briefs, consolidation plan for the existing corpus (05). Auctorio already implements research→brief→draft→QA→approval→publish; the gaps are reviewer identity, rendered sources, image ownership (06).

## 10. Quality gates now machine-checkable
Approval policy (reviewer, sources, Markdown, ≥250 words, author, SEO fields, relevance), `seo-crawl`, `seo-ssr-resilience`, `editorial-audit`, `gsc-compare`; PR workflow `seo-regression.yml`.

## 11. Tests
Frontend Karma 254/254; backend 341 pass/0 fail/1 skipped; resilience check 7/7; builds OK. Not run: Playwright e2e, axe, Lighthouse/CWV, Rich Results Test, anything against a deployed build (07).

## 12. Operational cost
No paid API used. Recurring: none activated. Auctorio's text API is its existing paid dependency (capped per its budgets); weekly editorial/GSC work is human time. Optional future: claude-seo Python runtime (free, local), DataForSEO etc. **not** enabled.

## 13. Remaining risks
Unknown production trigger of T1 (may recur until fixed at source); un-sized traffic loss; stored editorial data still defective until edited; Auctorio autopilot config unseen; legal identity text; discrepancy between Aug-31 docs and production data; Cloudflare/nginx/SSR cache layers can pin a bad render for ≤ 10 min.

## 14. Pending external access / permissions
Deploy approval · server logs (`guiatv-ssr`, nginx) · GSC exports or service-account read access · Auctorio production config · owner decisions (legal entity, named editor, editorial policy) · `claude-seo setup` (download) · approval to enable any scheduled job.

## 15. Next actions
1. Review and commit the working tree; deploy; run the post-deploy checks in 07. 2. Pull server logs to find why `/canales` and 13 blog URLs fail in production. 3. Set `EDITORIAL_HUMAN_REVIEWERS`; put Auctorio in assisted mode. 4. Export GSC data → `gsc-compare` at each timeline date. 5. Editor pass: rewrite 10 stubs, source/consolidate the AI clusters, retire stale event posts. 6. Fix legal page + add editorial policy/named editor. 7. Remove legacy-route Disallows from robots.txt. 8. Only then reconsider an AdSense review.

## Issue priority matrix
| Pri | Issue | State |
|---|---|---|
| P0 | T1 SSR error states served as 200/404, cacheable | fixed in code, undeployed; prod trigger unknown |
| P0 | Bot identity can approve/publish AI content | policy fixed in code; ops config pending |
| P1 | Editorial stubs, unsourced/templated/stale AI posts, Markdown, truncated metadata, hot-linked images | audited; needs editor + deploy |
| P1 | Unknown editorial URLs 302 (soft 404) | fixed in code |
| P1 | Home title/description; 500-char descriptions | fixed in code |
| P1 | Legal notice drafting note / identity mismatch; no editorial policy or named editor | owner action |
| P1 | Traffic loss unquantified | blocked on GSC |
| P2 | Duplicate breadcrumb JSON-LD | fixed in code |
| P2 | `/programas/deportes` sitemap 404; 13 thin category pages in sitemap; robots Disallow on legacy redirects; home transfer-state weight; Docs/production discrepancy | open |
| P3 | `/deportes/futbol/partidos-hoy`, `/en-directo` thinness; blog post double breadcrumbs | open |
