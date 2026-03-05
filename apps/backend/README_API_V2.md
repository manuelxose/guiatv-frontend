# Guía TV API v2 (BFF) - Manual de Referencia

> **Estado**: Activo  
> **Versión**: 2.0.0  
> **Stack**: Node.js 22, TypeScript, Express, MongoDB, Valkey (opcional), Axios

Este documento sirve como referencia completa para la API v2 de Guía TV. Esta API actúa como un **Backend-For-Frontend (BFF)** unificado, optimizado para vistas de cliente modernas, además de mantener compatibilidad con endpoints _legacy_ para funcionalidades del núcleo.

---

## Índice

1. [Visión General](#visión-general)
2. [Configuración y Despliegue](#configuración-y-despliegue)
3. [Scripts de Gestión](#scripts-de-gestión)
4. [Dominios y Endpoints](#dominios-y-endpoints)
    - [Discovery (Home & Search)](#discovery-home--search)
    - [Content (Detalle & Batch)](#content-detalle--batch)
    - [TV (Directo & Parrilla)](#tv-directo--parrilla)
    - [Interactive (Auth & User)](#interactive-auth--user)
    - [Blog / CMS](#blog--cms)
    - [Legacy Core](#legacy-core)
    - [Admin & Operaciones](#admin--operaciones)
5. [Contratos de Datos (DTOs)](#contratos-de-datos-dtos)
6. [Estrategia de Cache y Rendimiento](#estrategia-de-cache-y-rendimiento)
7. [Manejo de Errores](#manejo-de-errores)

---

## Visión General

La API v2 centraliza la lógica de negocio y presentación para clientes web y móviles.

- **Discovery**: Agrega contenido de diversas fuentes (EPG, Blog, TMDB) para la portada y búsqueda.
- **Content**: Enriquece la información de programas con metadatos VOD, sociales y relacionados.
- **TV**: Gestión eficiente de la parrilla lineal y estado "en vivo".
- **Performance**: Uso intensivo de *precálculo* (JSON estáticos) para ventanas de tiempo canónicas (ayer, hoy, mañana).

---

## Configuración y Despliegue

Variables de entorno críticas (ver `.env.example`):

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto de escucha | `8080` |
| `MONGODB_URI` | Conexión a MongoDB | - |
| `CACHE_TYPE` | Tipo de caché (`memory` o `valkey`) | `memory` |
| `REDIS_URL` | URL de conexión Valkey | - |
| `TMDB_API_KEY` | API Key para enriquecimiento de metadatos | - |
| `BLOG_API_URL` | URL del CMS externo (WordPress/Headless) | - |
| `JWT_SECRET` | Secreto para firma de tokens de sesión | - |
| `STORAGE_ADAPTER`| Almacenamiento de archivos (`local` o `s3`) | `local` |

### Notas de Producción
- **Indices**: Al arrancar, el sistema verifica y crea los índices de MongoDB necesarios (`metrics.ensureMongoCollectionsAndIndexes`).
- **Storage**: En modo `local`, los archivos se sirven desde `/storage` (mapeado estáticamente). En `s3`, se generan URLs firmadas o públicas.

---

## Scripts de Gestión

```bash
# Instalación y Build
npm install
npm run build           # Compila TS y resuelve alias

# Ejecución
npm start               # Inicia servidor (dist/server/index.js)
npm run dev             # Modo desarrollo (watch)

# Jobs Manuales (Cron)
npm run job:syncEPG     # Sincroniza EPG (descarga + parseo + guardado)
npm run job:precompute  # Genera JSONs estáticos de parrilla
npm run job:clean       # Limpia programas antiguos
```

---

## Dominios y Endpoints

Base URL: `http://host:port/v2`  
Header opcional: `x-api-key` (si se configura protección global).

### Discovery (Home & Search)

Endpoints orientados a la exploración de contenido.

#### `GET /discovery/home`
Obtiene la vista agregada de la portada.
- **Query Params**:
  - `date`: `today` (default), `tomorrow`, `YYYYMMDD`.
  - `channelTypes`: Filtro de canales (ej: `TDT,AUTONOMICO`).
- **Respuesta (`HomeViewDTO`)**:
  - `hero`: Elementos destacados para el carrusel principal.
  - `whatToWatch`: Recomendaciones del día ("Qué ver hoy").
  - `liveNow`: Programas destacados en emisión actual.
  - `blogHighlights`: Últimas noticias del blog.
- **Cache**: TTL corto (120s).

#### `GET /discovery/search`
Búsqueda unificada de contenido.
- **Query Params**:
  - `q`: Término de búsqueda (requerido).
  - `limit`: Resultados por página (max 200).
  - `page`: Paginación.
  - `genre`, `category`: Filtros opcionales.
- **Respuesta**: Lista paginada de `MediaCardDTO`.

### Content (Detalle & Batch)

Endpoints para fichas de contenido y listas agregadas.

#### `GET /content/:id`
Detalle completo de un programa o contenido.
- **Path Params**: `id` (ID del programa).
- **Query Params**:
  - `expand`: CSV opcional (`related,schedule`).
- **Respuesta (`MediaDetailDTO`)**:
  - Datos básicos + imágenes de alta calidad (TMDB).
  - `whereToWatch`: Opciones de visualización (Canal lineal, Plataformas VOD).
  - `schedule`: Próximas emisiones.
- **Cache**: TTL medio (30 min).

#### `GET /content/batch`
Hidratación masiva de tarjetas (para favoritos o historiales).
- **Query Params**: `ids` (CSV de IDs).
- **Respuesta**: `{ items: MediaCardDTO[], notFound: string[] }`.

### TV (Directo & Parrilla)

#### `GET /tv/now`
Estado actual de la parrilla ("Ahora en TV").
- **Respuesta**: Lista de canales con su programa actual y el siguiente.
- **Cache**: TTL muy corto (30s) o nulo.

#### `GET /tv/schedule`
Parrilla de programación completa.
- **Query Params**:
  - `date`: `today`, `tomorrow`, `YYYYMMDD`.
  - `channelTypes`: Filtra canales (TDT, CABLE, etc).
  - `timeSlot`: Filtro por franja horaria (0-7).
- **Respuesta**: Estructura optimizada para renderizado de parrilla (TimeSlots + Canales + Programas posicionados).
- **Optimización**: Intenta servir desde JSON precalculado (`storage/schedules/`) para velocidad máxima.

### Interactive (Auth & User)

#### `POST /auth/google`
Login social con Google.
- **Body**: `{ "token": "google_id_token" }`
- **Respuesta**: `{ "token": "jwt_access_token", "user": { ... } }`

#### `GET /auth/me`
Obtiene el perfil del usuario actual.
- **Headers**: `Authorization: Bearer <jwt_token>`

#### `POST /auth/logout`
Cierra la sesión (idealmente invalida token si se usa lista negra).

### Blog / CMS

Endpoints proxy o mock para contenido editorial. Accesibles bajo ruta raíz `/blog` (no `/v2/blog`).

#### `GET /blog`
Lista de posts recientes.
- **Query**: `slug` (para detalle), `limit`.

#### `GET /blog/categories`
Lista de categorías del blog.

### Legacy Core

Endpoints RESTful clásicos sobre recursos base. Útiles para integraciones directas.

- `GET /channels`: Listado de canales.
- `GET /programs`: Búsqueda cruda de programas (sin DTOs de vista UI).
- `GET /schedules/:date`: Raw schedule data.

### Admin & Operaciones

Endpoints de mantenimiento. **Proteger en producción**.

> **Nota Async**: Todos los endpoints de escritura/proceso (`POST`) aceptan el parámetro `"async": true` en el body. Esto devuelve inmediatamente un `202 Accepted` y ejecuta la tarea en segundo plano, evitando timeouts HTTP en operaciones largas.

#### `POST /admin/sync`
Fuerza la descarga y procesado del EPG.
- **Body**: `{ "date": "today", "forceRefresh": true, "async": true }`

#### `POST /admin/precompute`
Genera los JSON estáticos para una fecha.
- **Body**: `{ "date": "today", "async": true }`

#### `POST /admin/precompute-window`
Genera JSONs para toda la ventana canónica (Ayer, Hoy, Mañana, Pasado).
- **Body**: `{ "fields": "full", "async": true }`

#### `POST /admin/reset`
**Peligroso**. Borra base de datos, caché y almacenamiento, y reinicia la sincronización desde cero.
- **Body**: `{ "async": true }`

---

## Contratos de Datos (DTOs)

Formato de respuesta estándar:
```json
{
  "success": true,
  "data": { ... }, // Objeto o Array principal
  "meta": {        // Metadatos de paginación, cache, timestamp
    "total": 100,
    "cached": true,
    "timestamp": "ISO-8601"
  }
}
```

### MediaCardDTO
Usado en listados (Home, Search, Batch).
```typescript
interface MediaCardDTO {
  id: string;
  type: 'program' | 'movie' | 'series';
  title: string;
  subtitle: string; // Ej: "22:00 - Antena 3"
  image: { url: string; aspectRatio: number };
  badges: string[]; // Ej: ["Directo", "Cine"]
  context?: {
    schedule?: { start: string; end: string; live: boolean; progress: number };
  }
}
```

---

## Estrategia de Cache y Rendimiento

La API utiliza una estrategia de caché en capas:

1.  **Static Storage (Nivel 1)**: Los `schedules` (parrillas) se pre-calculan en archivos JSON almacenados fisicamente (o en S3). Esto permite lecturas O(1) casi instantáneas sin tocar la BD.
2.  **Application Cache (Nivel 2)**: Valkey o Memoria. Almacena:
    - Resultados de `discovery/home`.
    - Datos de canales (`channels:meta`).
    - Snapshots de `schedules` calientes.
3.  **HTTP Cache (Nivel 3)**: Headers `Cache-Control` agresivos para recursos estáticos (imágenes) y controlados para datos dinámicos (`stale-while-revalidate`).

---

## Manejo de Errores

| Código | Error | Descripción |
|--------|-------|-------------|
| 400 | `ValidationError` | Parámetros de entrada inválidos. |
| 401 | `Unauthorized` | Token faltante o inválido. |
| 404 | `NotFoundError` | Recurso no encontrado. |
| 429 | `TooManyRequests` | Exceso de peticiones (Rate Limit). |
| 500 | `InternalServerError` | Error no controlado del servidor. |
| 503 | `ServiceUnavailable` | Sistema en mantenimiento o sobrecarga. |

---
*Documentación generada automáticamente para Guía TV API v2.*
