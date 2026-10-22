#!/bin/bash
# Runner-side step of deploy-artifact.yml: runs the on-host deploy over plain ssh so the remote exit status IS the step
# status (ssh-action v1.2.2 ignores `script_stop`, and a trailing cleanup command masked a failed deploy).
# Contract: exit 0 only if deploy-guiatv.sh exited 0; 75 = lock/memory refusal; 255 = ssh could not connect; 124 = timeout.
# Usage: DEPLOY_SSH_HOST/USER/KEY=... scripts/deploy-ssh.sh <git-sha> <artifact-sha256>   (SSH_BIN overrides ssh in tests)
set -euo pipefail
SHA="${1:?git sha}"; SUM="${2:?artifact sha256}"
[[ "${SHA}" =~ ^[0-9a-f]{40}$ ]] && [[ "${SUM}" =~ ^[0-9a-f]{64}$ ]] || { echo "refusing malformed sha arguments" >&2; exit 2; }
KEY="$(mktemp)"; trap 'rm -f "${KEY}"' EXIT
printf '%s\n' "${DEPLOY_SSH_KEY:?}" >"${KEY}"; chmod 600 "${KEY}"

rc=0
timeout "${DEPLOY_TIMEOUT:-900}" "${SSH_BIN:-ssh}" -i "${KEY}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout=30 -o ServerAliveInterval=30 "${DEPLOY_SSH_USER:?}@${DEPLOY_SSH_HOST:?}" bash -s -- "${SHA}" "${SUM}" <<'REMOTE' || rc=$?
set -euo pipefail
dir="/var/tmp/guiatv-$1"
trap 'rm -rf "${dir}"' EXIT # cleanup never changes the exit status
sudo /var/www/guiatv/deploy-guiatv.sh main "${dir}/guiatv-artifact.tgz" "$2"
REMOTE
[ "${rc}" = 0 ] || echo "Remote deploy FAILED (exit ${rc})" >&2
exit "${rc}"
