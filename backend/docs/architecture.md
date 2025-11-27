# API v2 architecture (resumen)

- Clean Architecture (dominio/repos → casos de uso → controladores).
- Casos de uso principales:
  - `GetPrograms` (filtros canales/slots/país/tipo + layout).
  - `PrecomputeSchedule` (snapshots y cache de la ventana ayer/hoy/mañana/pasado).
  - `SyncEPGData` (ingesta XML, país/tipo inferidos, TMDB en ingestión).
  - `ResetSystem` (reset total: cache + colecciones + ficheros + re-sync/precompute).
- Datos:
  - `Channel`: incluye `country/countryCode`, `type` (TDT/Movistar/Autonomico/Cable/OTT), `region`.
  - `Program`: enriquecido en ingestión (rating/overview TMDB cuando aplica).
- Cache y storage:
  - Redis/in-memory para `/programs` (claves incluyen país y tipos).
  - Snapshots en `storage/schedules/*.json` + colección `schedules`.
- Admin:
  - `/admin/sync`, `/admin/precompute`, `/admin/precompute-window`, `/admin/cleanup`, `/admin/cache/clear`, `/admin/reset`.
