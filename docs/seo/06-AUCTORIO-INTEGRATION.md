# 06 — Auctorio integration (2026-10-19)

Auctorio = `/workspace/auctorio` (Fastify + Prisma + BullMQ + Angular studio-web, commit `d39fe01`). Studied: `docs/auctorio-seo-engine-architecture.md`, `prisma/schema.prisma`, `src/studio/{publishers,automation-mode,quality-gate}.ts`, `scripts/live-guiatv-contract.ts`, `.env.example`. **Nothing in Auctorio was modified.**

## What already exists (reuse, don't rebuild)
| Requested step | Existing implementation |
|---|---|
| Research / source verification | Site-intelligence crawler (sitemap + SSRF-safe crawl), source registry, evidence whitelist for plans; relevance score 0–100 (threshold 45) with off-topic lexicon |
| Topic selection / brief | Editorial plan V2 (schema-validated briefs, cannibalization classifier `none…high`, near-duplicate token overlap ≥ 0.75) |
| Draft | Evidence-grounded generation (DeepSeek-compatible text API, configured in production), structured-output retries |
| SEO / QA | QA V2 explainable score; autonomous gate (overall ≥ 90, evidence ≥ 85, 0 warnings, hero image, no placeholders, source grounding for factual, no critical cannibalization) |
| States | `ProjectStatus: draft → ai_generated → qa_failed/qa_passed → in_review → approved → publish_queued → published / publish_failed`; `PublicationStatus: queued → processing → draft_synced → published / failed / canceled` |
| Approval | Version approve; `AutomationMode manual / assisted / autopilot` (autopilot = auto-approve + auto-schedule + auto-publish) |
| Publishing | `GuiaTvPublisher` → `POST/PUT /v2/blog` with `x-admin-key`; refuses publish without image, accountable author, SEO metadata; approval via `x-editorial-review-key` + `x-editorial-reviewer`; live contract test `npm run test:live:guiatv` (creates/deletes a draft) |
| GuíaTV side | `BlogPost.status draft|publish`, `reviewState unreviewed|in-review|approved|rejected`, `origin`, public filter `{publish, approved}` used by API and sitemap; approval policy (`EditorialReviewPolicy`) |

Mapping to the requested machine: `researching`=plan generating/ready · `drafted`=ai_generated · `verified`=qa_passed · `editorial_review`=in_review (+ GuíaTV `in-review`) · `approved`=approved + GuíaTV `approved` · `scheduled`=publish_queued · `published`=published; rejected/revision-required = `qa_failed`, `rejected`. **No new state machine is needed.**

## Findings
1. **[Observed + inferred] The "independent human review" in GuíaTV can be a bot.** Auctorio's approval call sends `AUCTORIO_EDITORIAL_REVIEWER` (the example env uses `auctorio-quality-gate`), and in `autopilot` mode it approves and publishes by itself. 17 `ai-assisted` posts appeared on 2026-09-01/02 in bursts, 23 AI posts have no source, 17 show raw Markdown and auto-truncated metadata, and 17 hot-link images from `auctorio.com`. I cannot see Auctorio's production mode/config; the pattern is consistent with autopilot publication but **not proven**. This conflicts with the project rule "no automatic public publishing without explicit authorization" and with the 2026-08-31 claim of a named-reviewer gate.
2. **The GuíaTV gate checked form, not substance.** Word floor 250, author, SEO fields, entertainment keyword; nothing about sources, Markdown, or reviewer identity.
3. **The Auctorio autonomous gate's "source grounding" did not result in visible sources**: published HTML has no outbound links for 23 non-human posts. Either grounding is internal (evidence not rendered) or not enforced for these content types.
4. Images are served from `auctorio.com` URLs (third-party hosting from the site's perspective; no licence/attribution field).

## Implemented in GuíaTV (backend, tested)
`apps/backend/src/application/services/EditorialReviewPolicy.ts` (+ tests, 7 pass):
- **Reviewer must be an accountable person:** refuses names matching `auctorio|quality-gate`; if `EDITORIAL_HUMAN_REVIEWERS` (comma list) is set, only listed people may approve. Without that env var the built-in refusal still stops the known bot identity.
- **Sources:** approval of `origin != human` requires ≥ 1 external `<a href="https://…">`.
- **Markdown leftovers** (`**x**`, `<p>### …`) block approval.
- Existing rules kept (title, excerpt, ≥ 250 words, author, SEO fields, TV/streaming relevance, reviewer present, `publish` only through approval, public filter `{publish, approved}`).

**Effect once deployed:** Auctorio's approval call with the bot reviewer returns a validation error; its publication stays at GuíaTV `draft` (Auctorio `draft_synced`/`failed`). That is the intended safe failure. Already-published posts are untouched.

## Required operator steps (not done — need owner/ops)
1. Set `EDITORIAL_HUMAN_REVIEWERS` in `/etc/guiatv/api.env` (names/e-mails of real editors).
2. In Auctorio set the GuíaTV site to **`assisted`** (or `manual`) mode; unset `AUCTORIO_EDITORIAL_REVIEW_KEY`/`AUCTORIO_EDITORIAL_REVIEWER` so it cannot approve. Humans approve via the existing admin approval endpoint/UI.
3. Make Auctorio render a "Fuentes" section with the evidence URLs it already holds (small change in the GuíaTV payload builder `buildGuiaTvPayload`, `src/studio/publishers.ts`) and mirror the check in `assertAutomaticPublicationReady` so failures happen before the call. Add a copied/licensed image path instead of `auctorio.com` hot-links.
4. Re-run `npm run test:live:guiatv` in Auctorio after deploy (creates and deletes a draft; needs the admin key).
5. Review the 17 + 10 flagged posts (03) and move them to `in-review` through the existing admin path.

## Quality gates now machine-checkable
| Gate | Where | Command |
|---|---|---|
| Approval-time (blocking) | GuíaTV backend policy | `node --test dist/application/services/EditorialReviewPolicy.test.js` |
| Corpus-wide (read-only, live) | `scripts/editorial-audit.mjs` | `npm run seo:editorial-audit` (exit 1 on blocking) |
| Sitemap/URL-level | `scripts/seo-crawl.mjs` | `npm run seo:crawl` |
Not implemented (needs more than a lazy change): broken-link checker for post bodies, fact-check against sources, structured-data-vs-content diff, per-post freshness SLA. Audit script covers freshness (> 45 days on time-bound titles) and internal-link presence only.

## Cost / reliability notes
Auctorio uses a DeepSeek-compatible text API (paid, capped by `AUTOMATION_HARD_MAX_ARTICLES_DAY` and cost budgets per the repo). Retries/idempotency already exist in the publisher (circuit breaker tests, `automation-recovery`). Observability: Auctorio events/audit logs; GuíaTV logs only the approval error. No new paid service is introduced.
