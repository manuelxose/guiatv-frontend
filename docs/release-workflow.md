# Unified Release Workflow

## Purpose

Production now uses one release tree for both runtime services:

- API runtime source: `/var/www/guiatv/current/apps/backend/dist`
- SSR runtime source: `/var/www/guiatv/current/apps/frontend/dist/guiatv`
- active symlink: `/var/www/guiatv/current`
- release history: `/var/www/guiatv/releases/<timestamp>`

This removes the previous split between:

- root-level releases
- frontend-only releases under `apps/frontend/releases`
- direct execution from workspace `dist`

The production rule is now simple: both `guiatv-api` and `guiatv-ssr` must run from the same `current` release.

## Publish flow

1. Build backend and frontend SSR bundles.
2. Publish a single release with `npm run publish:release`.
3. Repoint `/var/www/guiatv/current`.
4. Restart `guiatv-api` and `guiatv-ssr`.
5. Run smoke checks against canonical API and SSR routes.

Commands:

```bash
cd /var/www/guiatv
npm run build
npm run check:release
npm run publish:release
systemctl restart guiatv-api guiatv-ssr
```

`npm run check:release` is non-destructive. It validates the built runtime
artifacts, release identifier and retention configuration, then prints the Git
SHA plus backend/frontend SHA-256 fingerprints. It does not create a release,
change `current`, prune history or restart services.

Or use the production wrapper:

```bash
sudo /var/www/guiatv/deploy-guiatv.sh
```

## What `publish:release` copies

Each release contains only runtime artifacts:

- `apps/backend/dist`
- `apps/frontend/dist/guiatv`
- `apps/frontend/scripts/ssr-server.mjs`
- `release.json`

The script also:

- updates `/var/www/guiatv/current`
- removes stale compatibility symlinks such as `releases/current`
- removes the old `apps/frontend/releases` tree
- prunes old unified releases, keeping the latest 5 by default

You can override the retention count with:

```bash
GUIATV_RELEASE_KEEP=10 npm run publish:release
```

## Validation checklist

After publishing, verify:

1. `readlink -f /var/www/guiatv/current`
2. `systemctl status guiatv-api guiatv-ssr`
3. `curl -I http://127.0.0.1:4000/v2/health`
4. `curl -I 'http://127.0.0.1:4000/v2/tv/surface/guide?date=2026-03-26&group=tdt'`
5. `curl -I http://127.0.0.1:3000/programacion-tv/guia-canales`
6. `journalctl -u guiatv-api -u guiatv-ssr -n 100 --no-pager`

Expected result:

- both services start successfully from the same release
- canonical API routes return `200`
- SSR routes return `200`
- API logs do not show legacy frontend traffic such as `/v2/channels` or `/v2/programs`

## Rollback

Before publishing, record `readlink -f /var/www/guiatv/current`. To roll back,
atomically repoint `current` to that recorded release, restart both services,
and repeat the validation checklist. Releases are immutable and the publisher
retains five by default; no database migration is part of this rebuild release.

Rollback immediately if the error rate exceeds twice its baseline, p95 latency
increases by more than 50%, a new client error affects more than 0.1% of
sessions, or any security/data-integrity regression appears.
