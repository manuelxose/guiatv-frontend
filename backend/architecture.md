# TV Guide Backend (v2) - Arquitectura y flujos clave

## Capas principales
- **Presentación (routes/controllers)**: delegan en casos de uso. `ProgramController` sirve `/programs`, `/programs/:id`, `/channels/:id/programs`. `AdminController` expone `/admin/sync`, `/admin/precompute`, `/admin/precompute-window`, `/admin/cleanup`, `/admin/cache/clear` y `/admin/reset`.
- **Aplicación (use-cases)**:
  - `GetPrograms`: normaliza alias de fecha, arma claves de caché (incluye `country` y `channelTypes`), filtra por canales, franja, país y tipo, pagina y compone layout (`ProgramLayoutBuilder`). Usa snapshots/precomputados cuando es posible.
  - `PrecomputeSchedule`: precalcula ayer/hoy/mañana/pasado (JSON en `storage/schedules/*.json` + colección `schedules`) y calienta `precomputed:programs`/`schedule:json`.
  - `SyncEPGData`: descarga/parsing XML, infiere país/código y tipo (TDT/Movistar/Autonomico/Cable/OTT), enriquece con TMDB en ingestión y guarda en Mongo.
  - `ResetSystem`: reseteo completo (cache + colecciones + ficheros `epg_xml/` y `schedules/`), re-sincroniza ventana y precalcula.
  - `CleanOldPrograms`: limpia histórico con backfill opcional.
- **Dominio**: `Channel` (id, name, icon, type, country/countryCode, region, isActive), `Program`. Repositorios `IChannelRepository`, `IProgramRepository`, `ICacheRepository`, `IStorageRepository`.
- **Infraestructura**: repos Mongo, cache (Redis/InMemory), storage (local/S3), parsers XML/ProgramData, `TMDBService`.

## Flujo de datos
1) **Ingesta (SyncEPGData)**: descarga y guarda XML, parsea canales/programas, infiere país/tipo, enriquece TMDB, persiste en Mongo, limpia backups antiguos.
2) **Precompute**: usa `GetPrograms` para construir layout y snapshots; guarda en storage/Mongo y cachea.
3) **Serving**: `GetPrograms` sirve desde cache/snapshot o Mongo; soporta filtros `channels`, `timeSlot`, `country`, `channelTypes`, `fields`, `page/limit`.
4) **Reset**: `/admin/reset` llama `ResetSystem` para limpiar cache + colecciones + ficheros y rehacer sync/precompute de la ventana ayer/hoy/mañana/pasado.

## Cache y contratos
- Claves de `/programs` incluyen `date`, `channels`, `timeSlot`, `fields`, `page/limit`, `country`, `channelTypes`.
- Respuesta estándar: `{ date, timeSlots, channels: [{id,name,icon?,type?,country?,countryCode?}], programs: ProgramLayoutDTO[], meta }`.
- Ventana canónica (ayer/hoy/mañana/pasado) recomendada para precálculo diario; subir `LAYOUT_VERSION` al cambiar layout y recalentar.

## BFF / Discovery (en progreso)
- Nuevas rutas sobre la capa existente: /v2/discovery/home, /v2/discovery/search, /v2/content/:id, /v2/content/batch, /v2/tv/now, /v2/tv/schedule.
- Se apoyan en GetPrograms/GetNowPlaying y entregan DTOs ligeros para vistas (MediaCardDTO, HomeViewDTO, MediaDetailDTO).
- Cache corto configurable por env: home 120s (DISCOVERY_HOME_CACHE_TTL_SEC), detalle 1800s (CONTENT_DETAIL_CACHE_TTL_SEC).

