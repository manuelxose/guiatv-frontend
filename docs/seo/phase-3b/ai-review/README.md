# AI review of the Phase 3B sheet (owner-authorised, 2026-10-21)

The owner (manuelxose) authorised AI agents to perform the human review. Labels here are **`ai_reviewed`**, never "human-validated precision". Policy: `docs/seo/PHASE-3-ENTRY-CONTRACT.md` v1.2.

| Path | What |
|---|---|
| `round1/` | first review (sheet from the pre-fix gate). Gate result: **blocked by 1 critical** (`la_liberacion`, wrong TMDB work) — caught by the reviewers; led to the episode-count rule |
| `round2/` | confirmatory review on a fresh draw from the corrected population. Gate result: **pass** |
| `*/ledger.jsonl` | append-only, hash-chained decisions with reviewer, kind (`ai`), labels, notes citing what was fetched |
| `*/export/` | `primary.csv`, `second.csv` (the unchanged scorer's input) and `report.json` |

Reviewers: `AI Sonnet 5.5 A` (primary, all rows), `AI Opus 5.5 B` (blind second review, 119 rows, plus web search for ambiguous titles), `AI Fable 5.1 C` (adjudicator, round 1 only). Each row was checked against its TMDB page; tokens and the roster stay outside the repository.
Verify a ledger: `node dist/scripts/content-identity.js review verify <ledger.jsonl>`.
