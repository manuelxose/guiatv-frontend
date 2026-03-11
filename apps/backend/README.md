# GuiaTV Backend

API Node.js/Express para la Guía de Programación TV.

## Stack

- **Runtime**: Node.js 22, TypeScript 5.8
- **Framework**: Express 4
- **Base de datos**: MongoDB (mongoose)
- **Cache**: Valkey / Redis (opcional, fallback a memoria)
- **Timezone**: `Europe/Madrid` (CET/CEST) — forzado automáticamente

## Requisitos

- Node.js 22+
- MongoDB en `127.0.0.1:27017`
- Valkey/Redis en `127.0.0.1:6379` (opcional)

## Configuración

Las variables de entorno se cargan automáticamente en este orden:

1. `/etc/guiatv/api.env` (producción)
2. `apps/backend/.env` (desarrollo local)

Variables principales (ver `/etc/guiatv/api.env` como referencia):

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `8080` |
| `MONGODB_URI` | URI de MongoDB | `mongodb://127.0.0.1:27017/guiatv` |
| `MONGODB_DB_NAME` | Nombre de la BD | `guiatv` |
| `CACHE_TYPE` | `memory` o `valkey` | `memory` |
| `VALKEY_URL` | URL de Valkey/Redis | — |
| `NODE_ENV` | Entorno | `development` |

## Scripts

```bash
# Build
npm run build          # Compila TypeScript

# Servidor
npm start              # Inicia el servidor (requiere build previo)
npm run dev            # Build + watch + restart automático

# Jobs (requieren build previo)
npm run job:syncEPG    # Descarga y parsea EPG desde fuentes XML
npm run job:precompute # Pre-calcula JSONs de parrilla (ayer/hoy/mañana/pasado)
npm run job:clean      # Limpia programas antiguos de la BD

# Índices
npm run create-indexes # Crea índices de MongoDB

# Calidad
npm run lint           # Verificación estática con TypeScript
npm run test           # Runner nativo de Node
```

## API

- **Health**: `GET /health`
- **Swagger**: `GET /api-docs`
- **Endpoints principales**: `/v2/channels`, `/v2/tv/schedule`, `/v2/tv/now`, `/v2/discovery/home`

Documentación detallada en [docs/endpoints-reference.md](docs/endpoints-reference.md) y [docs/bff-overview.md](docs/bff-overview.md).

## Arquitectura

```
src/
├── config/          # Bootstrap, MongoDB, container DI
├── domain/          # Entidades y lógica de negocio
├── application/     # Servicios (ProgramLayoutBuilder, etc.)
├── infrastructure/  # MongoDB repos, cache, storage
├── presentation/    # Controllers, routes, middleware
├── jobs/            # Cron jobs + CLI runners
├── server/          # Express entry point y config
└── shared/          # Utilidades comunes
```

Ver [docs/architecture.md](docs/architecture.md) para detalle completo.
