# Canary evidence refresh (2026-10-22)

Written for: the owner, who must sign any new grant. The Phase 3C evidence expires **2026-10-25**.

## Result in one paragraph

**The evidence changed, so there is a new manifest, and it needs a newly signed owner authorisation.** Between the 3C probe (2026-10-21 19:51 UTC) and this refresh (2026-10-21 23:15 UTC, 2026-10-22 in Madrid), the legacy page of **10 of the 20 films became `index, follow`**, because the films were scheduled for today or tomorrow (the legacy page is indexable exactly when it lists an airing then). Replacing those pages with noindex entity pages is what the Phase 3C finding warned about, so they leave the batch. The remaining **10** are unchanged. The refreshed manifest is `canary-manifest.json` (digest `f5341ad8…`, 10 films); the 3C digest `03fa1569…` and any grant for it cover nothing here. **Nothing was signed, nothing was written to any database that is not scratch.**

## What could and could not be refreshed

| Evidence | Refreshed? | How / why not |
|---|---|---|
| Legacy URL status of the 20 | **yes** | public API snapshot of each legacy page, 2026-10-21T23:15Z (`legacy-payloads-20261022.json`); robots predicted with `catalogRobotsPolicy` (airings ⇒ index) and **measured on 6 pages, 6/6 equal to the prediction**; probes merged into `canary-legacy-probes.json` (the other 72 probes are the 3C ones, untouched) |
| Canonical paths | **yes** | the legacy payload's `detailPath` equals the manifest path for 20/20; the scratch rehearsal stores exactly the manifest paths |
| Metadata identity | **yes** | TMDB id equals for 20/20; title equal for 20/20; release year within ±1 for 20/20; the enrichment gate (type, id, title key, year) accepted 20/20 on scratch |
| AI ledger bindings | **yes (offline)** | ledger chain and head hash verified when the manifest is rebuilt (`ContentCanaryManifest.test` reproduces both digests from the committed ledger); the grant still pins this head |
| Broadcast association | **yes** | 13 broadcasts joined on TMDB id + catalogue row + title key; equals the 13 airings the legacy pages list; every one carries identity evidence |
| Publication quality | **yes** | `film-quality-report.md` (below) |
| Rollback readiness | **yes** | scratch rehearsal: revoke and rollback leave only the audit trail (20 attestations + 20 revocations) |
| Accepted verdicts and TMDB checks (the replay) | **no** | the replay needs production database reads; the session's authorisation classifier refused them (as in 3B/3C), so the freshness of the verdicts stays **2026-10-25** (`--evidence-produced 20261021` pins it; a later rebuild cannot make the replay look younger) |
| The 72 other legacy probes | **no** | same reason; so no replacement film was drawn into the batch on stale data |

## To finish the refresh (owner or an authorised operator, read-only)

```bash
# 1. fresh replay for today and the next days (read-only guard), as in the 3C runbook
bash docs/seo/phase-2d2f/run-evidence.sh            # on the VPS, with the packaged build
# 2. fresh legacy probe of the whole pool (public GETs, paced)
node scripts/canary-legacy-probe.mjs --pool pool.json --origin https://guiaprogramaciontv.com --out probes.json
# 3. rebuild
node apps/backend/dist/scripts/content-certify.js manifest --day … --ledger … --sheet … --probe probes.json --tmdb … --out manifest.json --admit-out admit.jsonl
```

If the digest differs from the one the owner signed, stop: a new grant is needed. The legacy status is a moving target (a film aired in the next two days has an indexable legacy page), so probe immediately before any run.

## Per-film outcome (scratch rehearsal on the 20 films)

See `film-quality-report.md` (and `.json`, reproducible by `ContentEnrichmentRehearsal.mongo.test`). Summary: 20/20 enrich; **10 held for the legacy page** (indexable now, entity would replace it) and **10 held for quality** (legacy page is noindex, but with no scheduled broadcast the entity page is only the TMDB text and facts: no original value, AdSense risk medium). **No film is `show_noindex` today and none is an index candidate.**
