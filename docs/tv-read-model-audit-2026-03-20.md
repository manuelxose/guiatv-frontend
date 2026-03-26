# Auditoría TV / EPG / Chatbot / Frontend

Fecha: 2026-03-20

## Addendum 16:25 CET

Hallazgos confirmados tras el rework y la validación contra Mongo real:

- `La 2` queda ya normalizado como canal canónico `la_2`, `type: TDT`, `group: tdt`, `sortOrder: 1`, con aliases y `sourceIds` materializados.
- La colisión de `tv_read_airings.id` entre días consecutivos estaba causada por airings que cruzan medianoche y un `id` global no scopeado por `viewDate`. Quedó corregido.
- El sync TV lineal ya no depende de enriquecer TMDB ni de cachear logos remotos para rehacer la guía. Se añadieron flags operativos:
  - `SKIP_TMDB_ENRICHMENT=1`
  - `SKIP_CHANNEL_ICON_CACHE=1`
- La limpieza por `channelId + overlap window` quedó integrada en sync para reemplazar correctamente cada slice canal/día y expulsar datos legacy obsoletos.
- `Mañaneros 360` sigue revelando una corrupción real del feed primario `https://iptv-epg.org/files/epg-es.xml.gz`:
  - el snapshot de `20260320` contiene `44` programas con ese título en canales no relacionados
  - la fuente secundaria solo confirma `3` variantes (`La 1`, `La 1 Cataluña`, `La 1 Canarias`)
  - ninguna de las dos snapshots materializa poster real para ese programa en esta fecha
- Conclusión técnica: la ausencia de carátula para `Mañaneros 360` no era un bug de frontend/chatbot. El origen actual es una combinación de feed primario contaminado y falta de poster en las snapshots consultables de ambas fuentes para ese caso concreto.

## Resumen ejecutivo

Se ha corregido una incoherencia estructural del read model de TV. El problema no era un único bug aislado sino una cadena de fallos:

- canales nacionales persistidos sin identidad canónica ni aliases
- clasificación errónea de tipo de canal en Mongo
- snapshots/cache de schedule sirviendo metadatos obsoletos
- títulos de programas sin campos normalizados para matching y enriquecimiento
- contrato de lectura sin provenance ni fallback explícito de assets
- frontend/chatbot consumiendo datos parciales y aplicando lógica duplicada

Los dos casos guía confirman la raíz:

- `La 2` estaba persistida como `type: OTT`, `order: 0`, sin `normalizedName`, `aliases` ni `sourceIds`
- `Mañaneros 360` existía en la parrilla pero sin `image` ni `tmdbId`; el sistema tampoco exponía un fallback canónico visual ni provenance de assets

## Fase 1. Flujo actual y causas raíz

### Flujo real end-to-end

1. Ingesta EPG XML
2. Parseo de canales y programas
3. Matching/enriquecimiento TMDB
4. Persistencia Mongo en `channels`, `programs`, `schedules`
5. Lectura por `GetPrograms`, `GetProgramLayouts`, `CatalogService`, `ChatbotRecommend`
6. Consumo por Angular, SSR y chatbot

### Roturas detectadas

#### 1. Identidad de canal infra-normalizada

- El parser dejaba `LA 2` como display name y la configuración tenía override para `La 2`.
- La inferencia antigua no resolvía bien alias/casing y terminaba degradando algunos canales nacionales a `OTT`.
- Los documentos legacy de `channels` carecían de:
  - `normalizedName`
  - `aliases`
  - `sourceIds`

Impacto:

- filtros TDT inconsistentes
- ordenación nacional incorrecta
- consultas por nombre/alias frágiles
- respuestas distintas entre endpoints/snapshots/chatbot

#### 2. Snapshots de schedule obsoletos

- `schedules.channelMeta` seguía guardando metadatos antiguos.
- Los hot paths (`GetPrograms`, `GetProgramLayouts`) podían devolver tipo/icon/order viejos aunque `channels` se hubiera corregido.

Impacto:

- `La 2` podía seguir apareciendo mal aunque la colección `channels` estuviera ya bien
- filtros por tipo y orden TDT no eran fiables en respuestas cacheadas/precomputadas

#### 3. Matching editorial de programas insuficiente

- `programs` no persistía un read model canónico de título:
  - `normalizedTitle`
  - `titleAliases`
- El enriquecimiento TMDB era demasiado literal.

Impacto:

- matching pobre en variantes editoriales
- más probabilidad de perder reuse de enriquecimiento entre syncs

#### 4. Contrato de lectura sin asset fallback ni provenance

- El catálogo devolvía `image`/`backdrop` planos.
- No existía una estructura común para:
  - poster
  - backdrop
  - logo de canal
  - logo de plataforma
  - fallback chain
  - provenance por fuente

Impacto:

- cuando un programa no tenía poster real, chatbot/frontend solo veían `null`
- no había forma de saber si el asset venía de EPG, TMDB o del canal

#### 5. Frontend con lógica duplicada e inconsistente

- `content.service.ts` mantenía aliases locales de canales.
- `ahora-directo.component.ts` seguía corrigiendo horas manualmente.
- la tarjeta del chatbot no mostraba logo de canal/plataforma cuando faltaba poster

Impacto:

- divergencia entre backend y frontend
- riesgo de filtrar/malresolver `La 2`
- pérdida visual en recomendaciones sin poster

### Causas raíz exactas de los casos guía

#### `La 2`

Estado previo confirmado en Mongo:

- `id: la_2`
- `name: LA 2`
- `type: OTT`
- `order: 0`
- sin `normalizedName`
- sin `aliases`
- sin `sourceIds`

Raíz:

- canal nacional sin identidad canónica persistida
- inferencia antigua sensible a casing/alias
- snapshots de schedule manteniendo tipo viejo

#### `Mañaneros 360`

Estado previo confirmado en Mongo:

- existía en `programs`
- no tenía `image`
- no tenía `tmdbId`

Raíz:

- la fuente actual no está aportando poster persistible para ese programa
- el sistema no tenía fallback canónico visual ni provenance de assets
- el matching de títulos no estaba normalizado para futuras mejoras de enriquecimiento

Conclusión importante:

- hoy no se ha encontrado una carátula real persistida en las fuentes actuales del sistema
- la mejora correcta no era inventar una imagen, sino:
  - normalizar matching
  - persistir aliases
  - exponer fallback visual canónico
  - dejar preparado el flujo para capturar un poster válido si aparece en próximas ingestas o fuentes editoriales

## Fase 2. Nueva capa canónica de lectura

### Qué se precalcula

- identidad canónica de canal:
  - `normalizedName`
  - `aliases`
  - `sourceIds`
  - `type`
  - `sortOrder`
- identidad canónica de programa:
  - `normalizedTitle`
  - `titleAliases`

### Qué se cachea

- L1 en proceso:
  - `nowplaying:*`
  - `catalog:hot:*`
  - `catalog:channels:*`
  - overlay canónico de canales
- L2:
  - `catalog:query:*`
  - `schedule:*`
  - `precomputed:programs:*`
  - `channels:meta:v2`

### Qué se resuelve en lectura

- overlay canónico de canales sobre snapshots antiguos
- selección de asset primario y fallback chain
- provenance final de metadata/assets

### Contrato canónico de lectura añadido

En `CatalogItemDTO`:

- `assets`
- `sourceProvenance`
- `timingContext`
- `channel.normalizedName`
- `channel.aliases`
- `channel.sourceIds`
- `channel.type`
- `channel.region`

Objetivo:

- misma semántica para catálogo, chatbot y consumidores frontend

## Fase 3. Persistencia, índices y consultas

### Persistencia

Se añadieron/corrigieron:

- `channels.normalizedName`
- `channels.aliases`
- `channels.sourceIds`
- `programs.normalizedTitle`
- `programs.titleAliases`

### Índices

Se crearon o consolidaron:

- `programs.normalizedTitle + startTime`
- `programs.titleAliases + startTime`
- `channels.normalizedName + active`
- `channels.aliases + active`
- `channels.sourceIds + active`

### Reescrituras clave

- `MongoChannelRepository.findAll()` ahora postfiltra sobre tipo/región canónicos
- `MongoChannelRepository.findByNormalizedName()` usa campos canónicos y fallback scan legacy
- `MongoProgramRepository.findEnrichedByTitles()` ya usa `normalizedTitle` y `titleAliases`
- `SyncEPGData` carga matching por aliases y tipos normalizados

## Fase 4. Endpoints y caché

### Hot paths reforzados

- `GetNowPlaying`
- `GetPrograms`
- `CatalogService.query`

### Cambio clave

Las respuestas cacheadas/precomputadas de programación ya no dependen ciegamente del snapshot antiguo. Ahora se overlayan con metadatos canónicos de `channels`.

### Invalidez/invalidación

En sync forzado se limpian:

- `catalog:*`
- `schedule:*`
- `precomputed:programs:*`
- prefijos L1 `nowplaying:` y `catalog:hot:`

## Fase 5. Frontend y chatbot

### Frontend

Se adaptó el modelo de canal para aceptar:

- `normalizedName`
- `aliases`
- `sourceIds`
- `region`

Cambios:

- `ContentService` usa tokens/aliases canónicos para resolver canales
- `AhoraDirecto` deja de corregir horas manualmente

### Chatbot

Cambios:

- `platformLogo` prioriza `channelLogo/platformLogo` canónicos
- la tarjeta visual muestra logo de canal/plataforma cuando no hay poster real
- el catálogo ya entrega `assetPrimary` y provenance

Resultado:

- `Mañaneros 360` ya no cae en “sin contexto visual”; si no hay poster real, se usa logo de canal como fallback explícito

## Fase 6. Implementación aplicada

Archivos principales tocados:

- `apps/backend/src/shared/utils/tvMetadata.ts`
- `apps/backend/src/domain/entities/Channel.ts`
- `apps/backend/src/infrastructure/repositories/MongoChannelRepository.ts`
- `apps/backend/src/infrastructure/repositories/MongoProgramRepository.ts`
- `apps/backend/src/infrastructure/database/models/Channel.model.ts`
- `apps/backend/src/infrastructure/database/models/Program.model.ts`
- `apps/backend/src/application/use-cases/SyncEPGData.ts`
- `apps/backend/src/application/use-cases/GetPrograms.ts`
- `apps/backend/src/application/use-cases/GetProgramLayouts.ts`
- `apps/backend/src/application/services/CatalogService.ts`
- `apps/backend/src/application/use-cases/ChatbotRecommend.ts`
- `apps/backend/src/scripts/create-indexes.ts`
- `apps/backend/src/scripts/backfill-tv-read-model.ts`
- `apps/frontend/src/app/api/models.ts`
- `apps/frontend/src/app/state/tv-data.service.ts`
- `apps/frontend/src/app/state/content.service.ts`
- `apps/frontend/src/app/pages/ahora-directo/ahora-directo.component.ts`
- `apps/frontend/src/app/components/ai-chatbot/chat-recommendation-card/chat-recommendation-card.component.ts`

## Validación funcional

### Compilación

- backend: `npm --prefix apps/backend run build`
- backend tests: `npm --prefix apps/backend test`
- frontend: `npm --prefix apps/frontend run build`

### Migración ejecutada

Script ejecutado:

- `npm --prefix apps/backend run migrate:tv-read-model`

Resultado:

- `channelUpdates: 786`
- `programUpdates: 51822`
- `scheduleUpdates: 4`

### Índices ejecutados

Script ejecutado:

- `npm --prefix apps/backend run create-indexes`

### Estado final validado

#### `La 2`

Persistido tras migración:

- `type: TDT`
- `order: 1`
- `normalizedName: la_2`
- `aliases: [la_2, la2, la_dos, tve2]`
- snapshot schedule actualizado con `type: TDT`

#### `Mañaneros 360`

Persistido tras migración:

- `normalizedTitle: mananeros 360`
- `titleAliases: [mananeros 360, mananeros_360, mananeros]`
- sigue sin poster real persistido en las fuentes actuales
- el catálogo ahora devuelve:
  - `assetPrimary = channelLogo`
  - `sourceProvenance.assets = ['channel_icon']`

#### Validación de use cases

Resultado directo:

- `GetPrograms` para TDT/hoy devuelve `La 2` en el conjunto TDT
- `GetPrograms` para franja de noche mantiene el conjunto TDT coherente
- `CatalogService.query('Mañaneros 360')` devuelve el programa con fallback visual explícito
- `ChatbotRecommend` para “que hay ahora mismo en la tdt” devuelve recomendaciones deterministas con varias fichas y logos correctos de canal

## Riesgos residuales

- `Mañaneros 360` sigue sin poster real porque la fuente disponible hoy no lo aporta ni hay enriquecimiento persistido válido en sistema.
- Quedan índices legacy automáticos de Mongoose que conviven con los nuevos índices nombrados. No rompen funcionalidad, pero pueden limpiarse en una pasada de mantenimiento posterior.
- El chatbot sigue teniendo tablas locales de prioridad editorial por canal. Ahora son mucho más fiables porque el canal canónico llega bien, pero a futuro conviene mover esa prioridad a configuración central.

## Próximos pasos con valor real

- incorporar una política formal de asset fusion para fuentes no-TMDB específicas de TV lineal
- añadir endpoint dedicado `tv/hot` para `now/today/tonight` si se quiere reducir aún más la lógica en consumidores
- añadir observabilidad por provenance de asset y porcentaje de resultados sin poster real
