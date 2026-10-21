#!/usr/bin/env bash
# 2D-2F read-only evidence replay on the VPS. Needs, in $W: build/apps/backend/dist (the candidate
# build), trace-dump.js and baseline.js (phase-2d2e). Same safeguards as phase-2d2e/run-replay.sh:
# CONTENT_* unset, read-only guard in every node process (write/DDL = exit 97), pool 2, 1.2 GB cap,
# nice 10, 600 s per run. The target day is dumped twice to check determinism.
set -euo pipefail
W=${W:-/tmp/guiatv-2d2f}
DAY=${DAY:-20261020}
OTHERS=${OTHERS:-"20261013 20261016 20261017 20261018 20261019"}
REL=${REL:-/var/www/guiatv}
HEALTH=${HEALTH:-http://127.0.0.1:4000/health}
cd "$W"
set -a; . "${ENV_FILE:-/etc/guiatv/api.env}" >/dev/null; set +a
for v in $(env | grep -o '^CONTENT_[A-Z_]*' || true); do unset "$v"; done
export MONGODB_MAX_POOL_SIZE=2 MONGODB_MIN_POOL_SIZE=0 CONTENT_IDENTITY_MAX_CREATES=100000
ln -sfn "$REL/node_modules" "$W/build/node_modules"
scope=(systemd-run --scope --quiet -p MemoryMax=1200M --nice=10 --)
bounded() { "${scope[@]}" /usr/bin/time -v timeout 600 node --max-old-space-size=1024 "$@"; }
dump() { (cd "$W/build/apps/backend" && bounded "$W/trace-dump.js" "$1" > "$W/traces-$2.jsonl" 2> "$W/traces-$2.err")
  echo "$2: $(grep -h '^guard ' "$W/traces-$2.err"); $(grep -h 'Maximum resident\|Elapsed (wall' "$W/traces-$2.err" | tr -s ' \t' ' ')"; }

mongosh --quiet "$MONGODB_URI" baseline.js > baseline-before.json
curl -sS -o /dev/null -w 'health before %{http_code}\n' "$HEALTH" || true
dump "$DAY" "$DAY-run1"
dump "$DAY" "$DAY-run2"
for d in $OTHERS; do dump "$d" "$d"; done
# TMDB search per TMDB-backed candidate of the target day: GETs to api.themoviedb.org, no database.
(cd "$W/build/apps/backend" && timeout 900 node "$W/tmdb-check.js" "$W/traces-$DAY-run1.jsonl" "$W/tmdb-cache.json" > "$W/tmdb-checks.json" 2> "$W/tmdb.err")
grep -h '^tmdb-check' "$W/tmdb.err"
curl -sS -o /dev/null -w 'health after %{http_code}\n' "$HEALTH" || true
mongosh --quiet "$MONGODB_URI" baseline.js > baseline-after.json
node -e 'const f=(p)=>{const {at,mongodUptimeS,...r}=require(p);return JSON.stringify(r)};const [a,b]=[f(process.argv[1]),f(process.argv[2])];console.log(a===b?"baseline: identical "+a:"BASELINE CHANGED\n"+a+"\n"+b);process.exit(a===b?0:3)' "$W/baseline-before.json" "$W/baseline-after.json"
# Trace lines only (stdout also carries timestamped logger lines): run1 and run2 must be byte-identical.
cmp <(grep '^{"candidateId"' "traces-$DAY-run1.jsonl") <(grep '^{"candidateId"' "traces-$DAY-run2.jsonl") && echo 'determinism: traces identical'
grep -h 'READ_ONLY_GUARD' "$W"/*.err && { echo 'GUARD TRIPPED'; exit 97; } || echo 'guard: no write attempted'
