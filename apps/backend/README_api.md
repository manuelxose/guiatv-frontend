# Guia TV API v2 - Documentación Completa

## Información General

**Base URL Local**: `http://localhost:4000/v2`  
**Base URL Producción**: Configurar según entorno  
**Versión**: 2.0  
**Puerto**: 4000  
**Tecnologías**: Node.js 22, TypeScript, Express, MongoDB, Redis

**Zona horaria operativa recomendada**: `TZ=Europe/Madrid`
  
**Límite interno de snapshot completo**: `PROGRAMS_FULL_SNAPSHOT_LIMIT` (default recomendado: `100000`)

### Formato de Respuesta Estándar

Todas las respuestas de la API siguen este formato unificado:

```typescript
{
  success: boolean;        // true si la operación fue exitosa
  data?: any;             // Datos de respuesta (varía según endpoint)
  meta?: {                // Metadatos opcionales
    date?: string;
    totalChannels?: number;
    totalPrograms?: number;
    cached?: boolean;
    precomputed?: boolean;
    layoutVersion?: string;
    // ... otros campos según endpoint
  };
  error?: {               // Presente solo si success = false
    code: string;        // Código de error (ej: "NOT_FOUND", "VALIDATION_ERROR")
    message: string;     // Mensaje legible del error
    details?: any;       // Detalles adicionales del error
  };
}
```

### Alias de Fechas

La API acepta los siguientes alias de fecha además del formato `YYYYMMDD`:

- `yesterday` → Día anterior
- `today` → Día actual
- `tomorrow` → Día siguiente
- `after_tomorrow` → Pasado mañana
- `YYYYMMDD` → Fecha específica (ej: `20251127`)

---

## 📋 Endpoints Públicos

### 1. Health Check

**Endpoint**: `GET /health`  
**Descripción**: Verifica el estado básico del servidor  
**Cache**: No  
**Autenticación**: No

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 12345,
    "timestamp": "2025-11-27T00:00:00.000Z"
  }
}
```

---

### 2. Obtener Todos los Canales

**Endpoint**: `GET /v2/channels`  
**Descripción**: Retorna la lista completa de canales disponibles  
**Cache**: 30 segundos  
**Autenticación**: No

**Query Parameters**: Ninguno

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "la-1",
        "name": "La 1",
        "icon": "https://example.com/icon.png",
        "type": "TDT",
        "country": "España",
        "countryCode": "ES",
        "region": null,
        "isActive": true
      }
    ]
  },
  "meta": {
    "total": 100,
    "cached": true
  }
}
```

**Tipos de Canal** (`type`):
- `TDT` - Televisión Digital Terrestre
- `CABLE` - Cable
- `MOVISTAR` - Movistar+
- `AUTONOMICO` - Canales autonómicos
- `OTT` - Over-the-top (streaming)

---

### 3. Obtener Programas de un Canal Específico

**Endpoint**: `GET /v2/channels/:id/programs`  
**Descripción**: Retorna la programación de un canal específico para una fecha  
**Cache**: 300 segundos  
**Autenticación**: No

**Path Parameters**:
- `id` (string, requerido): ID del canal (ej: `la-1`)

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `date` | string | No | Fecha (alias o YYYYMMDD) | `today`, `20251127` |
| `timeSlot` | string | No | Índice de franja horaria (0-7) | `2` |
| `fields` | string | No | Nivel de detalle (`minimal`\|`full`) | `minimal` |
| `page` | number | No | Número de página | `1` |
| `limit` | number | No | Programas por página | `50` |
| `country` | string | No | Código de país | `ES` |
| `channelTypes` | string | No | Tipos de canal (CSV) | `TDT,Cable` |

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "channel": {
      "id": "la-1",
      "name": "La 1",
      "icon": "...",
      "type": "TDT"
    },
    "date": "20251127",
    "programs": [
      {
        "id": "prog-123",
        "channelId": "la-1",
        "title": "Telediario",
        "start": "2025-11-27T15:00:00.000Z",
        "end": "2025-11-27T15:45:00.000Z",
        "durationMinutes": 45,
        "category": "Noticias",
        "timeSlotIndex": 2,
        "gridColumnStart": 31,
        "gridColumnEnd": 34,
        // ... más campos de layout
      }
    ]
  },
  "meta": {
    "date": "20251127",
    "totalChannels": 1,
    "totalPrograms": 48,
    "cached": true
  }
}
```

---

### 4. Obtener Programas (Endpoint Principal)

**Endpoint**: `GET /v2/programs`  
**Descripción**: Retorna programas con soporte avanzado de filtros y layout precalculado  
**Cache**: 300 segundos  
**Autenticación**: No

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `date` | string | **Sí** | Fecha (alias o YYYYMMDD) | `today`, `20251127` |
| `channels` | string | No | IDs de canales (CSV) | `la-1,antena-3` |
| `timeSlot` | string | No | Franja horaria (0-7) | `2` |
| `fields` | string | No | Nivel de detalle | `minimal` (default: `full`) |
| `page` | number | No | Número de página | `1` |
| `limit` | number | No | Máximo de resultados | `500` (default), `5000` (max precalculado) |
| `country` | string | No | Código de país | `ES` |
| `channelTypes` | string | No | Tipos de canal (CSV) | `TDT,AUTONOMICO` |

**Franjas Horarias** (`timeSlot`):
- `0` - 00:00 - 03:00
- `1` - 03:00 - 06:00
- `2` - 06:00 - 09:00
- `3` - 09:00 - 12:00
- `4` - 12:00 - 15:00
- `5` - 15:00 - 18:00
- `6` - 18:00 - 21:00
- `7` - 21:00 - 00:00

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "date": "20251127",
    "timeSlots": [
      {
        "index": 0,
        "start": "00:00",
        "end": "03:00",
        "startMinutes": 0,
        "endMinutes": 180
      }
      // ... 7 franjas más
    ],
    "channels": [
      {
        "id": "la-1",
        "name": "La 1",
        "icon": "...",
        "type": "TDT",
        "country": "España",
        "countryCode": "ES"
      }
    ],
    "programs": [
      // Array de ProgramLayoutDTO (ver sección Modelos de Datos)
    ]
  },
  "meta": {
    "date": "20251127",
    "totalChannels": 17,
    "totalPrograms": 543,
    "cached": true,
    "precomputed": true
  }
}
```

**Notas Importantes**:
- Este endpoint incluye **programas que cruzan la medianoche** (programas que empiezan el día anterior pero terminan en el día solicitado)
- El parámetro `limit=5000` o superior permite usar datos precalculados si están disponibles
- Los programas vienen con layout precalculado (grid, layers, px, etc.)

---

### 5. Obtener Programa por ID

**Endpoint**: `GET /v2/programs/:id`  
**Descripción**: Retorna un programa específico con su información de layout  
**Cache**: No  
**Autenticación**: No

**Path Parameters**:
- `id` (string, requerido): ID del programa

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "program": {
      "id": "prog-123",
      "channelId": "la-1",
      "title": "Telediario",
      "start": "2025-11-27T15:00:00.000Z",
      "end": "2025-11-27T15:45:00.000Z",
      // ... campos completos de ProgramLayoutDTO
    }
  }
}
```

**Respuesta Error (404)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Program not found",
    "details": { "id": "prog-invalid" }
  }
}
```

---

### 6. Obtener Schedule Completo

**Endpoint**: `GET /v2/schedules/:date`  
**Descripción**: Retorna el schedule completo de todos los canales para una fecha  
**Cache**: 600 segundos  
**Autenticación**: No

**Path Parameters**:
- `date` (string, requerido): Fecha (alias o YYYYMMDD)

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "date": "20251127",
    "channels": [
      {
        "channel": {
          "id": "la-1",
          "name": "La 1",
          "icon": "...",
          "type": "TDT"
        },
        "programs": [
          // Array de ProgramLayoutDTO
        ]
      }
    ]
  },
  "meta": {
    "date": "20251127",
    "totalChannels": 17,
    "totalPrograms": 543,
    "cached": true,
    "precomputed": true
  }
}
```

---

### 7. Obtener Resumen de Channels

**Endpoint**: `GET /v2/schedules/:date/channels`  
**Descripción**: Retorna un resumen de cada canal con cantidad de programas y primer/último programa  
**Cache**: 600 segundos  
**Autenticación**: No

**Path Parameters**:
- `date` (string, requerido): Fecha (alias o YYYYMMDD)

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "date": "20251127",
    "channels": [
      {
        "channel": {
          "id": "la-1",
          "name": "La 1"
        },
        "programCount": 32,
        "firstProgram": {
          "title": "Madrugada",
          "start": "2025-11-27T00:00:00.000Z"
        },
        "lastProgram": {
          "title": "Cine de medianoche",
          "end": "2025-11-28T02:00:00.000Z"
        }
      }
    ]
  },
  "meta": {
    "date": "20251127",
    "totalChannels": 17,
    "cached": true
  }
}
```

---

### 8. Obtener Layouts Listos para Render

**Endpoint**: `GET /v2/layouts/:date`  
**Descripción**: Endpoint optimizado para render directo en UI con layouts precalculados por canal  
**Cache**: 600 segundos  
**Autenticación**: No

**Path Parameters**:
- `date` (string, requerido): Fecha (alias o YYYYMMDD)

**Query Parameters**:
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `channels` | string | IDs de canales (CSV) | `la-1,antena-3` |
| `timeSlot` | string | Franja horaria (0-7) | `2` |
| `fields` | string | Nivel de detalle | `minimal` |

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "date": "20251127",
    "timeSlots": [/* ... */],
    "channels": [
      {
        "channel": {
          "id": "la-1",
          "name": "La 1",
          "icon": "...",
          "type": "TDT",
          "country": "España",
          "countryCode": "ES"
        },
        "programs": [
          // ProgramLayoutDTO[] ordenados por hora
        ]
      }
    ]
  },
  "meta": {
    "date": "20251127",
    "totalChannels": 17,
    "totalPrograms": 543,
    "cached": true,
    "precomputed": true,
    "layoutVersion": "v1",
    "uiConstants": {
      "MINUTES_PER_COLUMN": 5,
      "MINUTES_PER_SLOT": 180,
      "PIXELS_PER_HOUR": 120,
      "LOGO_COLUMN_WIDTH": 120,
      "MAX_GRID_COLUMNS": 36,
      "MAX_LAYERS": 4
    }
  }
}
```

---

### 9. SSR - Now Playing

**Endpoint**: `GET /v2/ssr/now-playing`  
**Descripción**: Endpoint optimizado para SSR que retorna programas en emisión actualmente  
**Cache**: No  
**Autenticación**: No

**Query Parameters**: Ninguno

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "programs": [
      {
        "id": "prog-live-1",
        "channelId": "la-1",
        "title": "Telediario",
        "start": "2025-11-27T15:00:00.000Z",
        "end": "2025-11-27T15:45:00.000Z",
        "isLive": true
      }
    ],
    "timestamp": "2025-11-27T15:30:00.000Z"
  }
}
```

---

## 🔒 Endpoints Administrativos

> ⚠️ **ADVERTENCIA**: Estos endpoints deben estar protegidos con autenticación en producción

### 10. Sincronizar EPG desde XML

**Endpoint**: `POST /v2/admin/sync`  
**Descripción**: Descarga y parsea XML de EPG, guarda canales y programas en MongoDB  
**Autenticación**: Requerida en producción

**Request Body**:
```json
{
  "date": "today",              // Opcional: fecha a sincronizar
  "forceRefresh": false,        // Opcional: forzar descarga aunque exista
  "sourceUrl": "https://..."    // Opcional: URL personalizada del XML
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "channelsProcessed": 100,
    "programsInserted": 2500,
    "programsUpdated": 150,
    "duration": "45s",
    "cacheCleared": true
  }
}
```

**Proceso Interno**:
1. Descarga XML desde source URL
2. Parsea canales y programas
3. Guarda/actualiza en MongoDB (`channels`, `programs`)
4. Si `forceRefresh=true`, limpia cache relacionado
5. Almacena XML en `storage/epg_xml/`

---

### 11. Precalcular Schedule

**Endpoint**: `POST /v2/admin/precompute`  
**Descripción**: Precalcula layouts y genera archivos JSON de schedule  
**Autenticación**: Requerida en producción

**Request Body**:
```json
{
  "date": "today",      // Opcional: fecha a precalcular
  "fields": "minimal"   // Opcional: nivel de detalle
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "date": "20251127",
    "scheduleGenerated": true,
    "filePath": "storage/schedules/20251127.json",
    "cacheKeys": [
      "precomputed:programs:20251127:minimal",
      "schedule:json:20251127:minimal"
    ],
    "duration": "2.5s"
  }
}
```

**Proceso Interno**:
1. Obtiene programas de MongoDB
2. Calcula layouts con `ProgramLayoutBuilder`
3. Guarda en colección `schedules`
4. Genera JSON en `storage/schedules/<date>.json`
5. Calienta cache Redis con datos precalculados

---

### 12. Precalcular Ventana de Tiempo

**Endpoint**: `POST /v2/admin/precompute-window`  
**Descripción**: Precalcula ayer, hoy, mañana y pasado mañana  
**Autenticación**: Requerida en producción

**Request Body**:
```json
{
  "fields": "minimal"  // Opcional: nivel de detalle
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "dates": ["20251126", "20251127", "20251128", "20251129"],
    "totalPrograms": 2172,
    "duration": "8.3s"
  }
}
```

---

### 13. Limpiar Datos Antiguos

**Endpoint**: `POST /v2/admin/cleanup`  
**Descripción**: Limpia programas antiguos de MongoDB y opcionalmente backfills campos calculados  
**Autenticación**: Requerida en producción

**Request Body**:
```json
{
  "daysToKeep": 7,                    // Opcional: días a mantener (default: 7)
  "backfillBeforeCleanup": true,      // Opcional: backfill antes de limpiar
  "backfillDays": 3                   // Opcional: días a backfillear
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "programsDeleted": 15000,
    "backfilledPrograms": 1500,
    "oldestProgramKept": "2025-11-20T00:00:00.000Z",
    "duration": "12.5s"
  }
}
```

---

### 14. Limpiar Cache

**Endpoint**: `POST /v2/admin/cache/clear`  
**Descripción**: Limpia claves de cache Redis por patrón  
**Autenticación**: Requerida en producción

**Request Body**:
```json
{
  "pattern": "precomputed:*"  // Opcional: patrón de claves (default: limpia todo)
}
```

**Ejemplos de Patrones**:
- `precomputed:*` - Todos los datos precalculados
- `schedule:*` - Todos los schedules
- `programs:*` - Todos los programas
- `*20251127*` - Todo relacionado con una fecha específica

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "keysDeleted": 156,
    "pattern": "precomputed:*"
  }
}
```

---

### 15. Reset Completo del Sistema

**Endpoint**: `POST /v2/admin/reset`  
**Descripción**: Reinicia completamente el sistema (cache, MongoDB, archivos)  
**Autenticación**: Requerida en producción  
**⚠️ PELIGROSO**: Borra todos los datos

**Request Body**:
```json
{
  "sourceUrl": "https://...",  // Opcional: URL personalizada de XML
  "fields": "minimal"           // Opcional: nivel de detalle para precompute
}
```

**Proceso Interno**:
1. Limpia toda la cache Redis
2. Elimina colecciones `channels`, `programs`, `schedules`
3. Borra archivos en `storage/epg_xml/`, `storage/schedules/`, `storage/channel_icons/`
4. Ejecuta sync forzado para ayer, hoy, mañana y pasado mañana
5. Precalcula la ventana de tiempo completa

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "cacheCleared": true,
    "collectionsDropped": ["channels", "programs", "schedules"],
    "filesDeleted": 245,
    "syncedDates": ["20251126", "20251127", "20251128", "20251129"],
    "precomputedDates": 4,
    "duration": "3m 45s"
  }
}
```

---

### 16. Admin Health Check

**Endpoint**: `GET /v2/admin/health`  
**Descripción**: Estado detallado de servicios internos  
**Autenticación**: Requerida en producción

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 123456,
    "memory": {
      "used": 256000000,
      "total": 512000000,
      "percentage": 50
    },
    "cache": {
      "connected": true,
      "keys": 1234,
      "memory": "45MB"
    },
    "database": {
      "connected": true,
      "collections": {
        "channels": 100,
        "programs": 25000,
        "schedules": 30
      }
    },
    "storage": {
      "epg_xml": "125MB",
      "schedules": "45MB",
      "channel_icons": "12MB"
    }
  }
}
```

---

## 📊 Modelos de Datos

### ProgramLayoutDTO

Modelo principal que representa un programa con toda su información de layout precalculada:

```typescript
interface ProgramLayoutDTO {
  // Identificación
  id: string;                    // ID único del programa
  channelId: string;             // ID del canal

  // Información básica
  title: string;                 // Título del programa
  start: string;                 // Hora de inicio (ISO 8601)
  end: string;                   // Hora de fin (ISO 8601)
  durationMinutes: number;       // Duración en minutos

  // Metadata (según fields)
  category?: string;             // Categoría/género
  image?: string;                // URL de imagen/thumbnail
  rating?: string;               // Calificación de edad
  description?: string;          // Descripción (solo en fields=full)

  // Layout - Franja horaria
  timeSlotIndex: number | null;  // Índice de franja horaria (0-7)

  // Layout - Grid CSS
  gridColumnStart: number;       // Columna de inicio en grid
  gridColumnEnd: number;         // Columna de fin en grid
  columnStartMinutes: number;    // Minutos desde inicio de slot
  columnEndMinutes: number;      // Minutos hasta fin de slot
  layerIndex: number;            // Capa Z-index para overlaps

  // Layout - Cortes temporales
  isCutAtStart: boolean;         // ¿Programa empieza antes del slot?
  isCutAtEnd: boolean;           // ¿Programa termina después del slot?
  visibleStartTime: string;      // Hora visible de inicio (HH:mm)
  visibleEndTime: string;        // Hora visible de fin (HH:mm)
  crossesMidnight: boolean;      // ¿Cruza la medianoche?

  // Layout - Pixels (para render absoluto)
  pxStart: number;               // Posición X en pixels
  pxWidth: number;               // Ancho en pixels

  // Metadata
  fieldsProvided: 'minimal' | 'full';  // Nivel de detalle

  // Multi-slot (para programas largos)
  layoutsBySlot?: Array<{
    timeSlotIndex: number;
    gridColumnStart: number;
    gridColumnEnd: number;
    layerIndex?: number;
    isCutAtStart?: boolean;
    isCutAtEnd?: boolean;
    visibleStartTime?: string;
    visibleEndTime?: string;
    crossesMidnight?: boolean;
    pxStart?: number;
    pxWidth?: number;
  }>;
}
```

### TimeSlotDTO

Representa una franja horaria:

```typescript
interface TimeSlotDTO {
  index: number;          // 0-7
  start: string;          // "00:00"
  end: string;            // "03:00"
  startMinutes: number;   // 0
  endMinutes: number;     // 180
}
```

### ChannelMetaDTO

Información mínima de un canal:

```typescript
interface ChannelMetaDTO {
  id: string;
  name: string;
  icon?: string | null;
  type?: string;           // TDT, CABLE, MOVISTAR, AUTONOMICO, OTT
  country?: string;        // "España"
  countryCode?: string;    // "ES"
}
```

---

## ⚙️ Sistema de Cache y Precálculo

### Cache Redis

El sistema utiliza Redis para cachear respuestas y datos precalculados:

**Claves de Cache**:
- `precomputed:programs:<date>:<fields>` - Respuesta completa de GET /programs
- `schedule:json:<date>:<fields>` - Snapshot de schedule desde MongoDB
- `channels:meta` - Lista de canales
- `programs:<date>:...` - Programas filtrados por parámetros
- `layouts:<date>:...` - Layouts filtrados

**TTL (Time To Live)**:
- Channels: 300s (5 min)
- Programs: 300s (5 min)
- Precomputed: 1200s (20 min)
- Schedules: 600s (10 min)

### Sistema de Precálculo

El precálculo genera datos optimizados para consultas frecuentes:

**Archivos Generados**:
- `storage/schedules/<date>.json` - Schedule completo del día
- `storage/epg_xml/<date>.xml` - XML original del EPG

**Colección MongoDB `schedules`**:
```typescript
{
  date: string;                    // "20251127"
  layoutVersion: string;           // "v1"
  timeSlots: TimeSlotDTO[];
  channelMeta: ChannelMetaDTO[];
  channels: Array<{
    channel: ChannelMetaDTO;
    programs: ProgramLayoutDTO[];
  }>;
  meta: {
    fields: 'minimal' | 'full';
    totalChannels: number;
    totalPrograms: number;
    generatedAt: Date;
  };
}
```

### Invalidación de Cache

Para invalidar cache después de cambios en layout/UI:

1. Incrementar `LAYOUT_VERSION` en `.env`
2. Ejecutar `POST /admin/precompute-window` con nuevo fields
3. Ejecutar `POST /admin/cache/clear` con pattern `precomputed:*` y `schedule:*`

---

## 🔄 Flujos de Trabajo Recomendados

### Flujo Diario Automático (Cron)

```bash
# 1. Sincronizar ventana canónica (ayer/hoy/mañana/pasado)
POST /v2/admin/sync {"date":"yesterday","forceRefresh":true}
POST /v2/admin/sync {"date":"today","forceRefresh":true}
POST /v2/admin/sync {"date":"tomorrow","forceRefresh":true}
POST /v2/admin/sync {"date":"after_tomorrow","forceRefresh":true}

# 2. Precalcular ventana de tiempo
POST /v2/admin/precompute-window
{
  "fields": "minimal"
}

# 3. Limpiar datos antiguos semanalmente
POST /v2/admin/cleanup
{
  "daysToKeep": 7,
  "backfillBeforeCleanup": true
}
```

### Flujo de Desarrollo/Testing

```bash
# 1. Reset completo
POST /v2/admin/reset
{
  "fields": "minimal"
}

# 2. Consumir datos
GET /v2/programs?date=today&channelTypes=TDT&limit=5000
```

### Consumo Optimizado en Frontend

```javascript
// 1. Obtener layouts precalculados para render directo
const response = await fetch(
  '/v2/layouts/today?fields=minimal&channelTypes=TDT'
);
const { data } = await response.json();

// data.channels contiene canales con programs[] ya listos para render
// data.meta.uiConstants tiene constantes para el layout grid

// 2. Para filtros específicos, usar /programs
const filtered = await fetch(
  '/v2/programs?date=today&channels=la-1,antena-3&timeSlot=6'
);
```

---

## 🎯 Características Especiales

### 1. Programas que Cruzan Medianoche

La API incluye **automáticamente** programas que:
- Empiezan el día anterior pero terminan en el día solicitado
- Empiezan en el día solicitado pero terminan al día siguiente

**Ejemplo**: A las 00:30 del 27/11/2025, al solicitar programas del día 27:
- Se incluyen programas con `start: 26/11/2025 23:00` y `end: 27/11/2025 01:30`

### 2. Layout Precalculado

Todos los programas incluyen información de layout CSS Grid:
- **gridColumnStart/End**: Columnas del grid CSS
- **layerIndex**: Para manejar overlaps (z-index)
- **pxStart/Width**: Posiciones en pixels para render absoluto
- **isCutAtStart/End**: Indicadores visuales de corte

### 3. Multi-Slot Support

Programas largos (>3 horas) incluyen `layoutsBySlot[]` con layouts específicos para cada franja horaria que cruzan.

### 4. Filtrado Avanzado

Soporta filtrado combinado:
- Por país: `country=ES`
- Por tipo de canal: `channelTypes=TDT,AUTONOMICO`
- Por canales específicos: `channels=la-1,antena-3`
- Por franja horaria: `timeSlot=6`

---

## 🚨 Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| `VALIDATION_ERROR` | 400 | Parámetros inválidos |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `CHANNEL_NOT_FOUND` | 404 | Canal no existe |
| `PROGRAM_NOT_FOUND` | 404 | Programa no existe |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |
| `DATABASE_ERROR` | 500 | Error de base de datos |
| `CACHE_ERROR` | 500 | Error de cache Redis |
| `EPG_SYNC_ERROR` | 500 | Error al sincronizar EPG |

---

## 📝 Notas de Implementación

### Queries MongoDB Optimizadas

Los programas se consultan usando overlap detection:
```javascript
{
  startTime: { $lt: dayEnd },    // Empieza antes de que termine el día
  endTime: { $gt: dayStart }     // Termina después de que empiece el día
}
```

### Índices Recomendados

```javascript
// Collection: programs
db.programs.createIndex({ startTime: 1, channelId: 1 });
db.programs.createIndex({ channelId: 1, startTime: 1 });
db.programs.createIndex({ date: 1 });

// Collection: channels
db.channels.createIndex({ id: 1 }, { unique: true });
db.channels.createIndex({ type: 1, country: 1 });
```

### Constantes de UI (uiConstants)

```typescript
{
  MINUTES_PER_COLUMN: 5,      // Cada columna del grid = 5 minutos
  MINUTES_PER_SLOT: 180,      // Cada slot = 3 horas
  PIXELS_PER_HOUR: 120,       // 1 hora = 120px
  LOGO_COLUMN_WIDTH: 120,     // Ancho de columna de logos
  MAX_GRID_COLUMNS: 36,       // Máximo de columnas (3h / 5min)
  MAX_LAYERS: 4               // Máximo de capas para overlaps
}
```

---

## 🔗 Recursos Adicionales

- **Swagger UI**: `http://localhost:4000/api-docs`
- **Swagger JSON**: `http://localhost:4000/api-docs/json`
- **Health Check**: `http://localhost:4000/health`
- **Admin Health**: `http://localhost:4000/v2/admin/health`

---

**Última actualización**: 27/11/2025  
**Versión API**: 2.0  
**Mantenedor**: Guía TV Team
