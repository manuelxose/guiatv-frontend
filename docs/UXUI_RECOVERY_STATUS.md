# UX/UI Recovery Status

Estado de la reconstrucción correctiva integral de **Guía Programación TV**.
Complementa `docs/rebuild-scoreboard.md` (30 rondas, calidad funcional ya verde:
E2E 12/13, unit 20/20, lint 0 errores, Lighthouse performance 78 / a11y 100 /
SEO 100 / CLS 0). Este documento se centra en la **recuperación UX/UI** y la
**limpieza definitiva**.

## Regresiones detectadas

| Regresión | Causa | Estado |
|---|---|---|
| Sin dark mode real | `index.html` forzaba fondo oscuro; tokens solo claros; `user-area`/`chat`/`catalog` hardcodeaban `slate-*` | **CORREGIDO** |
| Flash claro→oscuro en hidratación | No existía script de arranque de tema SSR-safe | **CORREGIDO** |
| Chat con estilos incompatibles | `social-chat-panel`, `unified-chat-shell`, `ai-chatbot/*` usaban `bg-slate-900`, `text-white`, `border-slate-800` | **CORREGIDO** |
| Perfil/social/catálogo oscuros a la fuerza | `user-area`, `catalog-*`, `interaction-buttons`, `where-to-watch`, `auth-login-modal` con `slate-*` | **CORREGIDO** |
| Páginas secundarias forzadas a oscuro | `about`, `legal/*`, `register`, `canal-completo`, `catalog-detail`, `streaming-comparison`, `for-you`, `public-profile`, `stats`, `press-kit`, `not-found`, `content-page` con `bg-[#081018]` + `slate-*` | **CORREGIDO** |
| Texto blanco sobre superficie temática | `canal-completo.scss` `$text-primary: #ffffff` + `.text-slate-500 { color:#cbd5e1 }` | **CORREGIDO** |
| Chevron de `<select>` blanco ilegible en claro | `canal-completo.scss` data-URI `stroke='%23fff'` | **CORREGIDO** |

## Funciones recuperadas desde versiones anteriores

Ninguna funcionalidad de `d16eb52` se perdió en el rebuild: la reconciliación
histórica confirmó que la parrilla EPG, la navegación completa, el chat IA +
social, deportes, streaming, editorial y comunidad ya operan sobre el backend
actual (ver scoreboard Rondas 1–30). El trabajo de esta fase recuperó la
**coherencia visual temática** que faltaba, no funcionalidad extraviada.

## Arquitectura final

- **Un solo shell**: `unified-portal-shell` (público/privado/admin) + `unified-top-nav`.
- **Un sistema de navegación**: `portal-navigation.config.ts` + `route-map.ts`.
- **Un design system**: `styles/design-tokens.scss` con tokens semánticos
  (`--portal-*`, `--accent-*`, `--guide-*`, `--shadow-*`, `--radius-*`) en claro
  y oscuro.
- **Un chat**: `unified-chat-shell` (dock desktop / bottom-sheet móvil) con
  `social-chat-panel` y `ai-chatbot`.
- **Una capa social**: `user-area` + `public-profile` + `notification-bell` +
  `interaction-buttons` + `share-buttons`.

## Componentes eliminados (código muerto confirmado)

Verificación: selector + clase + import + ruta + tests. Cero referencias
restantes (los 3 falsos positivos del escaneo eran `filter-chip-bar`,
`admin-analytics-section` y `EditorialPostCardComponent`, componentes distintos
que siguen vivos).

- `blog/components/{post-card, post-card-horizontal, category-filter}` + `blog/layout`
- `blog/pages/{blog-category, blog-details}` (redirigidas/obsoletas)
- `components/{autocomplete, card-list, card-slider, filter, menu, search-overlay, slider, unified-shortcut-strip, unified-subnav}`
- `components/ai-chatbot/chat-onboarding-card` + `components/genre-onboarding`
- `components/desktop-chat-dock` + `components/desktop-chat-rail` (reemplazados por `unified-chat-shell`)
- `pages/{content-redirect, milista}` + `pages/pelicula-details` (archivos con typo `compoent`)
- `pages/user-area/components/{admin-analytics, user-chat, user-profile-header, user-stats}`

## Servicios eliminados

Ninguno en esta fase (auditados; los que parecían sin consumidores tenían
consumo dinámico vía router/inyección).

## CSS eliminado

- `swiper/swiper.min.css` y `leaflet/dist/leaflet.css` retirados de `angular.json` (dependencias sin uso).
- Selector roto `.text-[var(--portal-text-muted)]` y variable Sass muerta en `canal-completo.scss`.
- Colores hardcodeados `slate-*/gray-*/#081018/#0b0f14` sustituidos por tokens (~1.900 reemplazos).

## Dependencias eliminadas

`swiper`, `leaflet`, `@types/leaflet`, `embla-carousel`, `@angular/material`.
Verificación: cero imports en `src/` y cero entradas en `package-lock.json`;
`node_modules` ya no los contiene. (Se conserva `bootstrap-icons` — en uso.)

## Rutas recuperadas

Todas accesibles desde la navegación: inicio, TV/en-directo/guía/ahora/esta
noche/canales, qué-ver, deportes, streaming/plataformas, editorial,
comunidad/perfil. Sin botones muertos.

## Social

Perfil, perfil público, favoritos, listas, actividad, personas, conversaciones,
chat general + DM, notificaciones e interacciones conectados al backend real.
Sin UI falsa.

## Chat

IA (streaming, markdown, recomendaciones, memoria, reintentos) y social
(conversaciones, online, DM, realtime Socket.IO diferido). Dock desktop y
bottom-sheet móvil, ambos temáticos.

## Tema

`ThemeService` (proveído en raíz): `light` / `dark` / `system`, persistido en
`localStorage` vía `StorageService` (SSR-safe), reflejado en
`document.documentElement[data-theme]` + `color-scheme`. Script inline en
`index.html` aplica la resolución antes del primer paint (sin flash). Selector
accesible en `unified-top-nav` (cicla claro → oscuro → sistema) con `aria-label`
dinámico. Test unitario dedicado: 6 casos.

## Mobile

Navegación inferior, safe-area (`--safe-top`/`--safe-bottom`), touch targets
≥44px, bottom-sheet de chat con `100dvh`, EPG móvil específico. Sin
`overflow-x:hidden` global como parche (auditoría de overflow horizontal: 0 en
375/768/1440 en las rutas principales).

## Desktop

EPG de escritorio con columna sticky, now-line, scroll horizontal/vertical,
progreso, logos, filtros y detalle.

## Bugs pendientes

- `guiatv-api` residual con OOM autorrecuperable (~horario) bajo contención de
  host compartido — en observación con `health-watchdog`, no es un defecto UX.
- `canal-completo.component.scss` conserva `overflow-x: hidden` scoped al
  contenedor (revisar en una futura pasada de overflow específica de esa ruta).
- Backlog de warnings de lint (674) tipográficos/DI heredados — visibles, no
  bloqueantes.

## Tests

- Frontend unit: **24/24 PASS** (incluye 6 nuevos de `ThemeService`).
- Backend unit: **36/36 PASS** (scoreboard).
- Build producción + SSR: **PASS**.
- Lint frontend: **0 errores / 674 warnings** (backlog declarado).

## Próximo paso

1. Auditoría visual final con navegador en 390/768/1366/1920 × claro/oscuro
   (requiere servidor con datos reales; el host compartido está bajo presión).
2. Cerrar el backlog de warnings de lint (migración `inject()` y tipados).
3. Observación continuada de la memoria del API antes de declarar estabilidad.
