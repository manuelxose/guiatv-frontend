# Guía TV API v2 (BFF) - README Completo

> Estado: Activo. Última actualización: 2025-12-05  
> Stack: Node.js 22, TypeScript, Express, MongoDB, Redis (opcional), Axios

## Índice rápido
- [Visión general](#visión-general)
- [Entorno y configuración](#entorno-y-configuración)
- [Arranque y scripts](#arranque-y-scripts)
- [Dominios y endpoints](#dominios-y-endpoints)
- [Contratos de respuesta](#contratos-de-respuesta)
- [Cache, precálculo e índices](#cache-precálculo-e-índices)
- [Arquitectura interna](#arquitectura-interna)
- [Errores y formato estándar](#errores-y-formato-estándar)
- [Notas SSR y BFF](#notas-ssr-y-bff)
- [FAQ de despliegue](#faq-de-despliegue)

---

## Visión general
API unificada orientada a vistas (BFF) para Guía TV. Expone:
- **Discovery**: home agregada (Now/Qué ver/Blog), búsqueda unificada.
- **Content**: ficha de contenido lineal (programas) con expansiones.
- **TV**: parrilla y “qué hay ahora”.
- **Legacy core**: channels/programs/layouts/schedules, admin y SSR.

### Tech principales
- Express + middlewares (CORS, compresión, rate limit general).
- MongoDB con Mongoose (programs, channels, schedules, users).
- Redis opcional como cache (memoria por defecto).
- Axios para TMDB y Blog.
- Jobs cron (sync EPG, precompute, cleanup) cuando se requiere.

---

## Entorno y configuración
Variables clave (ver `.env.example`):
- `PORT` (por defecto 8080)
- `MONGODB_URI`
- `CACHE_TYPE` (`redis` | `memory`), `REDIS_URL`
- `STORAGE_ADAPTER` (`local`|`s3`) y credenciales S3 si aplica
- `TMDB_API_KEY` (en ingestion)
- `JWT_SECRET`, `GOOGLE_CLIENT_ID` (auth)
- `BLOG_API_URL` (ej: `https://blog.guiatv.com/api`) para highlights
- TTLs:
  - `PROGRAMS_CACHE_TTL_SEC` (default 300)
  - `DISCOVERY_HOME_CACHE_TTL_SEC` (default 120)
  - `CONTENT_DETAIL_CACHE_TTL_SEC` (default 1800)
- Layout:
  - `LAYOUT_VERSION` (para invalidar snapshots)

### Mock de blog
Si `BLOG_API_URL` falla o devuelve vacío, se sirven 3 posts mock por defecto.

---

## Arranque y scripts
```bash
cd backend
npm install
npm run build           # tsc + tsc-alias
npm start               # node dist/server/index.js

# Desarrollo
npm run dev             # build + start
npm run build:watch

# Jobs
npm run job:syncEPG
npm run job:precompute
npm run job:clean
```

Swagger: `/v2/docs` (UI) y `/v2/docs/json`.
Health: `/health` y `/v2/admin/health` (detallado).

---

## Dominios y endpoints
Base URL local: `http://localhost:<PORT>/v2`

### Discovery & Content (BFF)
- Ejemplos:
  - `curl "http://localhost:8080/v2/discovery/home?date=today&channelTypes=TDT,AUTONOMICO"`
  - `curl "http://localhost:8080/v2/discovery/search?q=thriller&genre=crime&limit=20&page=1"`
- `GET /discovery/home`
  - Query: `date?` (alias `today|yesterday|tomorrow|after_tomorrow|YYYYMMDD`), `country?`, `channelTypes?` (CSV), `timeSlot?`, `fields? (minimal|full)`
  - Retorna `HomeViewDTO` con hero, qué ver hoy, en directo y `blogHighlights`.
  - Cache: TTL corto (default 120s).
- `GET /discovery/search`
  - Query: `q` (requerido), `date?`, `genre?`, `platform?` (mapea a tipo de canal), `type?` (por ahora solo `program`), `limit?` (<=200), `page?` (>=1), `country?`, `channelTypes?` (CSV)
  - Busca en Mongo con filtros y devuelve `items: MediaCardDTO[]` + meta `total/page/limit/date`.
- `GET /content/:id`
  - Query: `expand?=related,schedule` (CSV)
  - Retorna `MediaDetailDTO` con `whereToWatch` (lineal + VOD si hay datos), `socialSummary`, `related`, `schedule`.
  - Cache: TTL default 1800s.
- `GET /content/batch?ids=1,2,3`
  - Hidratación rápida de tarjetas; devuelve `{ items: MediaCardDTO[], notFound: [] }`.

### TV (lineal)
- Ejemplos:
  - `curl "http://localhost:8080/v2/tv/now"`
  - `curl "http://localhost:8080/v2/tv/schedule?date=today&channelTypes=TDT&timeSlot=6&limit=500"`
- `GET /tv/now`
  - Programas en emisión por canal. Usa `GetNowPlaying`.
- `GET /tv/schedule`
  - Query: `date` (alias/fecha), `channel?`, `channels?` (CSV), `time_window?` o `timeSlot?`, `fields?`, `limit?`, `country?`, `channelTypes?`
  - Retorna `timeSlots`, canales y `ProgramLayoutDTO[]` (misma forma que `/programs`).

### Legacy core (v2 ya existente)
- Ejemplos:
  - `curl "http://localhost:8080/v2/programs?date=today&channelTypes=TDT&limit=5000"`
  - `curl "http://localhost:8080/v2/channels/la-1/programs?date=today&fields=minimal"`
  - `curl "http://localhost:8080/v2/programs/prog-123"`
- `GET /channels`
- `GET /channels/:id/programs`
- `GET /programs`
  - Query: `date` (required), `channels?`, `timeSlot?`, `fields? (minimal|full)`, `page?`, `limit?`, `country?`, `channelTypes?`
- `GET /programs/:id`
- `GET /schedules/:date`
- `GET /schedules/:date/channels`
- `GET /layouts/:date`
- `GET /ssr/now-playing`

### Admin (proteger en prod)
- Ejemplos (requieren protección en producción):
  - `curl -X POST "http://localhost:8080/v2/admin/sync" -H "Content-Type: application/json" -d '{"date":"today","forceRefresh":true}'`
  - `curl -X POST "http://localhost:8080/v2/admin/precompute-window" -H "Content-Type: application/json" -d '{"fields":"minimal"}'`
  - `curl -X POST "http://localhost:8080/v2/admin/cache/clear" -H "Content-Type: application/json" -d '{"pattern":"precomputed:*"}'`
- `POST /admin/sync` (ingesta XML EPG)
- `POST /admin/precompute`
- `POST /admin/precompute-window`
- `POST /admin/cleanup`
- `POST /admin/cache/clear`
- `POST /admin/reset`
- `GET /admin/health`

> **Nota sobre Timeouts**: Los procesos de sync, precompute y reset pueden ser muy largos (> 60s).  
> Para evitar errores de timeout HTTP (504) o bloqueo, **se recomienda usar el parámetro `async: true`** en el body JSON.  
> Esto devolverá inmediatamente un `202 Accepted` y el proceso continuará en background.
> Ejemplo:
> ```bash
> curl -X POST "http://localhost:8080/v2/admin/reset" \
>      -H "Content-Type: application/json" \
>      -d '{"async":true}'
> ```

### Auth (Google OAuth)
- Ejemplos:
  - `curl -X POST "http://localhost:8080/v2/auth/google" -H "Content-Type: application/json" -d '{"token":"<google_id_token>"}'`
  - `curl "http://localhost:8080/v2/auth/me" -H "Authorization: Bearer <jwt>" `
- `POST /auth/google` (intercambio token Google -> JWT local)
- `GET /auth/me` (perfil usando JWT)

---

## Contratos de respuesta
Formato estándar:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "ISO",
    "cached": true,
    "total": 123
  },
  "error": { "code": "...", "message": "...", "details": {} }
}
```

### DTOs BFF
`MediaCardDTO`
```json
{
  "id": "movie_123",
  "type": "program",
  "title": "Inception",
  "subtitle": "22:00-00:10 • Antena 3 • Sci-Fi",
  "image": { "url": "https://...", "aspectRatio": 0.67 },
  "badges": ["TDT", "Sci-Fi"],
  "rating": { "average": 8.8, "count": 2500 },
  "context": {
    "schedule": {
      "channel": "Antena 3",
      "channelId": "antena_3",
      "start": "2025-11-27T21:00:00.000Z",
      "end": "2025-11-27T23:00:00.000Z",
      "live": true,
      "progressPercent": 45
    },
    "userInteraction": { "inWatchlist": false, "seen": false, "liked": false }
  }
}
```

`MediaDetailDTO`
```json
{
  "id": "prog_123",
  "type": "program",
  "title": "Inception",
  "subtitle": "22:00-00:10 • Antena 3 • Sci-Fi",
  "image": { "url": "...", "aspectRatio": 0.67 },
  "whereToWatch": [
    { "provider": "Antena 3", "price": "linear" },
    { "provider": "Netflix", "link": "https://...", "price": "flatrate" }
  ],
  "socialSummary": {
    "friendsRating": 8.3,
    "topReview": { "user": "jdoe", "text": "Muy buena" }
  },
  "related": [/* MediaCardDTO[] */],
  "schedule": [/* MediaCardDTO[] */],
  "ratings": { "average": 8.8, "count": 2500 }
}
```

`HomeViewDTO`
```json
{
  "hero": [/* MediaCardDTO[] */],
  "whatToWatch": { "title": "Qué ver hoy", "items": [/* MediaCardDTO[] */] },
  "liveNow": { "title": "En directo", "items": [/* MediaCardDTO[] */] },
  "blogHighlights": [
    { "title": "Top 10 series...", "slug": "top-10-series-maraton", "excerpt": "...", "image": { "url": "...", "aspectRatio": 1.6 } }
  ],
  "generatedAt": "ISO"
}
```

`ProgramLayoutDTO` (resumen)
- Campos principales: `id`, `channelId`, `title`, `start`, `end`, `durationMinutes`, `category`, `image?`, `description?`, `rating?`, `timeSlotIndex`, `gridColumnStart/End`, `layerIndex`, `visibleStartTime/visibleEndTime`, `crossesMidnight`, `pxStart/pxWidth`, `layoutsBySlot[]`.

---

## Cache, precálculo e índices
### Cache HTTP / CDN (recomendado)
- `/tv/now`: 30s
- `/discovery/home`: 1-5 min (TTL corto)
- `/content/{id}`: 1h + SWR
- `/tv/schedule` y `/programs`: 5-10 min (o controlado por env)

### Cache server (Redis/memoria)
- `precomputed:programs:<date>:<fields>` (programas completos)
- `schedule:json:<date>:<fields>` (snapshot precalculado)
- `channels:meta:v2`
- TTL por defecto 300s (ajustable)

### Precálculo
- Jobs `/admin/precompute` y `/admin/precompute-window` generan:
  - JSON en `storage/schedules/<date>.json`
  - Documentos en colección `schedules`
  - Calientan cache `precomputed:*` y `schedule:json:*`

### Índices Mongo (programs)
- Básicos: `{id}`, `{channelId,startTime}`, `{startTime,endTime}`, `{date,startMinutes}`, `{date,channelId,startTime}`, `{timeSlotIndex}`, `{channelId,category,startTime}`
- Texto: `{ title: 'text', description: 'text', category: 'text' }` (para search)

---

## Arquitectura interna
- **Presentación**: controllers + routes. Nuevos controllers BFF: `DiscoveryController`, `ContentController`, `TvController`. Legacy: `ProgramController`, `ChannelController`, `LayoutController`, `ScheduleController`, `AdminController`, `SSRController`, `AuthController`.
- **Aplicación (use-cases)**:
  - `GetDiscoveryHome` (home agregada + blog)
  - `SearchDiscoveryContent` (búsqueda Mongo)
  - `GetContentDetail`, `GetContentBatch`
  - `GetPrograms`, `GetProgramById`, `GetProgramLayouts`
  - `GetNowPlaying`
  - `SyncEPGData`, `PrecomputeSchedule`, `ResetSystem`, `CleanOldPrograms`
- **Servicios**:
  - `ProgramLayoutBuilder` (layouts CSS grid + px)
  - `ProgramDeduplicator`
  - Externos: `TMDBService`, `BlogService`
- **Infraestructura**:
  - Repos Mongo: `MongoProgramRepository`, `MongoChannelRepository`
  - Cache: Redis o InMemory
  - Storage: local o S3
  - Parsers: XML EPG
- **DI Container**: registra repos, servicios, use-cases, controllers; sync de índices en arranque.

---

## Errores y formato estándar
- `ValidationError` → 400
- `NotFoundError` → 404
- `Unauthorized` → 401, `Forbidden` → 403, `Conflict` → 409, `TooManyRequests` → 429
- `ServiceUnavailable` → 503
- Respuesta de error:
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Program not found", "details": { "id": "x" } },
  "meta": { "timestamp": "ISO" }
}
```

---

## Notas SSR y BFF
- Para SSR, inyectar `HomeViewDTO` en `window.__INITIAL_STATE__` para evitar doble fetch.
- `/discovery/home` ya agrega `blogHighlights` (usa mocks si el blog no responde).
- Componentes de comentarios/reviews deben cargarse lazy en cliente para no bloquear SSR.
- Interacciones sociales (like/follow/rate) se esperan optimistas en cliente; la API expone `/interactions` en el futuro (no implementado aún).

---

## FAQ de despliegue
- **¿Qué necesito para que funcione el blog?**  
  Exporta `BLOG_API_URL=https://blog.guiatv.com/api`. Si no responde, se devuelven 3 posts mock; no rompe la home.

- **¿Cómo valido que los índices están aplicados?**  
  El arranque llama `ensureMongoCollectionsAndIndexes()`. Si despliegas con procesos separados, ejecuta una vez el servidor o corre `ProgramModel.syncIndexes()` manualmente.

- **¿Qué datos guarda VOD/social?**  
  Guarda en `program.details`:
  - `vodProviders: [{ provider, link?, price? }]`
  - `socialMetrics: { friendsRating?, topReview?, ratingCount?, average? }`
  El mapper de detalle los consume automáticamente.

- **¿Cómo recaliento precálculo?**  
  `POST /v2/admin/precompute-window` con `fields=minimal` y luego limpiar cache con `/v2/admin/cache/clear` (`pattern=precomputed:*`).

- **¿Dónde cambian las constantes de layout?**  
  `ProgramLayoutBuilder` define slots (8 bloques de 3h), `MINUTES_PER_COLUMN=5`, `PIXELS_PER_HOUR=240`, etc. Cambia `LAYOUT_VERSION` para invalidar snapshots.
