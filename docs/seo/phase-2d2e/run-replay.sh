#!/usr/bin/env bash
# 2D-2E full-day read-only replay on the VPS (owner-run). Inspect before running. Needs, in
# /tmp/guiatv-2d2e: before/ and after/ (each apps/backend/dist from the 2D-2D and 2D-2E builds),
# trace-dump.js, baseline.js. Touches no service, release, configuration or database document:
#  - every CONTENT_* variable is removed from the process environment;
#  - each node run installs the read-only guard (autoIndex/autoCreate off; any write/DDL = exit 97);
#  - pool of 2 connections, 1.2 GB memory cap, nice 10, 600 s timeout per run.
set -euo pipefail  # any failed step stops the run; nothing after it executes
W=${W:-/tmp/guiatv-2d2e}
DAY=${DAY:-20261020}
REL=${REL:-/var/www/guiatv/current}
HEALTH=${HEALTH:-http://127.0.0.1:4000/health}
cd "$W"
set -a; . "${ENV_FILE:-/etc/guiatv/api.env}" >/dev/null; set +a
for v in $(env | grep -o '^CONTENT_[A-Z_]*' || true); do unset "$v"; done
export MONGODB_MAX_POOL_SIZE=2 MONGODB_MIN_POOL_SIZE=0 CONTENT_IDENTITY_MAX_CREATES=100000
for b in before after; do
  ln -sfn "$REL/node_modules" "$W/$b/node_modules"
  [ -d "$REL/apps/backend/node_modules" ] && ln -sfn "$REL/apps/backend/node_modules" "$W/$b/apps/backend/node_modules"
done
# NO_SCOPE=1 only for a local dry run without systemd; on the VPS the memory scope is always used.
if [ -n "${NO_SCOPE:-}" ]; then scope=(); else scope=(systemd-run --scope --quiet -p MemoryMax=1200M --nice=10 --); fi
bounded() { "${scope[@]}" /usr/bin/time -v timeout 600 node --max-old-space-size=1024 "$@"; }

mongosh --quiet "$MONGODB_URI" baseline.js > baseline-before.json
curl -sS -o /dev/null -w 'health before %{http_code} %{time_total}s\n' "$HEALTH" || true
for b in before after; do
  (cd "$W/$b/apps/backend" && bounded "$W/trace-dump.js" "$DAY" > "$W/traces-$b.jsonl" 2> "$W/traces-$b.err")
  echo "$b: $(grep -h '^guard ' "$W/traces-$b.err"); $(grep -h 'Maximum resident\|Elapsed (wall' "$W/traces-$b.err" | tr -s ' \t' ' ')"
done
(cd "$W/after/apps/backend" && bounded dist/scripts/content-identity.js shadow "$DAY" --sample 25 --precision-sample 300 --seed 2d2e-$DAY --out "$W/sheet" > "$W/shadow-report.json" 2> "$W/shadow.err")
echo "sheet: $(grep -h 'guard:\|sample written' "$W/shadow.err" | tr '\n' ' ')"
curl -sS -o /dev/null -w 'health after %{http_code} %{time_total}s\n' "$HEALTH" || true
mongosh --quiet "$MONGODB_URI" baseline.js > baseline-after.json
node -e 'const f=(p)=>{const {at,mongodUptimeS,...r}=require(p);return JSON.stringify(r)};const [a,b]=[f(process.argv[1]),f(process.argv[2])];console.log(a===b?"baseline: identical "+a:"BASELINE CHANGED\n"+a+"\n"+b);process.exit(a===b?0:3)' "$W/baseline-before.json" "$W/baseline-after.json"
grep -h 'READ_ONLY_GUARD' "$W"/*.err && { echo 'GUARD TRIPPED'; exit 97; } || echo 'guard: no write attempted'
