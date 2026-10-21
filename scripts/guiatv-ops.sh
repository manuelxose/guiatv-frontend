#!/bin/bash
# Safe operations on the production services, none of which compiles or installs anything.
#
#   guiatv-ops.sh status                     what is live, service states, health (read-only)
#   guiatv-ops.sh rollback [<release-id>]    repoint `current` at the previous release (or the named one), restart, verify
#   guiatv-ops.sh restart                    restart API then SSR, each verified before the next step, then warm the hubs
#   guiatv-ops.sh warm                       render the hub pages once, one at a time (cold-cache protection after a reboot)
#
# Needs root (systemctl, symlink). Takes the same lock as deploy-guiatv.sh, so it never runs over a deploy.
# It never reboots the machine and never touches the database, the environment files or any flag.
set -euo pipefail
IFS=$'\n\t'

APP_DIR="${APP_DIR:-/var/www/guiatv}"
CURRENT="${APP_DIR}/current"
SSR_PORT="${SSR_PORT:-3000}"
API_PORT="${API_PORT:-4000}"

if [ "${EUID:-$(id -u)}" -ne 0 ] && [ "${DEPLOY_ALLOW_NON_ROOT:-0}" != "1" ]; then
  echo "Run as root"
  exit 1
fi

wait_http() {
  local url="$1" i code
  for i in {1..30}; do
    code=$(curl --max-time 5 -s -o /dev/null -w "%{http_code}" "$url" || true)
    [[ "$code" =~ ^2[0-9][0-9]$ ]] && return 0
    sleep "${OPS_POLL_DELAY:-2}"
  done
  return 1
}

live_release() { basename "$(readlink -f "${CURRENT}" 2>/dev/null || echo none)"; }

verify_live() {
  wait_http "http://127.0.0.1:${API_PORT}/v2/health" || { echo "API did not become healthy"; return 1; }
  wait_http "http://127.0.0.1:${SSR_PORT}/" || { echo "SSR did not become healthy"; return 1; }
  echo "verified: release $(live_release), API and SSR healthy"
}

warm() {
  local path out code failed=0
  for path in / /canales /plataformas /programacion-tv/peliculas /programacion-tv/series \
    /programacion-tv/que-ver-hoy /programacion-tv/en-directo /guias /deportes/futbol /tendencias; do
    out=$(curl --max-time "${WARM_TIMEOUT:-25}" -s -o /dev/null -H "Host: guiaprogramaciontv.com" \
      -H "X-Forwarded-Proto: https" -w "%{http_code} %{time_total}" "http://127.0.0.1:${SSR_PORT}${path}" || true)
    code="${out%% *}"
    echo "warm: ${path} -> ${out:-000}"
    [ "$code" = "200" ] || failed=$((failed + 1))
  done
  [ "$failed" -eq 0 ] || echo "WARN: ${failed} hub page(s) did not render 200 (non-fatal)"
}

take_lock() {
  exec 9>"${DEPLOY_LOCK_FILE:-/var/lock/guiatv-deploy.lock}"
  flock -n 9 || { echo "A deploy or another operation holds the lock; nothing changed"; exit 75; }
}

restart_verified() {
  systemctl restart guiatv-api
  wait_http "http://127.0.0.1:${API_PORT}/v2/health" || { echo "API did not recover after restart"; return 1; }
  systemctl restart guiatv-ssr
  wait_http "http://127.0.0.1:${SSR_PORT}/" || { echo "SSR did not recover after restart"; return 1; }
}

case "${1:-}" in
  status)
    echo "live release: $(live_release)"
    echo "releases: $(ls -1 "${APP_DIR}/releases" 2>/dev/null | sort | tr '\n' ' ')"
    for unit in guiatv-api guiatv-ssr mongod valkey nginx; do echo "${unit}: $(systemctl is-active "${unit}" 2>/dev/null || true)"; done
    verify_live
    ;;
  rollback)
    take_lock
    LIVE="$(live_release)"
    TARGET="${2:-}"
    if [ -z "${TARGET}" ]; then
      # The newest release older than the live one.
      TARGET="$(ls -1 "${APP_DIR}/releases" | sort | awk -v live="${LIVE}" '$0 < live { prev = $0 } END { print prev }')"
    fi
    [[ "${TARGET}" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "no previous release to roll back to"; exit 1; }
    [ -d "${APP_DIR}/releases/${TARGET}" ] || { echo "release ${TARGET} does not exist"; exit 1; }
    [ "${TARGET}" != "${LIVE}" ] || { echo "release ${TARGET} is already live"; exit 1; }
    echo "rolling back ${LIVE} -> ${TARGET}"
    ln -sfn "${APP_DIR}/releases/${TARGET}" "${CURRENT}.rollback"
    mv -Tf "${CURRENT}.rollback" "${CURRENT}"
    restart_verified || { echo "ROLLBACK DID NOT RECOVER the services: investigate with journalctl -u guiatv-api -u guiatv-ssr"; exit 1; }
    warm
    verify_live
    ;;
  restart)
    take_lock
    restart_verified
    warm
    verify_live
    ;;
  warm)
    warm
    ;;
  *)
    sed -n '2,10p' "$0"
    exit 2
    ;;
esac
