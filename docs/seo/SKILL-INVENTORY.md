# Skill inventory (2026-10-19)

## Already present (reused, not reinstalled)
- Workspace: `.agents/skills` and `.claude/skills` (Angular, Playwright-adjacent, SQL, Prisma, docx/pdf/xlsx…), `AGENTS.md` (Graphify + Context Mode + Ponytail rules), `guiatv-frontend/graphify-out/` (dated 2026-09-10, not refreshed this session), `docs/skill-selection-report.md` (addyosmani agent-skills, Sep 2026).
- Auctorio repo has its own role-based agent notes (`auctorio/AGENTS.md`); no SEO skills there.
- Playwright: `@playwright/test` ^1.62 + `e2e/specs`; Chromium 1248 in `~/.cache/ms-playwright` (used as `CHROME_BIN` for Karma).
- Not present before this work: any SEO/marketing skill, GSC tooling in the repo (only `seo:submit-sitemap`, which submits, never reads).

## Installed now (project-scoped, git-ignored — `guiatv-frontend/.claude/skills/`)
Both sources were cloned to a scratch directory, read (SKILL.md, hooks, install.sh) and copied by hand. Neither upstream `install.sh` was executed (it writes to `~/.claude/` globally) and no remote script was piped to a shell. Nothing global was modified. MIT licensed both.

| Source | Commit | Skills installed | Why |
|---|---|---|---|
| [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) v2.4.x | `4b99de2` (2026-10-05) | `seo` (router + `scripts/`, `schema/`, `data/`), `seo-technical`, `seo-schema`, `seo-sitemap`, `seo-content`, `seo-page`, `seo-cluster`, `seo-content-brief`, `seo-google` | technical/indexability, schema, sitemap, content-quality, clustering, briefs, GSC |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `06d647e` (2026-10-19) | `mk-seo-audit`, `mk-content-strategy`, `mk-copywriting`, `mk-copy-editing`, `mk-programmatic-seo`, `mk-schema`, `mk-site-architecture`, `mk-analytics` (renamed with `mk-` prefix to avoid name clashes with claude-seo's `seo-schema`) | content strategy/copy/programmatic guardrails |

Deliberately **not** installed: claude-seo's `PostToolUse` schema-validation hook (executes Python on every Write/Edit), 19 sub-agents (parallel fan-out conflicts with the token budget), backlinks/DataForSEO/ecommerce/local/maps/image-gen skills (paid APIs or irrelevant), the remaining ~40 marketingskills (ads, CRO, email, pricing…).

## Verification status — be precise
- Files present and path tokens rewritten to the project path: **verified** (`ls`, `grep CLAUDE_PLUGIN_ROOT` leaves only the launcher's own internals).
- `scripts/claude-seo doctor` runs and reports **"setup required"**: its Python environment (`beautifulsoup4, lxml, playwright, weasyprint, google-ads…`) and a Chromium download are not installed. I did not run `setup` (large download; user-level cost/approval). The SKILL.md guidance works without it; the Python-backed checks (`sitemap_discovery.py`, GSC scripts) do not until `claude-seo setup` is run.
- **Invocation not verified**: skills are discovered at session start, so they can only be invoked from a *new* session opened in `guiatv-frontend/`. This session used the repo's own scripts instead.
- Replacement for the gap: dependency-free scripts written for this repo (below) cover crawl/indexability/metadata/JSON-LD, editorial gates and GSC comparison.

## Scripts added to the repo
| Script | Purpose |
|---|---|
| `scripts/seo-crawl.mjs` (`npm run seo:crawl`) | crawl every sitemap URL; fail on non-200, noindex-in-sitemap, canonical mismatch, missing title/description/h1, thin SSR, invalid JSON-LD |
| `scripts/seo-ssr-resilience.mjs` (`npm run seo:ssr-resilience`) | API down ⇒ routes must be 503 + no-store + noindex |
| `scripts/editorial-audit.mjs` (`npm run seo:editorial-audit`) | corpus gate: thin, unsourced, markdown leftovers, near-duplicates, stale, truncated metadata |
| `scripts/gsc-compare.mjs` (`npm run seo:gsc-compare`) | before/after comparison from a Search Console CSV export (+ git timeline) |

## Token/cost notes
No paid API, no sub-agents, no Lighthouse/PSI quota were used (PageSpeed Insights keyless returned HTTP 429). Production was read with ~600 GETs total; one local Karma run, one backend suite, three Angular production builds.
