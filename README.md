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

## Main scripts

| Script | Description |
|---|---|
| `npm run build` | Build backend + frontend SSR |
| `npm run build:backend` | Build backend only |
| `npm run build:frontend` | Build frontend SSR only |
| `npm run publish:release` | Publish one unified runtime release under `/var/www/guiatv/releases/<timestamp>` and repoint `/var/www/guiatv/current` |
| `npm run start:api` | Start the API |
| `npm run start:ssr` | Start the SSR server |
| `npm run db:bootstrap` | Create indexes + sync EPG + precompute |
| `npm run job:syncEPG` | Download and parse EPG data |
| `npm run job:precompute` | Precompute TV guide materializations |
| `npm run job:clean` | Clean old programs |
| `npm run deploy` | Build, publish a unified release, restart services, and run smoke checks |

## Configuración

Las variables de entorno se cargan automáticamente desde:
1. `/etc/guiatv/api.env` (producción)
2. `apps/backend/.env` (desarrollo local)

No es necesario hacer `source` manual del env file.

## VS Code Agent Images

El workspace incluye integración local con SiliconFlow para generación de imágenes en modo agente de VS Code.

- MCP server: `.vscode/mcp.json`
- Script: `tools/mcp/siliconflow-image-server.mjs`
- Tool disponible para agentes: `generate_image`
- Variables locales: `.env` y `.env.example`
- Repositorio central de imágenes generadas: `generated-assets/<proyecto>/`
- Modelo por defecto para imágenes: `black-forest-labs/FLUX.2-pro`

Flujo recomendado:
- Primero generar y guardar en `generated-assets/<proyecto>/`, que vive en la raíz del workspace al mismo nivel que `apps/`.
- Los proyectos pueden tener un enlace simbólico `generated-assets` que apunte a su subcarpeta dentro del repositorio central.
- Si la imagen se usa realmente en producto, guardar también una copia en los assets del proyecto correspondiente, por ejemplo `apps/frontend/src/assets/...`.
- El tool `generate_image` soporta `project` para la carpeta central y `assetOutputPath` para la copia final de producto.

## Unified release model

Production uses one shared runtime release for both services:

- active symlink: `/var/www/guiatv/current`
- release history: `/var/www/guiatv/releases/<timestamp>`

Both `guiatv-api` and `guiatv-ssr` must run from `current`. The frontend-specific release tree under `apps/frontend/releases` is no longer part of the production path.

See [docs/release-workflow.md](/var/www/guiatv/docs/release-workflow.md).

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
