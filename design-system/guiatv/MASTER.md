# GUIA TV — Design System (MASTER)

> **Source of truth for every UI change in this repository.**
> When building a page, first check `pages/<page>.md`; if it exists its rules
> override this file. This document is the coherent GuiaTV identity,
> interpreting UI UX Pro Max research (2026-08-22) over the app's existing
> token architecture. It intentionally replaces the raw tool-generated
> template (rose/pink palette) which does not match this product.

**Product:** Guía de Programación TV — TV en directo, streaming, deportes/fútbol y contenido editorial en español.
**Stack:** Angular 20 standalone + SSR, Tailwind 3 utilities, semantic CSS tokens.
**Themes:** Light + Dark are both first-class. The system is *not* a simple inversion.

---

## 1. Design direction

- **Premium, content-first, information-dense without clutter.**
- Editorial, never admin-dashboard: content dominates, chrome recedes.
- Fast scan: clear hierarchy, one accent per vertical, generous but disciplined whitespace.
- Mobile-first: every surface must work at 360 px before being enhanced for desktop.

**Avoid:** generic admin look, excessive gradients, oversized rounded cards, enormous heroes, random icon styles, inconsistent spacing, duplicate navigation, tiny text, poor contrast, desktop UI compressed to mobile, decorative-only UI.

## 2. Color system (semantic tokens — `src/styles/design-tokens.scss`)

Base palette lives in `design-tokens.scss` (`--portal-*`, `--guide-*`). Rules:

- **NEVER hardcode** `slate-*`, `gray-*`, `text-white`, `bg-white`, `bg-black`,
  `#081018`, or raw hex for surfaces/text. Use `bg-[var(--portal-*)]`,
  `text-[var(--portal-*)]`, `border-[var(--portal-border)]`.
- Exceptions: `text-white` on solid red accent buttons; `bg-black/<opacity>` modal backdrops.

**Five vertical accents (OKLCH, matched L/C, hue-only separation):**

| Accent | Token | Use |
|---|---|---|
| Live / TV | `--accent-live` (#bc3131 / dark #e05555) | TV guide, live status, now line |
| Discovery | `--accent-discover` | Qué ver, recommendations |
| Streaming | `--accent-streaming` | Platforms, providers |
| Sports | `--accent-sports` | Football vertical, warning status |
| Editorial | `--accent-editorial` | Blog, rankings |

- `-soft` variants (`color-mix` 6% light / 9% dark over `--portal-card`) are the card wayfinding tint — accent on the card edge, not full saturated backgrounds.
- **Status aliases:** `--status-live: var(--accent-live)`; `--status-warning: var(--accent-sports)`.
  Live/warning must **never** be communicated by color alone — always pair with a text label ("En directo", "Finalizado", "Aplazado") or icon.
- Functional text must use `--portal-text` or `--portal-text-soft`; `--portal-text-muted` for secondary; `--portal-text-faint` only for decoration.
- Active/selected pills: inverted surface `bg-[var(--portal-text)] text-[var(--portal-bg)]`.

## 3. Typography

- `--font-sans` system stack (zero font-download cost — keep it).
- Modular scale tokens: `--text-2xs` → `--text-hero`. Body defaults `--text-md`; never below `--text-xs` for readable data; `--text-2xs` only for dense EPG/table metadata.
- **Times, scores, standings, rankings: `font-variant-numeric: tabular-nums`** (utility `.tnum`) so cells never jitter.
- Line-height 1.5 body; 1.25–1.3 headings. Headings 600–700 weight, body 400.
- Labels under 12px only allowed with 44px+ hit areas and decorative purpose.

## 4. Spacing, radius, elevation, motion

- Spacing: `--space-1`(0.25rem) → `--space-10`(2.5rem). Section rhythm 1.5–2.5rem.
- Radii: `--radius-sm`(0.9rem) cards/chips, `--radius-md`(1.2rem) modals, `--radius-pill` pills.
  No giant uniform rounding — EPG cells and dense rows use small radii (0.25–0.5rem).
- Elevation: `--shadow-sm/md/lg` only; subtle. EPG uses borders + `--guide-shadow`, not per-cell shadows.
- Motion: 150–200ms hovers/color shifts; 250–300ms drawers/modals; honor `prefers-reduced-motion` everywhere.
- Z scale tokens only: `--z-content…--z-toast` (`--z-sticky:10`, `--z-header:20`, `--z-bottom-nav:30`). No ad-hoc z-index.

## 5. Layout & responsive

- Content max: `--portal-content-max` (110rem).
- Breakpoints: <768 mobile, ≥768 tablet, ≥1024 desktop rails, ≥1280 wide.
- Mobile: dedicated bottom nav (see §6); no page-level horizontal scroll (intentional scroll regions only: EPG, rails — both must show affordance).
- Sticky elements compensate: content padding equal to sticky heights (`--shell-sticky-offset`, `--bottom-nav-h` + `--safe-bottom`).
- Touch targets ≥44×44px; spacing ≥8px between targets; `touch-action: manipulation`.
- No hover-only actions: anything hover-revealed must be visible on touch devices.

## 6. Navigation

- **Desktop top nav:** brand (home) + primary destinations: TV, Qué ver, Plataformas, Fútbol, Blog. Search inline. Account + theme + notifications right. No duplicate search icons.
- **Mobile bottom nav (max 5):** Inicio, TV, Fútbol, Qué ver, Más. "Más" sheet exposes Plataformas, Blog/Editorial, Rankings, Tendencias, Comparador + account + theme. One tap = one theme change (never double-press).
- Rankings reachable from Blog context nav AND "Más".
- Preserve every public URL (SEO) — navigation redesign never renames routes.

## 7. Component variants (purpose-specific cards)

| Component | Use |
|---|---|
| `UnifiedProgramCard` | variants `live/feature/discover/streaming/sport/compact/epg-row` — canonical TV/catalog card |
| `CatalogCard` | legacy catalog grid card |
| `FootballMatchCard` / `FootballMatchRow` | match cards; states: pre-match, live (red + "En directo" label + minute), HT, FT ("Finalizado"), postponed ("Aplazado"), cancelled |
| `EditorialPostCard` | editorial posts |
| `RankingCard` | ordinal + image + metadata |
| `ChannelCard` | logo + current programme + progress + next |

All cards share tokens; no new ad-hoc variants without updating this file.

## 8. States (loading / empty / error)

- **Loading:** skeleton approximating final geometry (`UnifiedSkeletonBlock` or geometry-matched rows); `aria-busy`. Never blank first paint, never a lone spinner in a big page.
- **Empty:** message + next useful action ("Limpiar filtros", "Ver TV en directo", …). Never a blank area.
- **Error:** `ErrorState` with retry; `role="alert"`; offline messaging where applicable. Never endless skeletons hiding failures.
- Football matches area keeps its dedicated skeleton (do not regress).

## 9. Images & performance

- Explicit dimensions/aspect-ratio on every image; `object-fit: cover`; lazy-load below fold; eager for LCP hero.
- Meaningful `alt`; decorative images `alt=""`.
- Preserve SSR, code-split chat, deferred loading, preconnects, image optimizer — polish must not regress LCP/CLS.

## 10. Accessibility (WCAG 2.2 AA)

- Semantic landmarks/headings; visible focus rings (no bare `outline-none`); keyboard operable everywhere; dialogs/drawers trap focus + Escape; ARIA only where necessary; reduced motion respected; live score announcements via one atomic `role="status"` per page, not per card.

---

## Research provenance

Compiled from UI UX Pro Max searches (EPG timeline, football live scores, streaming discovery, mobile bottom nav, dark mode, skeleton/empty/error, nav overflow) executed 2026-08-22. Zero-result searches (football palettes, editorial landing) treated as fallback: general rules above apply.
