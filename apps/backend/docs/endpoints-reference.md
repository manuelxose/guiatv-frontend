# Endpoint Reference

## Base URLs

- Local: `http://localhost:4000/v2`
- Production: `https://guiaprogramaciontv.com/v2`

## Response envelope

Successful responses:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-03-26T10:00:00.000Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid"
  },
  "meta": {
    "timestamp": "2026-03-26T10:00:00.000Z"
  }
}
```

## Date aliases

Supported aliases:

- `yesterday`
- `today`
- `tomorrow`
- `after_tomorrow`
- `YYYYMMDD`
- `YYYY-MM-DD`

## Public health endpoint

### `GET /health`

Purpose:

- operational health check

Authentication:

- none

Response highlights:

- `data.status`
- `data.timestamp`
- `data.uptime`
- `data.version`
- `data.memory`

## Canonical TV endpoints

### `GET /tv/read`

Purpose:

- canonical TV read-model query for guide, now, next, night, and search use cases

Authentication:

- none

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `view` | no | `day`, `now`, `next`, `night`, `search` |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |
| `group` | no | `tdt`, `autonomico`, `movistar`, `online`, `deporte` |
| `category` | no | editorial category such as `Cine` or `Series` |
| `channelId` | no | canonical channel id |
| `q` | no | search term |
| `limit` | no | bounded by view policy; `day` supports large guide reads |
| `cursor` | no | offset-style cursor |

Response shape:

- `data.date`
- `data.view`
- `data.items[]`
- `data.channels[]`
- `data.filters`
- `data.meta.total`
- `data.meta.limit`
- `data.meta.nextCursor`
- `data.meta.generatedAt`

Important semantics:

- `assets.poster` and `assets.primary` never degrade to channel or platform logos
- guide-scale reads depend on `view=day`

### `GET /tv/read/channels`

Purpose:

- read channel summaries for a date and optional channel group

Authentication:

- none

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |
| `group` | no | canonical channel group |

Response shape:

- `data.date`
- `data.group`
- `data.channels[]`
- `data.meta.total`

### `GET /tv/read/channels/:channelId`

Purpose:

- read canonical TV items filtered to a single channel

Authentication:

- none

Path parameters:

| Name | Description |
| --- | --- |
| `channelId` | canonical channel id |

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |
| `view` | no | `day`, `now`, `next`, `night`, `search` |

### `GET /tv/read/items/:airingId`

Purpose:

- read one canonical TV airing plus related items from the same channel

Authentication:

- none

Response shape:

- `data.item`
- `data.relatedChannelItems[]`
- `data.meta.generatedAt`

## TV surface endpoints

### `GET /tv/surface/guide`

Purpose:

- single-call BFF for the main TV guide page

Authentication:

- none

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |
| `group` | no | canonical channel group |
| `category` | no | editorial category |

Response shape:

- `data.date`
- `data.filters`
- `data.nowItems[]`
- `data.nextItems[]`
- `data.nightItems[]`
- `data.channels[]`
- `data.meta.totalChannels`
- `data.meta.totalItems`

### `GET /tv/surface/channels/:channelId`

Purpose:

- single-call BFF for a channel page

Authentication:

- none

Path parameters:

| Name | Description |
| --- | --- |
| `channelId` | canonical channel id |

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |

Response shape:

- `data.channel`
- `data.current`
- `data.next`
- `data.tonightItems[]`
- `data.scheduleItems[]`
- `data.relatedChannels[]`
- `data.meta.totalItems`

## Discovery endpoints

### `GET /discovery/home`

Purpose:

- home surface with live TV and streaming rails

Authentication:

- optional

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |

Response shape:

- `data.personalized[]`
- `data.platformItems[]`
- `data.freeItems[]`
- `data.liveItems[]`
- `data.tonightItems[]`
- `data.trendingItems[]`
- `data.platforms[]`
- `data.generatedAt`

### `GET /discovery/browse`

Purpose:

- movie or series browse surface for listing pages

Authentication:

- optional

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `type` | yes | `movie` or `series` |
| `q` | no | free-text query |
| `genre` | no | comma-separated genres |
| `platform` | no | comma-separated platforms |
| `availability` | no | comma-separated availability filters |
| `sort` | no | `popular`, `rating`, `recent`, `airtime`, `personalized` |
| `page` | no | 1-based page |
| `limit` | no | page size |

Response shape:

- `data.contentType`
- `data.items[]`
- `data.liveItems[]`
- `data.availableGenres[]`
- `data.availablePlatforms[]`
- `data.meta`
- `data.generatedAt`

### `GET /discovery/search`

Purpose:

- unified search over TV and streaming content

Authentication:

- optional

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `q` | yes | search term |
| `date` | no | TV date context |
| `genre` | no | single genre filter |
| `platform` | no | single platform filter |
| `type` | no | `all`, `tv`, `program`, `movie`, `series` |
| `page` | no | 1-based page |
| `limit` | no | max 60 |

Response shape:

- `data.items[]`
- `data.meta`
- `data.availableGenres[]`
- `data.availablePlatforms[]`

## Catalog endpoints

### `GET /catalog`

Purpose:

- query the streaming catalog and editorial availability dataset

Authentication:

- optional

Important semantics:

- default content types are `movie` and `series`
- TV linear guide state should come from `/tv/read*`

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `q` | no | free-text query |
| `types` | no | comma-separated `movie`, `series`, `program` |
| `genres` | no | comma-separated genres |
| `platforms` | no | comma-separated platforms |
| `availability` | no | comma-separated availability filters |
| `date` | no | date alias, `YYYYMMDD`, or `YYYY-MM-DD` |
| `timeSlot` | no | optional TV time slot |
| `sort` | no | `popular`, `rating`, `recent`, `airtime`, `personalized` |
| `page` | no | 1-based page |
| `limit` | no | page size |

Response shape:

- `data.items[]`
- `data.meta`
- `data.availableGenres[]`
- `data.availablePlatforms[]`

### `GET /catalog/platforms`

Purpose:

- return the canonical streaming platform registry

Authentication:

- none

### `GET /catalog/suggest`

Purpose:

- autocomplete and search overlay suggestions

Authentication:

- optional

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `q` | yes | search term |
| `limit` | no | number of suggestions |

### `GET /catalog/slug/:contentType/:slug`

Purpose:

- resolve SEO slugs to a catalog detail payload

Authentication:

- optional

### `GET /catalog/:catalogId`

Purpose:

- resolve a catalog detail by canonical catalog id

Authentication:

- optional

## Unified content endpoints

### `GET /content/:id`

Purpose:

- unified detail endpoint for TV and streaming content

Authentication:

- optional

Behavior:

- catalog ids resolve through `CatalogService`
- non-catalog ids fall back to the program detail flow

### `GET /content/batch`

Purpose:

- batch content detail retrieval

Authentication:

- none

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `ids` | yes | comma-separated ids |

### `GET /content/providers/:contentType/:tmdbId`

Purpose:

- direct provider availability lookup

Authentication:

- none

Path parameters:

| Name | Description |
| --- | --- |
| `contentType` | `movie` or `tv` |
| `tmdbId` | numeric TMDB id |

## AI/chat endpoints used by the frontend chatbot

All AI endpoints require authentication.

### `POST /ai/chat`

Purpose:

- non-streaming chatbot recommendation response

Request body:

```json
{
  "conversationId": "optional",
  "messages": [
    { "role": "user", "content": "What can I watch tonight?" }
  ]
}
```

### `POST /ai/chat/stream`

Purpose:

- streaming chatbot response via SSE

Response events:

- `ping`
- `text`
- `result`
- `error`
- `done`

### `GET /ai/chat/history`
### `POST /ai/chat/history`
### `DELETE /ai/chat/history`

Purpose:

- persist and retrieve assistant history

### `PATCH /ai/memory`

Purpose:

- update stored assistant preference memory

### `GET /ai/conversations`
### `GET /ai/conversations/search`
### `GET /ai/conversations/:conversationId`
### `PATCH /ai/conversations/:conversationId`
### `DELETE /ai/conversations/:conversationId`
### `POST /ai/conversations/:conversationId/feedback`
### `POST /ai/reminders`

Purpose:

- conversation management and reminder flows used by the chatbot UI

## Removed legacy routes

These routes are no longer mounted and should not be consumed by the frontend:

- `/v2/channels`
- `/v2/channels/:id/programs`
- `/v2/programs`
- `/v2/schedules/*`
- `/v2/layouts/*`
- `/v2/ssr/now-playing`

They were removed because they duplicated the canonical TV read surface and caused backend/frontend contract drift.
