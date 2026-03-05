# GuiaTV Monorepo

Estructura principal:

- `apps/frontend`: Angular SSR
- `apps/backend`: API Node/Express

## Requisitos

- Node.js 22+
- MongoDB local (127.0.0.1:27017)
- Valkey/Redis en `127.0.0.1:6379`

## Comandos

```bash
npm install --workspaces --include-workspace-root
npm run build
npm run db:bootstrap-local
npm run start:api
npm run start:ssr
```

## Runtime fuera del repo

- Env: `/etc/guiatv/api.env`, `/etc/guiatv/ssr.env`
- Storage: `/var/lib/guiatv/storage`
