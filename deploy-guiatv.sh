#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

APP_DIR="/var/www/guiatv"
BRANCH="${1:-main}"
SSR_PORT="3000"
API_PORT="4000"
FRONTEND_BUILD_DIR="${APP_DIR}/apps/frontend/dist/guiatv"
FRONTEND_RELEASES_DIR="${APP_DIR}/apps/frontend/releases"
CURRENT_RELEASE_LINK="${FRONTEND_RELEASES_DIR}/current"

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

publish_frontend_release() {
  local release_id release_dir temp_link
  release_id="$(date +%Y%m%d%H%M%S)"
  release_dir="${FRONTEND_RELEASES_DIR}/${release_id}"
  temp_link="${FRONTEND_RELEASES_DIR}/.current_tmp"

  mkdir -p "${FRONTEND_RELEASES_DIR}" "${release_dir}"
  cp -a "${FRONTEND_BUILD_DIR}/browser" "${release_dir}/browser"
  cp -a "${FRONTEND_BUILD_DIR}/server" "${release_dir}/server"

  if [ -f "${FRONTEND_BUILD_DIR}/prerendered-routes.json" ]; then
    cp -a "${FRONTEND_BUILD_DIR}/prerendered-routes.json" "${release_dir}/prerendered-routes.json"
  fi

  ln -sfn "${release_dir}" "${temp_link}"
  mv -Tf "${temp_link}" "${CURRENT_RELEASE_LINK}"
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

resolve_smoke_channel_id() {
  curl -fsS "http://127.0.0.1:${API_PORT}/v2/channels" | node -e "
    let data = '';
    process.stdin.on('data', (chunk) => data += chunk);
    process.stdin.on('end', () => {
      const payload = JSON.parse(data);
      const id = payload?.data?.[0]?.id || '';
      process.stdout.write(String(id));
    });
  "
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

if git diff --quiet && git diff --cached --quiet; then
  git fetch --prune origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  echo "Working tree has local changes. Deploying current checkout without git sync."
fi

npm install --workspaces --include-workspace-root --legacy-peer-deps --no-audit --no-fund
npm run build
verify_frontend_build
publish_frontend_release

if [ "${BOOTSTRAP_DB:-0}" = "1" ]; then
  npm run db:bootstrap
fi

systemctl daemon-reload
systemctl restart guiatv-api

wait_http "http://127.0.0.1:${API_PORT}/v2/health"
systemctl restart guiatv-ssr
wait_http "http://127.0.0.1:${SSR_PORT}/"
verify_local_ssr_assets
smoke_http "http://127.0.0.1:${SSR_PORT}/editorial" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/editorial/rankings" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/developers" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/embed" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/comparador-streaming" "200"
smoke_http "http://127.0.0.1:${SSR_PORT}/plataformas" "200"

CHANNEL_ID="$(resolve_smoke_channel_id || true)"
if [ -n "${CHANNEL_ID}" ]; then
  smoke_http "http://127.0.0.1:${SSR_PORT}/canales/${CHANNEL_ID}" "200"
fi

rm -rf /var/cache/nginx/guiatv/*
nginx -t && systemctl reload nginx

smoke_http "https://guiaprogramaciontv.com/v2/health" "200"
smoke_http "https://guiaprogramaciontv.com/v2/catalog/platforms" "200"
smoke_http "https://guiaprogramaciontv.com/v2/catalog?limit=1" "200"
smoke_auth_http "https://guiaprogramaciontv.com/v2/discovery/for-you?limit=1" "200"
smoke_auth_http "https://guiaprogramaciontv.com/v2/user/interactions" "200"
smoke_http "https://guiaprogramaciontv.com/editorial" "200"
smoke_http "https://guiaprogramaciontv.com/developers" "200"
smoke_socket_io

# Non-blocking SEO submit (logs and continues on failure).
npm run seo:submit-sitemap || true

echo "Deploy OK on branch: ${BRANCH}"
