# Master prompt rebuild — 2026-08-24

Ronda ejecutada con DeepSeek V4 Pro + Claude Flow (RuFlo v3.38.16) + UI UX Pro Max
(`ui-ux-pro-max-cli@2.15.0`, skill en `.claude/skills/ui-ux-pro-max/`).

## Diseño

- Design system persistido: `design-system/guiatv/` (MASTER.md generado por UI UX
  Pro Max) + tokens reales en `src/styles/design-tokens.scss` (portal-*, accent-*,
  hero-*). Ver `.claude/skills/ui-ux-pro-max/` para la toolchain.
- Identidad: dark/light de primera clase, acentos por vertical
  (live/discover/streaming/sports/editorial), radio/escalas de sombra definidas.

## Cambios funcionales (preservación + mejoras)

1. **Shell**: navegación renombrada a producto fútbol-first — "Deportes" →
   "Fútbol" (top nav, sección contextual "Secciones de Fútbol", mobile bar,
   footer, pills de inicio). El sheet "Más" ahora expone Rankings y Tendencias
   (descubribilidad §33 del prompt).
2. **Fichas de catálogo (bug real de producción)**: el slugifier legacy eliminaba
   las letras acentuadas ("último" → "ltimo"), rompiendo la resolución TMDB y
   dejando fichas "no disponibles". Nuevo `slugifyTitle` (translitera) en
   backend `CatalogService` + frontend `utils/catalog.ts`; el fallback FE
   regenera siempre el detailPath de movie/series. Purga de `catalog:query:*`.
3. **Serials EPG sin entrada TMDB (bug real)**: `resolveBySlug` ahora cae al TV
   read model (hoy + mañana) antes del negative-cache para movie/series; purga
   de `catalog:slug:notfound:{movie,series}:*`. Ej.: `/series/valle-salvaje-t4-e51`.
4. **Contraste dark mode (WCAG 2.2 AA)**: overrides globales de
   `platform-badge` en `styles/_platform-badge.scss` (los `html[data-theme]`
   dentro de SCSS de componente se rompen con la encapsulación emulada de
   Angular); `--accent-live` dark elevado a `#ee7171`; `.row__vs` pasa a
   `--portal-text-muted`; CTA del hero a `red-600`.
5. **Estados**: loading/empty/error intencionales en discover, streaming,
   user-area y canal-completo; tokenización de colores hardcodeados en
   about/press-kit/developers/legal/catalog-detail/public-profile/for-you/stats.
6. **E2E**: specs actualizadas a la nueva IA (labels, sheet "Más") y endurecidas
   contra datos vivos (editorial por href, streaming con reintentos por título,
   overflow por polling, timeouts de fútbol 30–90s, workers=2 + PWTEST_RETRIES=1
   documentado para el backend compartido).

## Verificación

- Backend unit: 90/90. Frontend unit: 108/108 (nuevo caso de slug transliterado).
- Lint: 0 errores (579 warnings heredados).
- E2E: suite completa verde (con retry=1 por latencia del backend compartido).
- Axe (serious/critical): 0 en todas las rutas públicas probadas, dark y light.
  Issues moderate preexistentes: landmarks anidados (main/footer) en el shell.
- Overflows horizontales: 0 en 16 rutas × 2 temas × 2 viewports.
- Build + SSR: PASS. Deploys: releases 20260824172102 → 20260824184937.

## Deuda declarada (preexistente)

- Endpoints de telemetría devuelven 500 en local (sin impacto en UI).
- `npm audit`: vulnerabilidades transitivas sin `--force` (fuera de alcance).
- Landmarks: `<main>`/footer anidados en el shell (axe moderate).
