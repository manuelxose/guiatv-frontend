#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

APP_DIR="/var/www/guiatv"
BRANCH="${1:-main}"
SSR_PORT="3000"
API_PORT="4000"
BACKEND_BUILD_DIR="${APP_DIR}/apps/backend/dist"
FRONTEND_BUILD_DIR="${APP_DIR}/apps/frontend/dist/guiatv"
CURRENT_RELEASE_LINK="${APP_DIR}/current"

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

verify_backend_build() {
  if [ ! -f "${BACKEND_BUILD_DIR}/server/index.js" ]; then
    echo "Missing backend build output at ${BACKEND_BUILD_DIR}/server/index.js"
    exit 1
  fi
}

verify_frontend_build() {
  if [ ! -d "${FRONTEND_BUILD_DIR}/browser" ]; then
    echo "Missing browser build output at ${FRONTEND_BUILD_DIR}/browser"
    exit 1
  fi

  if [ ! -d "${FRONTEND_BUILD_DIR}/server" ]; then
    echo "Missing server build output at ${FRONTEND_BUILD_DIR}/server"
    exit 1
  fi

  if ! find "${FRONTEND_BUILD_DIR}/browser" -type f | grep -q .; then
    echo "Browser build output is empty"
    exit 1
  fi

  if ! find "${FRONTEND_BUILD_DIR}/server" -type f | grep -q .; then
    echo "Server build output is empty"
    exit 1
  fi

  if [ ! -f "${FRONTEND_BUILD_DIR}/server/main.server.mjs" ]; then
    echo "Missing SSR entrypoint ${FRONTEND_BUILD_DIR}/server/main.server.mjs"
    exit 1
  fi

  if [ ! -f "${FRONTEND_BUILD_DIR}/server/index.server.html" ]; then
    echo "Missing SSR HTML template ${FRONTEND_BUILD_DIR}/server/index.server.html"
    exit 1
  fi
}

verify_local_ssr_assets() {
  local html
  html="$(curl -fsS "http://127.0.0.1:${SSR_PORT}/")"

  mapfile -t assets < <(
    printf '%s' "${html}" \
      | grep -oE '(href|src)=\"[^"]+\.(js|mjs|css)\"' \
      | sed -E 's/^[^=]+=\"//; s/\"$//' \
      | sed -E 's#^(https?:)?//[^/]+##; s#^([^/])#/\1#' \
      | sort -u
  )

  if [ "${#assets[@]}" -eq 0 ]; then
    echo "SSR HTML does not reference JS/CSS assets"
    exit 1
  fi

  local asset code
  for asset in "${assets[@]}"; do
    code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${SSR_PORT}${asset}" || true)"
    if [ "${code}" != "200" ]; then
      echo "Referenced asset failed: ${asset} -> ${code}"
      exit 1
    fi
  done
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

cd "${APP_DIR}"

if git diff --quiet && git diff --cached --quiet; then
  git fetch --prune origin
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}"
else
  echo "Working tree has local changes. Deploying current checkout without git sync."
fi

npm install --workspaces --include-workspace-root --legacy-peer-deps --no-audit --no-fund
npm run build
verify_backend_build
verify_frontend_build
npm run publish:release

if [ "${BOOTSTRAP_DB:-0}" = "1" ]; then
  npm run db:bootstrap
fi

systemctl daemon-reload
systemctl restart guiatv-api
wait_http "http://127.0.0.1:${API_PORT}/v2/health"
smoke_http "http://127.0.0.1:${API_PORT}/v2/discovery/home" "200"
smoke_http "http://127.0.0.1:${API_PORT}/v2/discovery/browse?type=movie&availability=streaming&limit=1" "200"
smoke_http "http://127.0.0.1:${API_PORT}/v2/tv/surface/guide?date=$(date +%F)&group=tdt" "200"
smoke_http "http://127.0.0.1:${API_PORT}/v2/tv/surface/channels/la_2?date=$(date +%F)" "200"
smoke_http "http://127.0.0.1:${API_PORT}/v2/catalog/platforms" "200"
smoke_auth_http "http://127.0.0.1:${API_PORT}/v2/discovery/for-you" "200"
smoke_auth_http "http://127.0.0.1:${API_PORT}/v2/user/interactions" "200"

systemctl restart guiatv-ssr
wait_http "http://127.0.0.1:${SSR_PORT}/"
verify_local_ssr_assets
smoke_http "http://127.0.0.1:${SSR_PORT}/" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/programacion-tv/guia-canales" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/canales/la_2" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/plataformas" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/deportes" "200"
smoke_socket_io

echo "Unified release active: $(readlink -f "${CURRENT_RELEASE_LINK}")"
