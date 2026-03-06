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

smoke_http() {
  local url="$1"
  local expected="${2:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
  if [ "$code" != "$expected" ]; then
    echo "Smoke check failed: $url -> $code (expected $expected)"
    exit 1
  fi
}

smoke_auth_http() {
  local url="$1"
  local expected="${2:-200}"

  if [ -z "${SMOKE_AUTH_TOKEN:-}" ]; then
    echo "Skipping auth smoke: $url (SMOKE_AUTH_TOKEN not set)"
    return 0
  fi

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${SMOKE_AUTH_TOKEN}" \
    "$url" || true)
  if [ "$code" != "$expected" ]; then
    echo "Auth smoke check failed: $url -> $code (expected $expected)"
    exit 1
  fi
}

smoke_socket_io() {
  if [ -z "${SMOKE_AUTH_TOKEN:-}" ]; then
    echo "Skipping Socket.IO smoke (SMOKE_AUTH_TOKEN not set)"
    return 0
  fi

  node <<'NODE'
const { io } = require('/var/www/guiatv/node_modules/socket.io-client');

const timeoutMs = 8000;
const socket = io('https://guiaprogramaciontv.com', {
  path: '/v2/ws',
  auth: { token: process.env.SMOKE_AUTH_TOKEN },
  transports: ['websocket'],
  timeout: timeoutMs,
  reconnection: false,
});

const timer = setTimeout(() => {
  console.error('Socket.IO smoke check timed out');
  process.exit(1);
}, timeoutMs + 1000);

socket.on('connect', () => {
  clearTimeout(timer);
  socket.close();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  clearTimeout(timer);
  console.error(`Socket.IO smoke failed: ${error?.message || error}`);
  process.exit(1);
});
NODE
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

smoke_http "https://guiaprogramaciontv.com/v2/health" "200"
smoke_http "https://guiaprogramaciontv.com/v2/catalog/platforms" "200"
smoke_http "https://guiaprogramaciontv.com/v2/catalog?limit=1" "200"
smoke_auth_http "https://guiaprogramaciontv.com/v2/discovery/for-you?limit=1" "200"
smoke_auth_http "https://guiaprogramaciontv.com/v2/user/interactions" "200"
smoke_socket_io

# Non-blocking SEO submit (logs and continues on failure).
npm run seo:submit-sitemap || true

echo "Deploy OK on branch: ${BRANCH}"
