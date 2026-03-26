# Backend-for-Frontend Overview

## Purpose

The backend exposes a thin set of surface endpoints whose only job is to serve frontend-ready payloads with minimal client-side orchestration.

The BFF contract is built around:

- one request per primary view whenever possible
- canonical TV reads for all TV-derived screens
- unified content detail for both TV and streaming
- shared DTO semantics between frontend surfaces and chatbot recommendations

## Surface endpoints

### TV guide surface

- `GET /v2/tv/surface/guide`
- Used by the main TV guide page.
- Returns:
  - `nowItems`
  - `nextItems`
  - `nightItems`
  - `channels`
  - guide-level metadata

The frontend should not reconstruct the guide by chaining `/tv/read` plus multiple detail requests.

### Channel surface

- `GET /v2/tv/surface/channels/:channelId`
- Used by the channel detail page.
- Returns:
  - `channel`
  - `current`
  - `next`
  - `tonightItems`
  - `scheduleItems`
  - `relatedChannels`

### Discovery home surface

- `GET /v2/discovery/home`
- Used by the home page.
- Returns:
  - live TV rail
  - tonight TV rail
  - streaming rails
  - platform registry subset
  - personalized items when a user is authenticated

### Discovery browse surface

- `GET /v2/discovery/browse`
- Used by listing pages for movies and series.
- Returns catalog items, live TV complements, and filter metadata in one response.

### Unified search surface

- `GET /v2/discovery/search`
- Used by public search views and overlays.
- Merges TV and streaming results while keeping the response in a single `CatalogQueryResultDTO` shape.

### Unified content detail surface

- `GET /v2/content/:id`
- Used by all detail pages.
- Resolves:
  - TV airings from canonical TV read data
  - streaming items from catalog/TMDB data

## Core read endpoints behind the BFFs

The BFFs aggregate but do not replace the canonical read endpoints:

- `/v2/tv/read*`
- `/v2/catalog*`
- `/v2/content/*`

These remain important for:

- secondary UI consumers
- admin utilities
- chatbot retrieval
- debugging and contract inspection

## Response invariants

- TV covers and logos are not interchangeable.
- `image` must represent a real program/content visual.
- channel and platform logos are exposed separately.
- guide and channel surfaces must carry enough metadata for the frontend to avoid fan-out requests.
- empty arrays are preferred over `null` for collection fields.

## Cache strategy for surfaces

### Short-lived surfaces

- `/v2/tv/read?view=now`
- `/v2/discovery/search`
- AI/chatbot retrieval inputs

### Medium-lived surfaces

- `/v2/tv/surface/guide`
- `/v2/tv/surface/channels/:channelId`
- `/v2/discovery/home`
- `/v2/discovery/browse`

### Detail surfaces

- `/v2/content/:id`
- `/v2/catalog/:catalogId`

Detail routes can tolerate longer TTLs because they are less bursty and often backed by stable metadata.

## BFF migration outcome

The previous backend state mixed canonical reads, raw program routes, schedule routes, and UI-facing endpoints. That created contract drift and duplicated transformations.

The current direction is explicit:

- frontend views use surface endpoints first
- surface endpoints build on canonical read services
- raw legacy TV routes are no longer part of the active BFF surface

This is the contract that future frontend work must target.
