# GuiaTV Frontend — Auditoría Exhaustiva para Rebuild Completo

> Fecha: 2026-04-01 | Scope: `/var/www/guiatv/apps/frontend/`

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Angular | 20 (SSR vía `@angular/ssr`) |
| Estilos | Tailwind CSS + SCSS | Hybrid (global + por componente) |
| Reactividad | Angular Signals (`signal`, `computed`, `toSignal`) | — |
| Detección de cambios | `ChangeDetectionStrategy.OnPush` generalizado | — |
| Routing | Lazy-loaded `app.routes.ts` | 42 rutas |
| Chat/Tiempo real | socket.io-client | — |
| Carruseles | embla-carousel + Swiper | Dos librerías coexistentes |
| Mapas | Leaflet | — |
| Testing | Jasmine/Karma (config presente) | — |
| SSR | Angular Universal / `@angular/ssr` | — |

---

## 2. Inventario de Archivos

| Tipo | Cantidad |
|------|----------|
| Archivos TypeScript totales | 238 |
| Componentes (`.component.ts`) | 138 |
| Archivos SCSS | 81 |
| Componentes en `/components/` | 65 |
| Páginas en `/pages/` | ~60 (incluyendo sub-componentes de páginas) |

---

## 3. Mapa de Rutas

```
/                           → HomeComponent
/programacion-tv/guia-canales → UnifiedGuideComponent (tab: live)
/programacion-tv/que-ver-hoy  → UnifiedGuideComponent (tab: discover)
/plataformas                → UnifiedGuideComponent (tab: streaming)
/deportes                   → UnifiedGuideComponent (tab: sports)

/canales/:id                → CanalCompletoComponent
/catalogo/:id               → CatalogDetailComponent
/programa/:id               → ProgramFullDetailsComponent
/explorar                   → ProgramExplorerComponent
/ahora-directo              → AhoraDirectoComponent
/estadisticas               → StatsComponent
/para-ti                    → ForYouComponent
/top-10                     → ListaDestacadasComponent
/comparar-plataformas       → StreamingComparisonComponent

/editorial                  → BlogComponent (lazy)
/perfil                     → UserAreaComponent (lazy)
/admin                      → AdminComponent (guarded, lazy)
/auth/login                 → LoginComponent
/auth/registro              → RegisterComponent

/embed                      → EmbedPageComponent
/canales                    → ListaCanalesComponent
/mi-lista                   → MiListaComponent
/perfil-publico/:id         → PublicProfileComponent
/desarrolladores            → DevelopersComponent
/prensa                     → PressKitComponent
/sobre-nosotros             → AboutComponent
/sitemap                    → SitemapComponent
/legal/*                    → LegalNotice, Privacy, Cookies, Terms, Accessibility

**                          → NotFoundComponent (wildcard)
```

---

## 4. Arquitectura del Shell de la Aplicación

### 4.1 `app.component.html` — Shell raíz

La estructura real del DOM tiene dos capas de navegación en paralelo (legado + nueva):

```
<app-nav-bar>               ← Navbar desktop (legado, sticky, max-w-[1540px])
<div class="mobile-top-bar"> ← Barra móvil fija (h-14, z-50) — duplica logo/search
<app-menu>                  ← Bottom sheet del menú móvil
<div class="layout-wrap">
  <app-left-sidebar>        ← Sidebar desktop legado (hidden lg:block w-72, sticky top-[92px])
  <main>                    ← Outlet principal
<app-footer>                ← Footer (desktop only)
<div class="mobile-nav-bar"> ← Bottom nav 4 tabs (grid, fijo en bottom)
<app-ai-chatbot>            ← FAB + overlay chatbot
<app-desktop-chat-dock>     ← Panel chat resizable desktop
[Modales varios]            ← auth-login-modal, program-detail-modal, etc.
```

**Problema crítico**: Esta estructura coexiste con `<app-unified-portal-shell>` que tiene su propia navbar (`app-unified-top-nav`), su propio left rail y su propio right rail. Hay dos sistemas de layout activos simultáneamente para las páginas que usan el shell unificado.

### 4.2 `UnifiedPortalShellComponent` — Shell nuevo

El shell unificado (`app-unified-portal-shell`) se usa en:
- `HomeComponent`
- `UnifiedGuideComponent` (y sus 4 views: live, discover, streaming, sports)

Estructura interna:
```
<main class="portal-shell portal-shell--{tone}">
  <app-unified-top-nav>     ← Topnav propia del shell (con tabs + search + profile)
  <section class="portal-shell__pill-shelf">  ← Filtros rápidos sticky
  <div class="portal-shell__layout">          ← Grid 3 columnas
    <aside class="portal-shell__rail--left">  ← Visible ≥1100px, colapsable
    <div class="portal-shell__surface">       ← Centro (ng-content)
    <aside class="portal-shell__rail--right"> ← Visible ≥1280px
  </div>
  <section class="portal-shell__footer">
  <div class="portal-shell__drawer-shell">    ← Drawers móviles (overlay)
</main>
```

Breakpoints del layout grid:
- `<1100px`: 1 columna (solo surface)
- `1100–1279px`: 2 columnas (left rail + surface)
- `≥1280px`: 3 columnas (left rail + surface + right rail)
- `≥1536px`: layout más ancho (`148rem` max)

---

## 5. Sistema de CSS / Tokens

### 5.1 CSS Custom Properties (definidas en `styles.scss`)

```scss
/* Colores base */
--guide-bg: #050816
--guide-surface: #0a0f1c
--guide-border: rgba(148,163,184,0.14)
--guide-text: #f1f5f9
--guide-text-muted: #94a3b8

/* Acento por sección */
--guide-accent: #ef4444           /* live (rojo) — default */
--guide-accent-live: #ef4444
--guide-accent-discover: #f59e0b  /* ámbar */
--guide-accent-streaming: #38bdf8 /* sky */
--guide-accent-sports: #22c55e    /* verde */

/* Dimensiones de shell */
--unified-top-nav-h: 6.9rem
--portal-pill-shelf-h: 4.3rem
```

El tono activo se aplica sobreescribiendo `--guide-accent` con el valor de sección:
```scss
.portal-shell--live       { --guide-accent: var(--guide-accent-live) }
.portal-shell--discover,
.portal-shell--home       { --guide-accent: var(--guide-accent-discover) }
.portal-shell--streaming  { --guide-accent: var(--guide-accent-streaming) }
.portal-shell--sports     { --guide-accent: var(--guide-accent-sports) }
```

### 5.2 El Hack del Font-Size (`styles.scss`)

```scss
@media (min-width: 1024px) and (max-width: 1600px) {
  html { font-size: 11px; }
}
```

Esto simula un zoom del ~69% en escritorio mediano. **Todo el sistema de rem queda corrompido** en ese rango: un `1rem` mide `11px` en lugar de `16px`. Es el mayor problema de escalado del proyecto.

### 5.3 Mezcla Tailwind + SCSS

El proyecto mezcla dos estrategias de estilo:

**Tailwind** (usado en `app.component.html`, nav-bar, left-sidebar, móvil):
```html
<div class="hidden lg:block w-72 sticky top-[92px]">
<nav class="fixed bottom-0 grid grid-cols-4 h-16 z-50">
```

**SCSS por componente** (usado en todos los componentes `unified-*` y páginas nuevas):
```scss
.portal-shell__layout {
  display: grid;
  grid-template-columns: minmax(15rem, 16rem) minmax(0, 2.05fr) minmax(18.75rem, 20rem);
}
```

**No hay tokens compartidos entre las dos capas.** Los colores de Tailwind (emerald-500, red-500) y los tokens CSS (--guide-accent-sports, --guide-accent-live) no están sincronizados.

### 5.4 Gradientes Inline

Los gradientes son valores magic rgba incrustados directamente en SCSS, sin variables:
```scss
background:
  radial-gradient(circle at top left, rgba(239, 68, 68, 0.08), transparent 24%),
  radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 18%),
  linear-gradient(180deg, #030712, #020611);
```
Estos valores se repiten con ligeras variaciones en `portal-shell.scss`, `home.component.scss`, `unified-top-nav.component.scss`, etc., sin abstracción alguna.

---

## 6. Componentes — Inventario Completo

### 6.1 Sistema Unificado (componentes nuevos — CONSERVAR)

| Componente | Selector | Descripción |
|-----------|---------|-------------|
| `UnifiedPortalShellComponent` | `app-unified-portal-shell` | Shell principal con 3 rails + pill shelf + drawers |
| `UnifiedTopNavComponent` | `app-unified-top-nav` | Topnav con tabs (live/discover/streaming/sports) + search + profile |
| `UnifiedProgramCardComponent` | `app-unified-program-card` | Tarjeta polimórfica (variants: live, compact, streaming, sport, discover) |
| `UnifiedSectionHeaderComponent` | `app-unified-section-header` | Header de sección con eyebrow + título + link |
| `UnifiedEditorialModuleComponent` | `app-unified-editorial-module` | Módulo editorial (grids de posts) |
| `UnifiedSkeletonBlockComponent` | `app-unified-skeleton-block` | Bloques de carga con columnas configurables |
| `UnifiedSearchComponent` | `app-unified-search` | Input de búsqueda unificado |
| `UnifiedSubnavComponent` | `app-unified-subnav` | Subnavegación de sección |
| `UnifiedShortcutStripComponent` | `app-unified-shortcut-strip` | Tira de atajos rápidos |
| `UnifiedFilterDockComponent` | `app-unified-filter-dock` | Panel de filtros deslizable |
| `FilterChipBarComponent` | `app-filter-chip-bar` | Barra de chips de filtro |
| `PlatformBadgeComponent` | `app-platform-badge` | Badge de plataforma con logo + color |
| `BreadcrumbComponent` | `app-breadcrumb` | Migas de pan |
| `FooterComponent` | `app-footer` | Footer del sitio |

### 6.2 Sistema Legacy (componentes antiguos — CANDIDATOS A ELIMINAR)

| Componente | Selector | Problema |
|-----------|---------|---------|
| `NavBarComponent` | `app-nav-bar` | Navbar desktop legada (Tailwind, max-w-[1540px]). Duplica funcionalidad de `UnifiedTopNavComponent`. Tiene dropdown "Más" con 3 secciones. |
| `LeftSidebarComponent` | `app-left-sidebar` | Sidebar desktop legado (`hidden lg:block w-72`). Duplica funcionalidad del left rail de `UnifiedPortalShellComponent`. |
| `RightSidebarComponent` | `app-right-sidebar` | Sidebar derecho legado. Reemplazado por right rail del shell. |
| `HeaderComponent` | `app-header` | Header móvil antiguo. Reemplazado por la barra móvil inline en `app.component.html`. |
| `MenuComponent` | `app-menu` | Bottom sheet del menú móvil. Puede integrarse en shell unificado. |
| `SliderComponent` | `app-slider` | Carrusel antiguo (probablemente Swiper). Ver si es reemplazable con embla o nativo. |
| `CardSliderComponent` | `app-card-slider` | Otro slider de tarjetas. |
| `CatalogRailComponent` | `app-catalog-rail` | Rail de catálogo horizontal. |
| `CardListComponent` | `app-card-list` | Lista de tarjetas antigua. |
| `CardChannelComponent` | `app-card-channel` | Tarjeta de canal antigua. |
| `CatalogCardComponent` | `app-catalog-card` | Tarjeta de catálogo antigua. |
| `ProgramListComponent` | `app-program-list` | Lista de programas antigua. |
| `PostCardComponent` | `app-post-card` | Tarjeta de post antigua. |
| `PostCardLastComponent` | `app-post-card-last` | Variante de post card. |
| `BannerComponent` | `app-banner` | Banner genérico. |
| `FichaProgramaComponent` | `app-ficha-programa` | Ficha de programa antigua. |
| `ProgramDetailsComponent` | `app-program-details` | Detalles de programa antiguo. |

### 6.3 AI Chatbot (subárbol propio — EVALUAR)

| Componente | Descripción |
|-----------|-------------|
| `AiChatbotComponent` | Shell del chatbot (FAB + overlay) |
| `ChatMessageBubbleComponent` | Burbuja de mensaje |
| `ChatInputBarComponent` | Barra de entrada |
| `ChatHeaderComponent` | Cabecera del chat |
| `ChatSuggestionChipsComponent` | Chips de sugerencia |
| `ChatRecommendationCardComponent` | Tarjeta de recomendación |
| `ChatRecommendationListComponent` | Lista de recomendaciones |
| `ChatWelcomeScreenComponent` | Pantalla de bienvenida |
| `ChatConversationSidebarComponent` | Sidebar de historial |
| `ChatOnboardingCardComponent` | Card de onboarding |
| `ChatOnboardingWizardComponent` | Wizard de onboarding |
| `ChatSkeletonComponent` | Skeleton de carga |
| `ChatContextBadgeComponent` | Badge de contexto |
| `ChatMemoryEditorComponent` | Editor de memoria |
| `ChatPreferencePromptComponent` | Prompt de preferencias |
| `ChatCommunityChooserComponent` | Selector de comunidad |
| `UnifiedChatShellComponent` | Shell de chat unificado |
| `SocialChatPanelComponent` | Panel social |
| `DesktopChatRailComponent` | Rail de chat desktop |
| `DesktopChatDockComponent` | Dock de chat desktop |

### 6.4 Modales y Overlays

| Componente | Descripción |
|-----------|-------------|
| `ModalComponent` | Modal genérico |
| `AuthLoginModalComponent` | Modal de login |
| `ProgramDetailModalComponent` | Modal de detalle de programa |
| `SearchOverlayComponent` | Overlay de búsqueda |
| `BottomSheetComponent` | Bottom sheet genérico |
| `AutocompleteComponent` | Dropdown de autocompletado |

### 6.5 Interacción y Utilidades

| Componente | Descripción |
|-----------|-------------|
| `InteractionButtonsComponent` | Botones de interacción (like, bookmark, share) |
| `ShareButtonsComponent` | Botones de compartir |
| `NotificationBellComponent` | Campana de notificaciones |
| `FilterComponent` | Panel de filtros antiguo |
| `CatalogFiltersComponent` | Filtros de catálogo |
| `WhereToWatchComponent` | "Dónde ver" |
| `GenreOnboardingComponent` | Onboarding de géneros |
| `FaqSectionComponent` | Sección FAQ |

---

## 7. Páginas — Inventario

### 7.1 Páginas con Shell Unificado (nuevo sistema)

| Página | Ruta | Descripción |
|--------|------|-------------|
| `HomeComponent` | `/` | Portada. Usa `UnifiedPortalShellComponent`. Signals + `PortalHomeFacade`. LD+JSON estructurado. |
| `UnifiedGuideComponent` | `/programacion-tv/guia-canales`, `/plataformas`, `/deportes`, `/programacion-tv/que-ver-hoy` | Wrapper de 4 views mediante `activeTab`. |
| `LiveGuideViewComponent` | (sub-view) | Guía TV en directo. |
| `DiscoverViewComponent` | (sub-view) | Discovery de contenido. |
| `StreamingViewComponent` | (sub-view) | Catálogos de plataformas. |
| `SportsViewComponent` | (sub-view) | Guía deportiva. Polling cada 30s. Múltiples agrupaciones (por deporte, por competición). |

### 7.2 Páginas Legacy / Mixtas

| Página | Ruta | Estado |
|--------|------|--------|
| `CanalCompletoComponent` | `/canales/:id` | Página de canal completo. |
| `CatalogDetailComponent` | `/catalogo/:id` | Detalle de catálogo. |
| `ProgramFullDetailsComponent` | `/programa/:id` | Detalle de programa. |
| `ProgramExplorerComponent` | `/explorar` | Explorador de programas. |
| `AhoraDirectoComponent` | `/ahora-directo` | Directo ahora. |
| `StatsComponent` | `/estadisticas` | Estadísticas/tendencias. |
| `ForYouComponent` | `/para-ti` | Recomendaciones personalizadas. |
| `ListaDestacadasComponent` | `/top-10` | Top 10 y rankings. |
| `StreamingComparisonComponent` | `/comparar-plataformas` | Comparador de plataformas. |
| `ListaCanalesComponent` | `/canales` | Directorio de canales. |
| `MiListaComponent` | `/mi-lista` | Lista personal del usuario. |

### 7.3 Área de Usuario

| Página | Descripción |
|--------|-------------|
| `UserAreaComponent` | Shell del área de usuario. |
| `UserProfileHeaderComponent` | Cabecera del perfil. |
| `UserFavoritesComponent` | Lista de favoritos. |
| `UserListsComponent` | Listas del usuario. |
| `UserStatsComponent` | Estadísticas del usuario. |
| `UserInteractionHistoryComponent` | Historial de interacciones. |
| `UserSocialFeedComponent` | Feed social. |
| `UserSearchComponent` | Búsqueda en el área de usuario. |
| `UserChatComponent` | Chat del usuario. |
| `UserSettingsComponent` | Configuración. |
| `EditProfileModalComponent` | Modal de edición de perfil. |
| `AddToListModalComponent` | Modal añadir a lista. |
| `CreateListModalComponent` | Modal crear lista. |
| `ListDetailsComponent` | Detalles de una lista. |
| `CommunityListCardComponent` | Tarjeta de lista comunitaria. |

### 7.4 Admin

| Página | Descripción |
|--------|-------------|
| `AdminComponent` | Shell del admin (guarded). |
| `AdminHeaderComponent` | Cabecera del admin. |
| `AdminSidebarComponent` | Sidebar del admin. |
| `AdminUsersSection` | Gestión de usuarios. |
| `AdminContentSection` | Gestión de contenido. |
| `AdminSchedulesSection` | Gestión de programación. |
| `AdminAnalyticsSection` | Analytics de admin. |
| `AdminAiSection` | IA analytics. |
| `AdminBlogSection` | Gestión de blog. |
| `AdminCommunitySection` | Gestión de comunidad. |
| `AdminOperationsSection` | Operaciones. |
| `AdminSystemSection` | Sistema. |
| `AdminPlaceholderSection` | Placeholder. |

---

## 8. Estado y Servicios

### 8.1 Facades (capa de estado)

| Facade | Responsabilidad |
|--------|----------------|
| `PortalHomeFacade` | Estado de la portada (liveNow, tonight, sports, platforms, editorial) |
| `ProgramListFacadeService` | Estado de la lista de programas |

### 8.2 Servicios Core

| Servicio | Responsabilidad |
|---------|----------------|
| `AuthService` | Autenticación |
| `UserService` | Perfil, favoritos, watchlist, historial |
| `ChatService` | Chat/asistente IA (apertura, cierre, contexto) |
| `ChatbotService` | Lógica del chatbot (socket.io) |
| `MetaService` | SEO: meta tags, canonical, LD+JSON |
| `HttpService` | Wrapper de `HttpClient` |
| `CacheService` | Cache in-memory |
| `InitializationManagerService` | Inicialización de la app |
| `GlobalErrorHandlerService` | Manejo global de errores |
| `LoggerService` | Logging |
| `ConfigService` | Configuración de la app |

### 8.3 Servicios de Dominio

| Servicio | Responsabilidad |
|---------|----------------|
| `CatalogService` | Datos del catálogo de streaming |
| `BlogService` | Posts editoriales |
| `DiscoveryService` | Discovery y recomendaciones |
| `AnalyticsService` | Tracking de eventos |
| `StreamingProvidersService` | Proveedores/plataformas |
| `CatalogFiltersService` | Estado de filtros del catálogo |
| `MenuStateService` | Estado del menú móvil |
| `ModalService` | Gestión de modales |
| `LoginModalService` | Modal de login específico |
| `AuthActionService` | Acciones de autenticación |
| `ImageOptimizationService` | Optimización de imágenes |
| `DeviceDetectorService` | Detección de dispositivo |
| `SitemapService` | Generación de sitemap |

### 8.4 Estado del Shell

| Servicio de Estado | Responsabilidad |
|-------------------|----------------|
| `UnifiedShellUiStateService` | Estado UI del portal shell (colapsado del left rail, etc.) |

### 8.5 Servicios del Program List (subfamilia)

| Servicio | Responsabilidad |
|---------|----------------|
| `ProgramListTransformService` | Transformación de datos de programa |
| `CategoryStyleManagerService` | Estilos por categoría |
| `CategoryFilterService` | Filtros por categoría |
| `DimensionCalculatorService` | Cálculo de dimensiones de la grilla EPG |
| `TimeManagerService` | Gestión de tiempos en la guía |

---

## 9. Patrones y Convenciones

### 9.1 BEM modificado
Los componentes nuevos (`unified-*`) usan BEM estricto:
```
.portal-shell              (bloque)
.portal-shell__layout      (elemento)
.portal-shell__rail--left  (modificador)
.portal-shell--sports      (modificador de estado)
```

Los componentes legacy mezclan BEM con Tailwind utilities y clases semánticas ad-hoc.

### 9.2 Signals como estado principal
```typescript
// Patrón estándar en componentes nuevos:
readonly searchQuery = signal('');
readonly homeState = toSignal(this.facade.getHomeState(), { initialValue: null });
readonly liveNow = computed(() => this.homeState()?.liveNow || []);
```

### 9.3 OnPush + Signals = sin `markForCheck()`
Todos los componentes nuevos usan `ChangeDetectionStrategy.OnPush`. El grafo de Signals propaga cambios sin necesidad de llamadas manuales al ciclo de detección.

### 9.4 Normalización de datos
`normalizeToCard()` (`utils/tv-normalizers`) convierte cualquier tipo de ítem (programa, contenido de streaming, deporte) a una `UnifiedCard` para uso en `UnifiedProgramCardComponent`.

### 9.5 Tono/Acento por sección
El tono visual se propaga a través de la clase CSS en el shell:
```html
<main class="portal-shell portal-shell--sports">
```
Y se consume con `var(--guide-accent)` en todos los componentes hijo, sin necesidad de prop drilling.

### 9.6 Rail sections como data objects
Los datos del left/right rail se definen como objetos `UnifiedPortalRailSection[]` en los componentes padre (página) y se pasan al shell como `@Input`. El shell no conoce el contenido, solo renderiza la estructura.

---

## 10. Deuda Técnica — Catálogo Completo

### CRÍTICO

**T-01: Hack `font-size: 11px`**
- Archivo: `styles.scss` (rango 1024–1600px)
- Efecto: todos los `rem` valen `11px` en escritorio mediano. Break total del sistema tipográfico.
- Solución: eliminar el hack. Usar `clamp()` + unidades de viewport para ajustar escala.

**T-02: Dos sistemas de layout activos en paralelo**
- El shell raíz (`app.component.html`) tiene `app-nav-bar` + `app-left-sidebar` siempre presentes.
- Las páginas que usan `UnifiedPortalShellComponent` renderizan su propio nav + rails dentro.
- Resultado: en las páginas unificadas hay dos navbars y dos sidebars en el DOM al mismo tiempo (uno oculto con CSS, otro activo).
- Solución: migrar todas las páginas al sistema unificado y eliminar el shell raíz heredado.

**T-03: `*ngIf` / `*ngFor` vs `@if` / `@for`**
- Los componentes legacy usan la sintaxis estructural antigua (`*ngIf`, `*ngFor`).
- Los componentes nuevos usan Angular 17+ control flow.
- `UnifiedPortalShellComponent` usa `*ngIf`/`*ngFor` (579 líneas de HTML).
- Solución: migrar a `@if`/`@for`/`@switch` en el rebuild.

**T-04: `portal-shell__rail-item` triplicado en el HTML**
- El template del shell (579 líneas) repite el mismo bloque de renderizado de rail item tres veces: left rail persistente, right rail persistente, left drawer móvil, right drawer móvil.
- Solución: extraer a un componente `UnifiedRailCardComponent` + `UnifiedRailItemComponent`.

### ALTO

**T-05: Dos librerías de carrusel (Swiper + embla-carousel)**
- Ambas están en `package.json`. No está claro qué componentes usan cada una.
- Peso total innecesario en el bundle.
- Solución: escoger una (preferiblemente embla, más ligero) y eliminar la otra.

**T-06: Leaflet en un portal de TV**
- `leaflet` está en las dependencias. Uso no identificado en el audit.
- Si solo se usa para una feature marginal, evaluar si vale el peso.

**T-07: `CommonModule` importado en componentes standalone**
- Angular 20 standalone no requiere `CommonModule`. Importar `NgIf`, `NgFor`, `NgClass` directamente es más eficiente y tree-shakeable.
- En el rebuild usar solo las directivas necesarias (o el nuevo control flow que no necesita imports).

**T-08: `bypassSecurityTrustHtml` en `HomeComponent`**
- Se usa para inyectar `<script type="application/ld+json">` con datos estructurados.
- Es una vulnerabilidad potencial si los datos no se sanitizan correctamente.
- Solución: usar `<script>` en SSR a través del `TransferState` o `Meta`/`Title` service con soporte para JSON-LD limpio.

**T-09: Gradientes magic rgba sin tokens**
- Docenas de valores `rgba(239, 68, 68, 0.08)`, `rgba(56, 189, 248, 0.08)`, etc. hardcodeados.
- No hay variables CSS ni SCSS para los valores de opacidad.
- Solución: crear un design token system completo con variables para colores, opacidades y gradientes.

**T-10: localStorage directamente en componentes**
- `UnifiedPortalShellComponent` lee de `localStorage` directamente (`SEARCH_HISTORY_KEY`).
- No hay abstracción ni SSR safety robusta (solo `isPlatformBrowser`).
- Solución: extraer a un `StorageService` con manejo de SSR transparente.

### MEDIO

**T-11: Dos navbars para escritorio**
- `app-nav-bar` (legado, con mega-menu "Más" dropdown) y `app-unified-top-nav` (nuevo, 4 tabs).
- La navegación secundaria del mega-menu (Blog, Estadísticas, Desarrolladores, etc.) no tiene representación en el sistema unificado.

**T-12: `shouldUsePersistentLeftRail()` usa `window.innerWidth`**
- Breakpoint calculado en JS sin listener de resize.
- Si la ventana cambia de tamaño, el estado no se actualiza.
- Solución: usar `BreakpointObserver` de Angular CDK o signal reactivo.

**T-13: Polling en `SportsViewComponent`**
- `setInterval` de 30s para actualizar datos deportivos en vivo.
- No se limpia en todos los escenarios de navegación.
- Solución: usar `takeUntilDestroyed()` para cleanup automático.

**T-14: Inputs inmutables forzando re-cómputo con `inputVersion` signal**
- `UnifiedPortalShellComponent` usa un signal `inputVersion` que se incrementa en `ngOnChanges` para forzar la reevaluación de computed signals.
- Es un workaround de la incompatibilidad entre `@Input()` y Signals.
- Solución en Angular 20: usar `input()` signal (Signal Inputs API) en lugar de `@Input()`.

**T-15: `buildFallbackLeftRail()` / `buildFallbackRightRail()` en el shell**
- El shell construye secciones fallback cuando el padre no proporciona datos.
- Genera acoplamiento de responsabilidades: el shell "conoce" la navegación de la app.
- Solución: mover los defaults a una constante en `portal-navigation.config.ts`.

### BAJO

**T-16: `AdminAnalyticsComponent` duplicado**
- Existe en `/pages/user-area/components/admin-analytics/` y en `/pages/admin/sections/analytics/`.

**T-17: Mezcla de TS path aliases**
- Algunos imports usan paths relativos (`../../services/`), otros probablemente aliases.
- Unificar con `tsconfig.json` paths mapping.

**T-18: Sin design system de tipografía**
- Los tamaños de fuente están directamente en SCSS: `0.72rem`, `0.82rem`, `0.96rem`, `1rem`, `0.98rem`, `1.1rem`...
- No hay escala tipográfica definida. Valores similares pero distintos para distintos componentes.

---

## 11. Dependencias a Revisar para el Rebuild

```json
CONSERVAR:
  "@angular/*"                    → Framework principal
  "tailwindcss"                   → Si se mantiene el enfoque híbrido
  "socket.io-client"              → Para chat en tiempo real

EVALUAR:
  "swiper"                        → Reemplazar con embla-carousel o nativo
  "embla-carousel"                → Evaluar si es necesario
  "leaflet"                       → ¿Para qué se usa? Eliminar si es marginal
  "@angular/cdk"                  → Útil para BreakpointObserver, Overlay, Portal

ELIMINAR SI NO SE USAN:
  Cualquier dependencia de carrusel/mapa duplicada
```

---

## 12. Roadmap de Rebuild

### Fase 0 — Token System (prerequisito de todo)

1. Eliminar el hack `font-size: 11px`.
2. Definir escala tipográfica en CSS custom properties: `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-3xl`.
3. Definir escala de colores completa: base + acento por sección + estados (hover, active, disabled).
4. Definir escala de gradientes nombrados: `--gradient-surface`, `--gradient-hero`, `--gradient-rail`, `--gradient-live`, etc.
5. Definir escala de radios: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`.
6. Definir escala de sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
7. Sincronizar tokens con Tailwind config (`theme.extend`) si se mantiene Tailwind.

### Fase 1 — Shell Raíz

1. Migrar `app.component.html` a usar solo `UnifiedPortalShellComponent` como capa de layout.
2. Eliminar `app-nav-bar`, `app-left-sidebar`, `app-right-sidebar` del shell raíz.
3. La navegación del mega-menu "Más" se integra en el `UnifiedTopNavComponent` o en el left rail.
4. Crear `AppShellComponent` limpio con: nav unificado + outlet + footer + chatbot dock.
5. Las páginas que NO usan el portal shell (admin, auth, legal) tienen su propio mini-shell.

### Fase 2 — Portal Shell Component

1. Migrar `*ngIf`/`*ngFor` a `@if`/`@for` en el template de 579 líneas.
2. Extraer `UnifiedRailSectionComponent` y `UnifiedRailItemComponent` para eliminar la triplicación.
3. Cambiar `@Input()` a `input()` Signal Inputs.
4. Eliminar el workaround `inputVersion` signal.
5. Reemplazar `window.innerWidth` con `BreakpointObserver`.
6. Extraer fallbacks a `portal-navigation.config.ts`.
7. Extraer acceso a localStorage a `StorageService`.

### Fase 3 — Componentes Unificados

1. Migrar todos los componentes `unified-*` a Signal Inputs + `@if`/`@for`.
2. Eliminar `CommonModule` — usar solo imports concretos.
3. Reemplazar gradientes magic con tokens.
4. Crear `UnifiedProgramCardComponent` variantes con datos de tipo mínimo necesario.
5. Crear `UnifiedCarouselComponent` sobre embla (eliminar Swiper).

### Fase 4 — Páginas

1. Migrar cada página al nuevo sistema de tokens y Signal Inputs.
2. Eliminar componentes legacy identificados en §6.2.
3. Migrar páginas que aún usan el shell raíz al nuevo `AppShellComponent`.
4. Resolver el componente admin duplicado (`admin-analytics`).

### Fase 5 — Chatbot y Features Opcionales

1. Revisar y posiblemente aislar el subárbol del chatbot (20 componentes).
2. Evaluar si Leaflet puede eliminarse o lazy-loadear solo donde se use.
3. Migrar `bypassSecurityTrustHtml` a solución SSR limpia para LD+JSON.

---

## 13. Convención CSS Propuesta para el Rebuild

```scss
// design-tokens.scss — single source of truth
:root {
  // Tipografía
  --text-2xs: 0.625rem;   // 10px
  --text-xs:  0.75rem;    // 12px
  --text-sm:  0.875rem;   // 14px
  --text-base: 1rem;      // 16px
  --text-lg:  1.125rem;   // 18px
  --text-xl:  1.25rem;    // 20px
  --text-2xl: 1.5rem;     // 24px
  --text-3xl: 2rem;       // 32px

  // Colores base
  --color-bg:        #050816;
  --color-surface:   #0a0f1c;
  --color-surface-2: #0d1420;
  --color-border:    rgba(148, 163, 184, 0.14);
  --color-text:      #f1f5f9;
  --color-text-muted:#94a3b8;
  --color-text-dim:  rgba(148, 163, 184, 0.66);

  // Acentos por sección
  --accent-live:      #ef4444;
  --accent-discover:  #f59e0b;
  --accent-streaming: #38bdf8;
  --accent-sports:    #22c55e;
  --accent-default:   var(--accent-discover);

  // Acento activo (se sobreescribe por sección)
  --accent: var(--accent-default);

  // Radios
  --radius-sm:   0.75rem;
  --radius-md:   1.1rem;
  --radius-lg:   1.5rem;
  --radius-pill: 999px;

  // Sombras
  --shadow-sm: 0 4px 12px rgba(2, 6, 23, 0.16);
  --shadow-md: 0 12px 28px rgba(2, 6, 23, 0.22);
  --shadow-lg: 0 24px 52px rgba(2, 6, 23, 0.32);

  // Gradientes
  --gradient-bg:      linear-gradient(180deg, #030712, #020611);
  --gradient-surface: linear-gradient(180deg, rgba(9,14,27,0.96), rgba(6,10,22,0.92));
  --gradient-blur-top: linear-gradient(180deg, rgba(3,7,18,0.94), rgba(3,7,18,0.82));
}

// Sobreescritura de acento por sección
.tone-live      { --accent: var(--accent-live); }
.tone-discover  { --accent: var(--accent-discover); }
.tone-streaming { --accent: var(--accent-streaming); }
.tone-sports    { --accent: var(--accent-sports); }
```

---

## 14. Resumen Ejecutivo

| Área | Estado | Prioridad de Rebuild |
|------|--------|---------------------|
| Token system / CSS vars | Parcial (sin tipografía ni escala de gradientes) | CRÍTICA |
| Shell raíz | Dos sistemas en paralelo | CRÍTICA |
| font-size hack | Activo — rompe rem | CRÍTICA |
| Portal shell HTML | 579 líneas, triplicación de rail items | ALTA |
| Signal Inputs migration | Pendiente (usa `@Input()` + workaround) | ALTA |
| Componentes legacy | 16 componentes candidatos a eliminar | ALTA |
| Carrusel único | Swiper + embla coexistiendo | MEDIA |
| Control flow syntax | `*ngIf`/`*ngFor` mezclados con `@if`/`@for` | MEDIA |
| Chatbot subárbol | 20 componentes, aislable | BAJA |
| Leaflet | Dependencia sin uso claro | BAJA |

El núcleo del nuevo sistema (`UnifiedPortalShellComponent` + `UnifiedTopNavComponent` + `UnifiedProgramCardComponent`) es sólido y puede servir de base para el rebuild. La estrategia de tokens por sección via `--accent` y el patrón de rail sections como data objects son correctos. Lo que hay que eliminar es la capa legacy que coexiste con el nuevo sistema y establecer el token system completo antes de tocar ningún componente de UI.
