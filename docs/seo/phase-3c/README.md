# Phase 3C artefacts (2026-10-21)

| File | What |
|---|---|
| `canary-manifest.json` | the proposed write-canary batch (20 films), digest `03fa1569…`, evidence fresh until 2026-10-25; produced by `content-certify manifest` |
| `canary-admit.jsonl` | the exact verdict lines of the batch (the only input a write run is given); SHA-256 in the manifest |
| `canary-legacy-probes.json` | what a crawler saw at the 92 candidates' legacy URLs on 2026-10-21 (status, robots, synopsis length, year; no text) from `scripts/canary-legacy-probe.mjs` |
| `rehearsal-report.json` | the full lifecycle rehearsal of this batch on scratch MongoDB: 20 of 20 checks pass |

Inputs live in `../phase-3b/` (`round2/replay-inputs-r2.tar.gz`, `ai-review/round2/ledger.jsonl`, `round2/review-sheet-3b-r2.csv`). `ContentCanaryManifest.test` regenerates the manifest from them and fails if the digest differs. Nothing here is signed or approved: the owner's grant is the missing piece (Phase 3C report §10).
