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

## SEO (sitemap + Search Console)
Sitemap público dinámico:
```bash
curl -I https://guiaprogramaciontv.com/sitemap.xml
curl -s https://guiaprogramaciontv.com/sitemap.xml | grep -c '<url>'
```

Submit manual a Search Console:
```bash
cd /var/www/guiatv
npm run seo:submit-sitemap
```

Variables requeridas en `/etc/guiatv/api.env`:
- `GSC_AUTO_SUBMIT_ENABLED=true`
- `GSC_SITE_URL=sc-domain:guiaprogramaciontv.com`
- `GSC_SITEMAP_URL=https://guiaprogramaciontv.com/sitemap.xml`
- `GOOGLE_APPLICATION_CREDENTIALS=/etc/guiatv/gsc-service-account.json`

Si falta el fichero de credenciales, el submit se marca como `skipped` y no rompe deploy/jobs.

## Operación diaria
```bash
systemctl status mongod valkey-server guiatv-api guiatv-ssr --no-pager
journalctl -u guiatv-api -u guiatv-ssr --no-pager -n 200
curl -s http://127.0.0.1:4000/v2/health
curl -s http://127.0.0.1:3000/ | head -n 5
```

## Rebuild ventana canónica (ayer/hoy/mañana/pasado)
```bash
cd /var/www/guiatv

# 1) Re-sync EPG para 4 días
npm run job:syncEPG

# 2) Limpiar cache materializada de schedules/precomputed
redis-cli --scan --pattern 'precomputed:*' | xargs -r redis-cli del
redis-cli --scan --pattern 'schedule:*' | xargs -r redis-cli del

# 3) Re-precompute para 4 días
npm run job:precompute
```

Validación rápida tras rebuild:
```bash
curl -s 'http://127.0.0.1:4000/v2/layouts/today?fields=full' | \
jq --arg ds "$(date -u -d 'today 23:00 -1 day' +%Y-%m-%dT%H:%M:%SZ)" \
   --arg de "$(date -u -d 'today 23:00' +%Y-%m-%dT%H:%M:%SZ)" '
  def ts: (gsub("\\.[0-9]+Z$";"Z") | fromdateiso8601);
  . as $root |
  $root.data.channels as $chs |
  $chs | map(.programs[]) as $p |
  {
    totalPrograms: ($p|length),
    prevCarry: ($p|map(select((.start|ts) < ($ds|fromdateiso8601) and (.end|ts) > ($ds|fromdateiso8601)))|length),
    nextCarry: ($p|map(select((.start|ts) < ($de|fromdateiso8601) and (.end|ts) > ($de|fromdateiso8601)))|length),
    channelsWithoutName: ($chs|map(select((.channel.name//"")==""))|length)
  }'
```

## Bootstrap de datos local
```bash
cd /var/www/guiatv
npm run db:bootstrap
```

## Migración social (dedupe + pairKey chat)
Dry-run:
```bash
cd /var/www/guiatv
npm run migrate:social-data -- --dry-run
```

Aplicar:
```bash
cd /var/www/guiatv
npm run migrate:social-data -- --apply
systemctl restart guiatv-api
```

## Auth/sesiones (v2 breaking)
Nuevos endpoints:
- `POST /v2/auth/refresh`
- `GET /v2/auth/sessions`
- `DELETE /v2/auth/sessions/:id`
- `POST /v2/auth/logout-all`
- `POST /v2/auth/password/forgot`
- `POST /v2/auth/password/reset`

Variables recomendadas en `/etc/guiatv/api.env`:
- `ACCESS_TOKEN_TTL=15m`
- `REFRESH_TOKEN_TTL=30d`
- `JWT_SECRET=<obligatorio>`
- `JWT_REFRESH_SECRET=<obligatorio>`
- `SMTP_HOST=<smtp-host>`
- `SMTP_PORT=587`
- `SMTP_USER=<smtp-user>`
- `SMTP_PASS=<smtp-pass>`
- `SMTP_FROM=no-reply@guiaprogramaciontv.com`
- `PASSWORD_RESET_URL=https://guiaprogramaciontv.com/auth/reset-password`

Checks rápidos:
```bash
curl -s http://127.0.0.1:4000/v2/auth/sessions -i   # Debe devolver 401 sin token
curl -s -X POST http://127.0.0.1:4000/v2/auth/refresh \
  -H 'Content-Type: application/json' -d '{}' -i    # Debe devolver 400
```

## Social/chat nuevos
Nuevos endpoints:
- `POST /v2/social/block/:userId`
- `DELETE /v2/social/block/:userId`
- `GET /v2/social/blocks`
- `POST /v2/social/reports`
- `GET /v2/social/reports/me`
- `POST /v2/chat/conversations/:id/read`
- WebSocket Socket.IO: `ws(s)://<host>/v2/ws`

Notificaciones:
- `GET /v2/user/notifications`
- `POST /v2/user/notifications/read`
- `GET /v2/user/notifications/unread-count`

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
