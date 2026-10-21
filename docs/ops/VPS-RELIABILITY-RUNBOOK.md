# VPS reliability runbook (Contabo, 109.123.248.164)

## What happened

2026-10-20 and 2026-10-21: the host stopped answering (Cloudflare 522, SSH timeout, 100 % ping loss). On 21 Oct the previous boot's journal ends abruptly at 18:58:47 UTC, mid-service, with **no shutdown sequence, OOM kill, kernel panic, hung task or I/O error**; the build that had just run peaked at 2.7 GB of 11.9 GB. The owner restarted the machine (booted 19:18, serving by 19:19). **The cause is not established.** A provider-side hard stop (or power loss) is what the missing evidence points to; nothing in the application or the deployed code explains it. Do not write a root cause until Contabo answers.

Ask Contabo: was the VPS live-migrated, reset or hard-stopped on 2026-10-20 and 2026-10-21 (times above, UTC)? Is there host maintenance, a node failure or a resource-limit action in the ticket history? Can the host-side console log be attached to the ticket?

## Safeguards and where they live

| Need | Mechanism | Status |
|---|---|---|
| Outside view of the site | `.github/workflows/uptime.yml` every 15 min from GitHub; `scripts/uptime-probe.mjs` (home, API health, robots, sitemap index, hub page, entity-reads-off invariant; each failure retried 3× 20 s apart before it counts). A failed run emails the repository's notification recipients; optional `UPTIME_WEBHOOK_URL` secret | active once merged to `main` |
| HTTP/HTTPS, API and SSR health | the same probe goes through Cloudflare → nginx → SSR/API; the in-host watchdog (`health-watchdog.timer`) keeps checking units, OOM and EPG freshness | probe active on merge; watchdog already installed |
| Deployment concurrency | workflow group `deploy-prod` + `flock` on `/var/lock/guiatv-deploy.lock` in `deploy-guiatv.sh` and `guiatv-ops.sh` (exit 75, nothing changed) | in the script |
| Memory-aware builds | pre-flight `MemAvailable` ≥ `BUILD_MIN_AVAILABLE_MB` (3500), `--max-old-space-size=${BUILD_HEAP_MB:-3072}`, `nice -n 10`, `ionice -c 3`, optional `BUILD_MEMORY_MAX=5G` (cgroup via `systemd-run --scope`), `npm install` only when `package-lock.json` changed | in the script (cgroup cap opt-in) |
| No compile on the VPS | `deploy-artifact.yml` (manual): CI builds with the Angular budgets, ships a checksummed tarball; `deploy-guiatv.sh <branch> <tgz> <sha256>` verifies checksum + commit and only publishes. Switch `deploy.yml` to it when the owner approves | prepared, manual |
| Docs-only changes | `paths-ignore` in `deploy.yml`; the script also exits 0 when the live commit equals the target or only docs/notes/markdown changed (`FORCE_DEPLOY=1` overrides) | active on merge |
| Cold start after reboot | `infra/systemd/guiatv-post-boot.service` → `scripts/post-boot-check.mjs --warm`: waits ≤ 5 min for API/SSR, records whether the previous boot ended without a shutdown sequence, checks units/release/flag names, warms ten hubs sequentially; writes `/var/log/guiatv/post-boot.json`, alerts to `health-alerts.log` | **needs installing** (below) |
| Fast rollback, safe restart | `scripts/guiatv-ops.sh` with `rollback [id]`, `restart`, `warm`, `status` | in the repo; copy is the checkout |
| No automatic reboot or redeploy | nothing here reboots, redeploys or restarts on a schedule; the deploy workflow stays push/dispatch only | by design |

## One-time installation (needs root and the owner's approval)

```bash
sudo cp /var/www/guiatv/infra/systemd/guiatv-post-boot.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable guiatv-post-boot.service    # runs at the next boot only
# GUIATV_EXPECTED_FLAGS (activation flags the owner approved) goes in /etc/guiatv/post-boot.env, empty today
```

Repository settings: add the secret `UPTIME_WEBHOOK_URL` (optional) and the variable `ENTITY_EXPECTATION` (`canary` only while the entity canary is on).

## After any unplanned restart

1. `scripts/guiatv-ops.sh status` (read-only).
2. `cat /var/log/guiatv/post-boot.json` (or run `node scripts/post-boot-check.mjs --warm`): the first run after boot warms the hubs; expect slow first renders (11–22 s on cold hubs) and `/v2/tv/read` timeouts in the SSR log for the first minute.
3. `journalctl -b -1 -n 80` and compare with the 2026-10-21 signature (ends mid-service, no shutdown lines). Add the time and the post-boot record to the Contabo ticket.
4. Do not redeploy to "see if it helps": the release on disk is immutable; `guiatv-ops.sh rollback` is the only action that changes it.

## Release rollback

`sudo /var/www/guiatv/scripts/guiatv-ops.sh rollback` repoints `current` at the newest older release, restarts API then SSR (each verified), warms the hubs and re-verifies. `rollback <release-id>` picks one. Rollback triggers are in `docs/release-workflow.md`.
