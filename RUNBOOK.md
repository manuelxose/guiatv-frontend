# RUNBOOK - GuiaTV (monorepo + Mongo local)

## Servicios
- SSR: `guiatv-ssr` en `127.0.0.1:3000`
- API: `guiatv-api` en `127.0.0.1:4000`
- MongoDB: `mongod` en `127.0.0.1:27017`
- Valkey: `valkey-server` en `127.0.0.1:6379`

## Rutas
- Código: `/var/www/guiatv`
- Frontend: `/var/www/guiatv/apps/frontend`
- Backend: `/var/www/guiatv/apps/backend`
- Env API: `/etc/guiatv/api.env`
- Env SSR: `/etc/guiatv/ssr.env`
- Storage persistente: `/var/lib/guiatv/storage`

## Deploy
```bash
sudo /var/www/guiatv/deploy-guiatv.sh
```

Con bootstrap DB (solo cuando haga falta):
```bash
sudo BOOTSTRAP_DB=1 /var/www/guiatv/deploy-guiatv.sh
```

## Operación diaria
```bash
systemctl status mongod valkey-server guiatv-api guiatv-ssr --no-pager
journalctl -u guiatv-api -u guiatv-ssr --no-pager -n 200
curl -s http://127.0.0.1:4000/v2/health
curl -s http://127.0.0.1:3000/ | head -n 5
```

## Rebuild ventana canónica (ayer/hoy/mañana/pasado)
```bash
cd /var/www/guiatv/apps/backend

# 1) Re-sync EPG para 4 días
node dist/jobs/cli/syncEPG.cli.js

# 2) Limpiar cache materializada de schedules/precomputed
redis-cli --scan --pattern 'precomputed:*' | xargs -r redis-cli del
redis-cli --scan --pattern 'schedule:*' | xargs -r redis-cli del

# 3) Re-precompute para 4 días
node dist/jobs/cli/precomputeSchedules.cli.js
```

## Bootstrap de datos local
```bash
cd /var/www/guiatv
set -a
source /etc/guiatv/api.env
set +a
npm run db:bootstrap-local
```

## Backup/restore Mongo local
Backup:
```bash
mongodump --uri "mongodb://127.0.0.1:27017/guiatv" --out /var/lib/guiatv/backup/$(date +%Y%m%d-%H%M%S)
```

Restore:
```bash
mongorestore --uri "mongodb://127.0.0.1:27017/guiatv" --drop /var/lib/guiatv/backup/<fecha>/guiatv
```

## Rollback
```bash
cd /var/www/guiatv
git log --oneline -n 20
git checkout <commit>
npm install --workspaces --include-workspace-root --legacy-peer-deps --no-audit --no-fund
npm run build
systemctl restart guiatv-api guiatv-ssr
```
