#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

APP_DIR="/var/www/guiatv"
BRANCH="${1:-main}"
SSR_PORT="3000"
API_PORT="4000"

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

wait_http() {
  local url="$1"
  local i
  for i in {1..30}; do
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    if [ "$code" != "000" ]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

cd "$APP_DIR"

git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

npm install --workspaces --include-workspace-root --legacy-peer-deps --no-audit --no-fund
npm run build

if [ "${BOOTSTRAP_DB:-0}" = "1" ]; then
  npm run db:bootstrap
fi

systemctl daemon-reload
systemctl restart guiatv-api
systemctl restart guiatv-ssr
nginx -t && systemctl reload nginx

wait_http "http://127.0.0.1:${SSR_PORT}/"
wait_http "http://127.0.0.1:${API_PORT}/v2/health"

# Non-blocking SEO submit (logs and continues on failure).
npm run seo:submit-sitemap || true

echo "Deploy OK on branch: ${BRANCH}"
