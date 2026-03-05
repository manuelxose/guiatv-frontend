# GuiaTV Monorepo

Guía de Programación TV — Angular SSR + Node.js API.

## Estructura

- `apps/frontend` — Angular SSR (puerto 3000)
- `apps/backend` — API Express (puerto 4000)

## Requisitos

- Node.js 22+
- MongoDB en `127.0.0.1:27017`
- Valkey/Redis en `127.0.0.1:6379` (opcional)

## Inicio rápido

```bash
# Instalar dependencias
npm install --workspaces --include-workspace-root --legacy-peer-deps

# Compilar todo
npm run build

# Inicializar BD (primera vez o rebuild)
npm run db:bootstrap

# Arrancar servicios
npm run start:api    # API en :4000
npm run start:ssr    # SSR en :3000
```

## Scripts principales

| Script | Descripción |
|---|---|
| `npm run build` | Compila backend + frontend |
| `npm run build:backend` | Solo backend |
| `npm run build:frontend` | Solo frontend (SSR) |
| `npm run start:api` | Arranca la API |
| `npm run start:ssr` | Arranca el SSR |
| `npm run db:bootstrap` | Crea índices + sync EPG + precompute |
| `npm run job:syncEPG` | Descarga y parsea EPG |
| `npm run job:precompute` | Pre-calcula parrillas |
| `npm run job:clean` | Limpia programas antiguos |
| `npm run deploy` | Deploy a producción |

## Configuración

Las variables de entorno se cargan automáticamente desde:
1. `/etc/guiatv/api.env` (producción)
2. `apps/backend/.env` (desarrollo local)

No es necesario hacer `source` manual del env file.

## Deploy

```bash
sudo ./deploy-guiatv.sh              # Deploy normal
sudo BOOTSTRAP_DB=1 ./deploy-guiatv.sh  # Con re-inicialización de BD
```

## Runtime

- **Env API**: `/etc/guiatv/api.env`
- **Env SSR**: `/etc/guiatv/ssr.env`
- **Storage**: `/var/lib/guiatv/storage`
- **Servicios**: `guiatv-api`, `guiatv-ssr` (systemd)
