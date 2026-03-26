# Backend Architecture

## Overview

The backend is an Express + TypeScript application organized around three execution layers:

1. `ingestion and persistence`
2. `read models and application services`
3. `surface APIs for frontend, SSR, and chatbot consumption`

The current production-facing contract is intentionally centered on canonical read endpoints and BFF-style surfaces. Raw legacy TV routes are no longer part of the active frontend contract.

## Runtime stack

- Node.js 22
- TypeScript
- Express
- MongoDB via Mongoose
- In-memory cache or Redis/Valkey-compatible cache
- External integrations:
  - EPG providers
  - TMDB
  - streaming provider availability
  - optional blog/CMS

## Module layout

### Domain

- Repository interfaces
- domain services for channels, auth, and program semantics

### Application

- use cases for sync, precompute, discovery, content detail, recommendations, and admin flows
- read services such as:
  - `TvReadQueryService`
  - `TvSurfaceService`
  - `CatalogService`
  - `AssistantMemoryService`
  - `AnalyticsService`

### Infrastructure

- Mongo models and repositories
- cache adapters
- external provider clients
- parsers and storage adapters

### Presentation

- Express route factories
- controllers
- middleware
- Swagger/OpenAPI surface

## Active API surface

### Canonical TV reads

- `GET /v2/tv/read`
- `GET /v2/tv/read/channels`
- `GET /v2/tv/read/channels/:channelId`
- `GET /v2/tv/read/items/:airingId`

### TV BFF surfaces

- `GET /v2/tv/surface/guide`
- `GET /v2/tv/surface/channels/:channelId`

### Discovery and content

- `GET /v2/discovery/home`
- `GET /v2/discovery/search`
- `GET /v2/discovery/browse`
- `GET /v2/catalog`
- `GET /v2/catalog/platforms`
- `GET /v2/catalog/suggest`
- `GET /v2/catalog/slug/:contentType/:slug`
- `GET /v2/catalog/:catalogId`
- `GET /v2/content/:id`
- `GET /v2/content/batch`
- `GET /v2/content/providers/:contentType/:tmdbId`

### Authenticated AI/chat surfaces

- `POST /v2/ai/chat`
- `POST /v2/ai/chat/stream`
- `GET /v2/ai/chat/history`
- `POST /v2/ai/chat/history`
- `DELETE /v2/ai/chat/history`
- `PATCH /v2/ai/memory`
- conversation and reminder routes under `/v2/ai/*`

## TV data flow

1. EPG sync jobs fetch and parse source feeds.
2. Parsed records are normalized into channel identities, title aliases, source provenance, and asset candidates.
3. Brand-level consolidation is applied where possible.
4. `tv_read_airings` is materialized as the canonical TV read model.
5. `TvReadQueryService` reads `tv_read_airings` and applies view semantics (`day`, `now`, `next`, `night`, `search`).
6. `TvSurfaceService` aggregates canonical reads into single-call guide and channel payloads.
7. Frontend TV views and chatbot TV retrieval consume these canonical reads instead of reconstructing schedule state from raw collections.

## Discovery and catalog flow

1. `CatalogService` merges TMDB-derived metadata, streaming provider availability, and TV-derived catalog items when needed.
2. `GetDiscoveryHome`, `GetDiscoveryBrowse`, and `SearchDiscoveryContent` expose UI-oriented payloads.
3. `ContentController` resolves detail requests through a single entry point:
   - TV items resolve from `tv_read_airings`
   - streaming items resolve from catalog/TMDB data

## Caching strategy

### L1 in-process cache

Used for very hot read paths:

- TV read queries
- TV detail queries
- catalog hot queries
- discovery surfaces

### L2 distributed cache

Redis/Valkey-compatible cache is used when configured for:

- serialized TV responses
- discovery surfaces
- catalog queries
- suggestion results
- AI/chat rate-limit counters

### Persistence-backed read models

Mongo read collections are the authoritative hot path for product requests:

- `tv_read_airings`
- catalog-derived data

The request path must not depend on live TMDB or provider calls for standard guide and discovery screens.

## Contract rules

- TV guide and channel pages must resolve in one backend call per view.
- Program cover images and logos are separate semantics.
- `assets.poster` and `assets.primary` must never degrade to channel or platform logos.
- Frontend-facing contracts must remain stable unless a compatibility path is added and documented.

## Deprecated and removed legacy surface

The following legacy TV routes are no longer part of the active frontend contract and were removed from the mounted route surface:

- `/v2/channels`
- `/v2/channels/:id/programs`
- `/v2/programs`
- `/v2/schedules/*`
- `/v2/layouts/*`
- `/v2/ssr/now-playing`

Where compatibility was still required by repository-local consumers, those consumers were migrated to canonical TV reads instead of reintroducing duplicate route families.

## Maintenance guidelines

- Add new frontend features through canonical read services or surface endpoints, not raw repository access from controllers.
- Keep one semantic source of truth per feature:
  - TV list and schedule state from `tv_read_airings`
  - streaming catalog state from `CatalogService`
  - unified detail from `ContentController`
- Document any contract change before merging it.
- Add regression tests when:
  - payload shape changes
  - pagination or limits change
  - image/logo mapping changes
  - guide/channel surfaces change
