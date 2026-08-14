# UX/UI Recovery Status

Fecha de verificación: **2026-08-14**. Estado de la reconstrucción correctiva
de Guía Programación TV sobre `main`, tomando como referencias históricas
`d16eb524` (pre-rebuild) y `c782d129` (rebuild). No se aplicó un revert masivo:
cada recuperación se contrastó con el código actual y con datos reales del API.

## Resultado actual

La experiencia pública y privada vuelve a compartir shell, navegación, tema y
chat. Inicio, Guía TV, Deportes, Streaming, Editorial y fichas consumen el
backend real; Perfil/Comunidad usan el mismo shell y conservan sus guardas de
autenticación. La compilación CSR/SSR, los tests unitarios y los recorridos E2E
están verdes.

## Regresiones confirmadas y corregidas

| Regresión | Causa real | Corrección |
|---|---|---|
| Tailwind no generaba utilidades | Se habían retirado `@tailwind base/components/utilities` aunque muchas plantillas seguían dependiendo de ellas | Directivas restauradas; build y vistas verificadas |
| Rail desktop cubría el viewport móvil | `display:flex` del rail izquierdo anulaba su estado base oculto | Rail persistente sólo desde 1100 px |
| Guía y Deportes ensanchaban el documento hasta ~1.1–5.1 kpx | Grids anidados tomaban el ancho intrínseco de rails horizontales | Columnas `minmax(0,1fr)`, hijos encogibles y scroll local real |
| El overflow se ocultaba globalmente | `main` y `.container-safe` imponían `max-width:100vw` + `overflow-x:hidden` | Parche global eliminado; se corrigieron los contenedores causantes |
| No existía navegación inferior operativa | La configuración tenía cuatro entradas y no se renderizaba | Cinco destinos únicos: Inicio, Guía TV, Deportes, Explorar y Perfil |
| Rutas privadas quedaban fuera del shell | `private-shell` proyectaba sólo el `router-outlet` | Shell compartido también para Perfil y Comunidad |
| `/comunidad` redirigía a `/perfil` | Ruta provisional nunca recuperada | Comunidad abre `UserAreaComponent` en pestaña `feed`; el estado se refleja en la URL |
| El chat no abría en rutas privadas | El root lo bloqueaba por tipo de layout | Disponible en shells público y privado; sólo se excluye el shell mínimo |
| El chat se desmontaba al abrir | `MarkdownPipe` ejecutaba `require('dompurify')`, incompatible con Vite | Importación ESM; apertura IA/Personas sin errores de página |
| Fichas podían quedar en blanco | La ficha esperaba la consulta secundaria de relacionados antes de publicar el contenido principal | La ficha principal se muestra inmediatamente y relacionados llegan después |
| Editorial quedaba en skeleton | Componentes OnPush mutaban estado desde suscripciones sin notificar CD | `markForCheck()` en home, categoría, ranking y detalle |
| Artículos sin módulo relacionado pese a compartir etiquetas | Sólo se comparaba la categoría primaria | Intersección de todas las categorías, priorizada por coincidencias |
| Tema claro incompleto | Editorial, perfil y 14 piezas admin conservaban superficies `slate-*`/fondos oscuros rígidos | Sustitución por tokens semánticos claro/oscuro |
| Listener del tema no se liberaba correctamente | Se eliminaba una función distinta y se registraban APIs moderna y legacy a la vez | Handler estable, API moderna o fallback Safari, y test de identidad |
| Marca superior se cortaba a 390 px | Nombre largo sin variante compacta | Variante móvil “GUÍA TV” |

## Arquitectura consolidada

- Shell público/privado: `app-public-layout-shell` +
  `unified-portal-shell` + `unified-top-nav`.
- Navegación canónica: `route-map.ts` y `portal-navigation.config.ts`.
- Design system: `styles/design-tokens.scss`, con superficies, texto, bordes,
  acentos, sombras, radios, safe areas y escala de z-index en claro y oscuro.
- Chat único: `unified-chat-shell`, con IA y Personas, panel redimensionable en
  desktop y bottom-sheet/FAB por encima de la navegación en móvil.
- Datos: no se añadieron mocks de producto. Los mocks E2E se limitan a auth y
  escrituras sociales para no contaminar la base compartida; TV, catálogo,
  deportes, streaming y editorial usan lecturas reales.

## Funciones recuperadas o confirmadas

- EPG/Guía: filtros, canales, ahora/siguiente/noche, parrilla desktop, rails
  móviles, fichas y navegación temporal.
- Deportes: agenda real, filtros, agrupaciones, tarjetas y destino de detalle.
- Descubrimiento/Streaming: búsqueda, sugerencias, plataformas, catálogo y
  disponibilidad “Dónde ver”.
- Social: Perfil, Comunidad, feed, listas, favoritos, actividad, personas,
  notificaciones y apertura del chat desde el shell privado.
- Editorial: portada, categorías, rankings, artículos, módulos relacionados y
  estados vacíos/error sin skeleton infinito.

## Tema y responsive

`ThemeService` mantiene `light | dark | system`, persiste la elección mediante
`StorageService`, aplica `data-theme`/`color-scheme` y respeta cambios del
sistema. El script previo a hidratación evita el flash inicial.

Matriz navegada con Chromium en **390, 768, 1366 y 1920 px**, en claro y oscuro,
sobre Inicio, Guía, Deportes y Editorial. Resultado final: `scrollWidth ===
clientWidth` en todos los casos, rail oculto por debajo de 1100 px, navegación
inferior sólo por debajo de 768 px y cero errores de página. Además se comprobaron
chat desktop, ficha, Perfil autenticado y menú/rail.

## Limpieza ya presente en la rama

La recuperación previa eliminó componentes duplicados/obsoletos de blog,
sliders, menús, docks de chat y vistas de usuario, además de `swiper`, `leaflet`,
`embla-carousel` y Angular Material. Esta pasada verificó que las dependencias
instaladas resuelven (`npm install` y build) y no reintrodujo alternativas
paralelas.

## Verificación ejecutada

- `npm install`: **PASS** (árbol al día).
- Frontend unit: **28/28 PASS**; incluye 7 casos de tema y 3 de navegación móvil.
- Backend unit: **38/38 PASS**.
- E2E: **16/16 recorridos PASS** en Chromium contra el backend real, salvo el
  aislamiento explícito de auth/escrituras.
- Lint: **0 errores / 571 warnings heredados**.
- Build producción backend + frontend CSR/SSR: **PASS**.
- Smoke SSR construido: **200** en `/`, Guía, Deportes, Editorial y Perfil;
  HTML de 10–380 kB con títulos SSR en rutas públicas.

## Riesgos y deuda declarada

- `npm audit` informa **77 vulnerabilidades transitivas** (2 low, 26 moderate,
  45 high, 4 critical). No se ejecutó `npm audit fix --force` porque implicaría
  actualizaciones potencialmente rompedoras fuera del alcance UX/UI.
- El lint sigue acumulando 571 warnings de DI/tipado heredados; no bloquean la
  compilación, pero deben reducirse de forma incremental.
- `canal-completo.component.scss` conserva bastante SCSS legacy no aplicado
  por la plantilla utility-driven actual. Conviene reducirlo en una tarea
  específica tras mapear sus clases históricas; ya no contiene el parche de
  overflow que enmascaraba anchuras.
- El API compartido puede mostrar latencia bajo sincronización EPG. La suite se
  ejecutó secuencialmente para no convertir contención externa en flakiness.

## Criterio de cierre

La recuperación UX/UI solicitada queda funcionalmente cerrada: no hay rutas
principales huérfanas, el shell y el tema son coherentes, móvil no depende de
ocultar overflow, las fichas y Editorial no bloquean el primer render, y las
pruebas cubren los recorridos críticos. La deuda restante está identificada y
no se presenta como trabajo completado.
