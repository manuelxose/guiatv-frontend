#!/bin/bash
# Integration check for deploy-guiatv.sh in a throwaway sandbox (real git, stubbed npm/systemctl/curl):
#   1. the server checkout is aligned with origin even after the remote history was rewritten (force-push);
#   2. a smoke failure after publishing rolls `current` back to the previous release and restarts both services.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "${T}"' EXIT
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t

fail() { echo "FAIL: $*" >&2; exit 1; }

# --- sandbox: origin, a pusher clone and the "server" checkout --------------------------------------------------
git init -q --bare -b main "${T}/origin.git"
git clone -q "${T}/origin.git" "${T}/work"
(cd "${T}/work" && echo one >f && git add f && git commit -qm one && git push -q origin main)
git clone -q "${T}/origin.git" "${T}/srv"
SRV="${T}/srv"
mkdir -p "${SRV}/apps/backend/dist/server" "${SRV}/apps/frontend/dist/guiatv/browser" "${SRV}/apps/frontend/dist/guiatv/server" "${SRV}/releases/R1" "${T}/bin"
touch "${SRV}/apps/backend/dist/server/index.js" "${SRV}/apps/frontend/dist/guiatv/browser/main.js" \
      "${SRV}/apps/frontend/dist/guiatv/server/main.server.mjs" "${SRV}/apps/frontend/dist/guiatv/server/index.server.html"
ln -sfn "${SRV}/releases/R1" "${SRV}/current"

# --- stubs ------------------------------------------------------------------------------------------------------
cat >"${T}/bin/npm" <<'EOF'
#!/bin/bash
if [ "$1 $2" = "run publish:release" ]; then
  n=$(( $(ls "${APP_DIR}/releases" | wc -l) + 1 ))
  mkdir -p "${APP_DIR}/releases/R${n}"
  ln -sfn "${APP_DIR}/releases/R${n}" "${APP_DIR}/current"
fi
exit 0
EOF
cat >"${T}/bin/systemctl" <<'EOF'
#!/bin/bash
echo "$*" >>"${SYSTEMCTL_LOG}"
EOF
cat >"${T}/bin/curl" <<'EOF'
#!/bin/bash
for a in "$@"; do
  if [ "$a" = "-fsS" ]; then echo '<script src="/main.js"></script>'; exit 0; fi
done
if [ -e "${FAIL_FLAG}" ] && [ "$(basename "$(readlink -f "${APP_DIR}/current")")" = "${FAIL_RELEASE}" ]; then echo 500; exit 0; fi
# Legacy public paths answer like the real SSR server: a permanent redirect.
case "${*: -1}" in */programacion-tv/guia-canales|*/canales/*_*|*/editorial) echo 301 ;; *) echo 200 ;; esac
EOF
chmod +x "${T}/bin/"*
export PATH="${T}/bin:${PATH}" APP_DIR="${SRV}" DEPLOY_ALLOW_NON_ROOT=1 SYSTEMCTL_LOG="${T}/systemctl.log" FAIL_FLAG="${T}/fail" FAIL_RELEASE=none
: >"${SYSTEMCTL_LOG}"

# --- 1. remote history rewritten after the server last synced --------------------------------------------------
(cd "${T}/work" && git commit -q --amend -m "one (rewritten)" && git push -q --force origin main)
git -C "${SRV}" fetch -q origin
if git -C "${SRV}" merge-base --is-ancestor HEAD origin/main; then fail "setup: history was not rewritten"; fi
git -C "${SRV}" reset -q --hard HEAD # only fetched; the deploy script does the real sync
bash "${ROOT}/deploy-guiatv.sh" >"${T}/run1.log" 2>&1 || { cat "${T}/run1.log"; fail "deploy must succeed after a history rewrite"; }
[ "$(git -C "${SRV}" rev-parse HEAD)" = "$(git -C "${T}/origin.git" rev-parse main)" ] || fail "server checkout not aligned with origin/main"
[ "$(basename "$(readlink -f "${SRV}/current")")" = "R2" ] || fail "release R2 was not activated"

# --- 2. smoke fails on the new release: roll back to R2 --------------------------------------------------------
touch "${FAIL_FLAG}"
export FAIL_RELEASE=R3
if bash "${ROOT}/deploy-guiatv.sh" >"${T}/run2.log" 2>&1; then fail "deploy must fail when the smoke check fails"; fi
[ "$(basename "$(readlink -f "${SRV}/current")")" = "R2" ] || { cat "${T}/run2.log"; fail "did not roll back to R2"; }
grep -q "rolling back" "${T}/run2.log" || fail "rollback not announced"
[ "$(grep -c 'restart guiatv-api guiatv-ssr' "${SYSTEMCTL_LOG}")" -ge 1 ] || fail "services not restarted after rollback"

echo "deploy script checks passed"
