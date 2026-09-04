# GuiaTV Backend

Express + TypeScript backend for TV guide, discovery, streaming catalog, and chatbot retrieval features.

## Stack

- Runtime: Node.js 22
- Language: TypeScript 5.8
- Framework: Express 4
- Database: MongoDB via Mongoose
- Cache: in-memory or Valkey/Redis-compatible
- Operational timezone: `Europe/Madrid`

## Requirements

- Node.js 22+
- MongoDB available at `127.0.0.1:27017` or via `MONGODB_URI`
- Optional Valkey/Redis at `127.0.0.1:6379`

## Configuration

Environment variables are loaded in this order:

1. `/etc/guiatv/api.env`
2. `apps/backend/.env`

Key variables:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP server port | `4000` |
| `MONGODB_URI` | Mongo connection string | `mongodb://127.0.0.1:27017/guiatv` |
| `MONGODB_DB_NAME` | Mongo database name | `guiatv` |
| `CACHE_TYPE` | `memory`, `redis`, or `valkey` | `memory` |
| `VALKEY_URL` | Valkey/Redis URL | — |
| `NODE_ENV` | Runtime environment | `development` |

## Scripts

```bash
# Build and lint
npm run build
npm run lint
npm run test

# Server
npm start
npm run dev

# Data jobs
npm run job:syncEPG
npm run job:precompute
npm run job:clean

# Operational scripts
npm run create-indexes
npm run migrate:tv-read-model
npm run seed:editorial
```

## Active API surface

- Health: `GET /v2/health`
- Swagger: `GET /v2/docs`
- Canonical TV reads:
  - `GET /v2/tv/read`
  - `GET /v2/tv/read/channels`
  - `GET /v2/tv/read/items/:airingId`
- TV BFF surfaces:
  - `GET /v2/tv/surface/guide`
  - `GET /v2/tv/surface/channels/:channelId`
- Discovery:
  - `GET /v2/discovery/home`
  - `GET /v2/discovery/search`
  - `GET /v2/discovery/browse`
- Unified content:
  - `GET /v2/content/:id`
  - `GET /v2/content/batch`

Detailed documentation:

- [docs/architecture.md](docs/architecture.md)
- [docs/bff-overview.md](docs/bff-overview.md)
- [docs/endpoints-reference.md](docs/endpoints-reference.md)
- [docs/regression-recovery-2026-03-26.md](docs/regression-recovery-2026-03-26.md)
- [docs/project-status-and-future-improvements.md](docs/project-status-and-future-improvements.md)

## Repository layout

```text
src/
├── config/          # bootstrap, Mongo, container wiring
├── domain/          # entities, repository contracts, domain services
├── application/     # use cases, read services, DTOs
├── infrastructure/  # repositories, cache adapters, provider clients
├── presentation/    # routes, controllers, middleware, Swagger
├── jobs/            # cron jobs and CLI entry points
├── server/          # HTTP server bootstrap
└── shared/          # shared utilities and helpers
```
