# Phase 3B artefacts (fresh read-only production replay, 2026-10-21)

| File | What |
|---|---|
| `traces-3b.tar.gz` | `trace-dump.js` output (identity traces) of days 20261020–23, run 1 of each |
| `replay-inputs.tar.gz` | per-day `verdicts-<day>.jsonl` (evidence gate output) and `tmdb-checks-<day>.json` (independent TMDB searches) |
| `evidence-<day>.json` | gate summary per day (levels, assurance counts, reasons, violations, digest) |
| `canonical-audit-<day>.json` | machine-readable path/collision/quarantine report per day |
| `baseline-before/after-<day>.json` | production counters before and after each replay: identical (no write) |
| `review-sheet-3b.csv` | 360-row human review sheet from the 519 accepted identities; **no label filled** |

Regenerate (context days 20261013/16/17/18/19 come from `docs/seo/phase-2d2g/traces-20261013-20261020.tar.gz`):

```bash
node dist/scripts/content-identity.js evidence <day-traces> <other-day-traces…> --tmdb tmdb-checks-<day>.json --out verdicts-<day>.jsonl
node dist/scripts/content-identity.js canonical-audit <day-traces> --verdicts verdicts-<day>.jsonl --out canonical-audit-<day>.json
node dist/scripts/content-identity.js evidence-sheet --day <traces>:<verdicts> … --out review-sheet-3b.csv --seed phase-3b-20261021 --size 360
```

The replay itself ran from `docs/seo/phase-2d2f/run-evidence.sh` (unchanged) in `/tmp/guiatv-3b*` on the VPS, under the read-only guard.
