# Portal UX/UI Rework 2026-03-27

## Objetivo

Replantear `guiaprogramaciontv.com` como un sistema único de discovery para:

- TV en directo
- Qué ver
- Streaming
- Deportes

La referencia funcional y estructural es una mezcla adaptada de:

- YouTube: claridad de navegación, lateral izquierdo, búsqueda central, cambio de superficie sin pérdida de contexto
- Prime Video: composición premium, hero editorial, railes, verticales y ecosistema de módulos

## Fase 1. Auditoría

### Hallazgos principales

- La shell nueva existía, pero seguía siendo demasiado plana para el alcance real del producto.
- La navegación global no estaba resolviendo una jerarquía multicapa clara entre producto, contexto y acciones secundarias.
- Había pérdida de riqueza útil frente a versiones más densas: shortcuts, directorios, capas editoriales y lectura por contexto.
- El footer no cerraba la experiencia como una superficie integrada del portal.
- La iconografía no estaba rota por ausencia de librería; el problema principal era de integración visual y uso inconsistente.
- La vertical deportiva seguía sintiéndose secundaria.
- Mobile y tablet seguían dependiendo demasiado de simplificaciones del layout.

### Dependencias críticas

- Shell global: `apps/frontend/src/app/components/unified-portal-shell/*`
- Topbar y búsqueda: `apps/frontend/src/app/components/unified-top-nav/*`, `apps/frontend/src/app/components/unified-search/*`
- Footer: `apps/frontend/src/app/components/footer/*`
- Estado y query params: `apps/frontend/src/app/state/unified-guide.state.ts`, `apps/frontend/src/app/state/unified-shell-ui.state.ts`
- Datos TV/streaming/deportes: `apps/frontend/src/app/state/tv-data.facade.ts`
- Hub de portada: `apps/frontend/src/app/state/portal-home.facade.ts`
- Vistas de vertical: `apps/frontend/src/app/pages/unified-guide/views/*`

## Fase 2. Nuevo sistema de navegación

### Decisiones cerradas

- Topbar global sticky y más potente, con búsqueda protagonista, tabs globales, shortcuts y toggles explícitos para lateral izquierdo y panel derecho.
- Lateral izquierdo convertido en rail real con:
  - superficies maestras del producto
  - accesos rápidos por vertical
  - directorios contextuales según la pestaña activa
- Panel derecho convertido en superficie contextual con:
  - acciones rápidas
  - resúmenes
  - spotlight items
  - directorios secundarios
- En móvil y tablet:
  - lateral izquierdo y panel derecho pasan a drawer
  - la información no desaparece, se reubica

### Archivos clave

- `apps/frontend/src/app/config/portal-navigation.config.ts`
- `apps/frontend/src/app/components/unified-top-nav/unified-top-nav.component.*`
- `apps/frontend/src/app/components/unified-portal-shell/unified-portal-shell.component.*`

## Fase 3. Sistema visual

### Decisiones cerradas

- Dirección visual dark premium, con mayor densidad, contenedores ricos y superficies diferenciadas por vertical.
- Reintroducción de iconografía con una convención centralizada de paths SVG.
- Separación visual clara entre:
  - navegación global
  - contexto de vista
  - módulos de contenido
  - superficies auxiliares

### Archivos clave

- `apps/frontend/src/app/components/unified-top-nav/unified-top-nav.component.scss`
- `apps/frontend/src/app/components/unified-search/unified-search.component.scss`
- `apps/frontend/src/app/components/footer/footer.component.scss`

## Fase 4. Arquitectura frontend

### Decisiones cerradas

- La shell unificada es la base correcta para home, guide, explore, platforms y sports.
- La navegación contextual y el estado de filtros persisten vía query params.
- Footer integrado dentro de la shell para evitar cierres visuales rotos.
- SSR validado mediante build de Angular con bundles browser y server correctos.

## Fase 5. Componentes base

### Ejecutado

- Rework de topbar
- Rework de shell multicapa
- Rework de búsqueda
- Rework de footer
- Integración de railes personalizados en home y unified guide

## Fase 6. TV Directo

### Ejecutado

- Hero reforzado
- Directorios rápidos por grupos, categorías y disponibilidad
- Módulos simultáneos de:
  - en emisión
  - a continuación
  - esta noche
- CTA explícito a parrilla completa 24h
- EPG mantenida como modo denso y no residual

### Archivos clave

- `apps/frontend/src/app/pages/unified-guide/views/live-guide-view.component.*`

## Fase 7. Qué Ver

### Ejecutado

- Hero editorial reforzado
- Métricas de discovery visibles
- Directorios rápidos por plataforma y género
- Rails adicionales por:
  - directo
  - películas
  - series
  - disponibilidad
- Resumen visible de filtros activos

### Archivos clave

- `apps/frontend/src/app/pages/unified-guide/views/discover-view.component.*`

## Fase 8. Streaming

### Ejecutado

- Hero premium con métricas del hub
- Capa visible de disponibilidad
- Directorio rápido de plataformas y géneros
- Módulos por tipo de catálogo
- Comparador reforzado como entrada estructural, no accesorio

### Archivos clave

- `apps/frontend/src/app/pages/unified-guide/views/streaming-view.component.*`

## Fase 9. Deportes

### Ejecutado

- Hero deportivo reforzado
- Métricas de agenda
- Directorios rápidos por disciplina y competición
- Módulos simultáneos de:
  - live now
  - próximos
  - esta noche
  - semana
- Bloque prioritario de fútbol
- Agrupación por competición y por deporte mantenida

### Archivos clave

- `apps/frontend/src/app/pages/unified-guide/views/sports-view.component.*`

## Fase 10. Pulido transversal

### Comprobaciones hechas

- `npm run build` completado correctamente en `apps/frontend`
- Build SSR y browser correctos
- Persisten warnings previos no bloqueantes:
  - deprecaciones Sass en `pages/lista-canales`
  - dependencias CommonJS (`debug`, `xmlhttprequest-ssl`, `dompurify`)

## Criterios de aceptación actuales

- La shell ya no depende de una navegación plana.
- Home, TV, Qué Ver, Streaming y Deportes conviven en una sola arquitectura visual y funcional.
- El lateral izquierdo y el panel derecho aportan navegación y contexto reales.
- El footer vuelve a cerrar la experiencia como parte del sistema.
- La experiencia mobile mantiene acceso a los laterales mediante drawers.
- Las verticales ya muestran profundidad modular antes de abrir filtros avanzados.

## Trabajo pendiente recomendado

- Revisión visual fina a 390px, 768px, 1024px y >=1440px con capturas.
- Revisión manual de contraste y foco de teclado en railes laterales y drawers.
- Revisión de consistencia editorial en blog/rankings para alinearlos del todo con el nuevo shell.
- Optimización posterior de warnings Sass heredados y dependencias CommonJS.
