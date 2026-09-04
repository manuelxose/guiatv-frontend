# GUIA TV — Design System (MASTER)

> **Source of truth for every UI change in this repository.**
> When building a page, first check `pages/<page>.md`; if it exists its rules
> override this file. This document is the coherent GuiaTV identity: a
> Spotify-inspired dark-first reskin (2026-09-04), interpreting the raw
> token extraction in `design/spotify-design-system-*` over the app's
> existing token architecture. It replaces the prior red/OKLCH 5-accent
> system (2026-08-22 revision), which is retained only in git history.

**Product:** Guía de Programación TV — TV en directo, streaming, deportes/fútbol y contenido editorial en español.
**Stack:** Angular 20 standalone + SSR, Tailwind 3 utilities, semantic CSS tokens.
**Themes:** Light + Dark are both first-class. Dark is the primary/native mode
(near-black surfaces, flat elevation) — light is a coherent derived
counterpart, not an afterthought; the source reference only ever documented
the dark palette.

---

## 1. Design direction

- **Premium, content-first, information-dense without clutter.**
- Editorial, never admin-dashboard: content dominates, chrome recedes.
- Fast scan: clear hierarchy, one accent per vertical, generous but disciplined whitespace.
- Mobile-first: every surface must work at 360 px before being enhanced for desktop.

**Avoid:** generic admin look, excessive gradients, oversized rounded cards, enormous heroes, random icon styles, inconsistent spacing, duplicate navigation, tiny text, poor contrast, desktop UI compressed to mobile, decorative-only UI.

## 2. Color system (semantic tokens — `src/styles/design-tokens.scss`)

Base palette lives in `design-tokens.scss` (`--portal-*`, `--spotify-*`, `--accent-*`). Rules:

- **NEVER hardcode** `slate-*`, `gray-*`, `text-white`, `bg-white`, `bg-black`,
  raw hex, or raw rgba for surfaces/text. Use `bg-[var(--portal-*)]`,
  `text-[var(--portal-*)]`, `border-[var(--portal-border)]`.
- Exceptions: `text-white`/`#000` on solid accent buttons (contrast against a
  fixed fill, not a themed surface); `bg-black/<opacity>` modal backdrops;
  genuine per-brand colors (platform/streaming-service badges, social share
  buttons) — those never adapt to the token system, they're identity marks.
- **Dark surfaces step up in lightness, not shadow:** `--portal-bg` #121212 →
  `--portal-surface`/`--portal-bg-elevated` #181818 → `--portal-surface-strong`
  #1f1f1f → hover #242424. Cards are flat in dark mode; `--shadow-sm` is
  literally `none` there. Light mode keeps real drop shadows.

**Accent system — one primary (Spotify green) + Spotify's own 4-color semantic set, collapsed from the prior 5 arbitrary OKLCH hues:**

| Accent | Token | Value (both themes) | Use |
|---|---|---|---|
| Discovery / primary | `--accent-discover` | `#1ed760` (Spotify green) | Primary CTA, recommendations, "go" affordance — **never** used for "live" |
| Live / TV | `--accent-live` | `#f3727f` (spotify-negative) | TV guide, live status, now line, errors |
| Streaming | `--accent-streaming` | `#539df5` (spotify-announce) | Platforms, providers |
| Sports | `--accent-sports` | `#ffa42b` (spotify-warning) | Football vertical, warning status |
| Editorial | `--accent-editorial` | neutral (silver dark / `#3a3a3a` light) | Blog, rankings — deliberately colorless, "premium/neutral" read |

- `-soft` variants (`color-mix` 8-10% over `--portal-card`) are the card wayfinding tint — accent on the card edge, not full saturated backgrounds.
- **Status aliases:** `--status-live: var(--accent-live)`; `--status-warning: var(--accent-sports)`.
  With only 4 colors covering 5 verticals + statuses, color is now **never sufficient alone** for any of them — always pair with a text label ("En directo", "Finalizado", "Aplazado") or icon, not just for live/warning.
- Functional text must use `--portal-text` or `--portal-text-soft`; `--portal-text-muted` for secondary; `--portal-text-faint` only for decoration.
- Active/selected pills: inverted surface `bg-[var(--portal-text)] text-[var(--portal-bg)]`.
- **Contrast rule for the green accent:** `#1ed760` on `#121212`/`#181818`/`#1f1f1f` sits near the AA boundary (~3.5-4.5:1) for small text. Reserve green for large text, icons, and buttons filled solid with black text (`#000` on green passes ~9:1) — never as small text color sitting directly on a dark surface.
- `--football-win` (#1a8f52 light / #3fcf8e dark) is intentionally a *different* green from `--spotify-green` — "match won" must never read as the same signal as a primary CTA.

## 3. Typography

- `--font-sans`: **Inter** (self-hosted via `@fontsource/inter`, weights 400/700, `font-display: swap`), falling back to the system stack. This supersedes the prior zero-font-cost decision — the Spotify identity depends on Inter's tight, bold headline character.
- Modular scale tokens: `--text-2xs` → `--text-hero`. Body defaults `--text-md`; never below `--text-xs` for readable data; `--text-2xs` only for dense EPG/table metadata.
- **Eyebrow/section-label pattern** (`.eyebrow` utility, `--text-eyebrow`): uppercase, `letter-spacing: 0.04em`, weight 700 — Spotify's "RECENTLY PLAYED" treatment for section headers and filter-chip labels.
- Headings: tighter tracking (`-0.01em` to `-0.02em`), weight 700. Body 400.
- **Times, scores, standings, rankings: `font-variant-numeric: tabular-nums`** (utility `.tnum`) so cells never jitter.
- Line-height 1.5 body; 1.25–1.3 headings.
- Labels under 12px only allowed with 44px+ hit areas and decorative purpose.

## 4. Spacing, radius, elevation, motion

- Spacing: `--space-1`(0.25rem) → `--space-10`(2.5rem), plus `--space-12`(3rem)/`--space-24`(6rem) for Spotify-scale section gaps. Section rhythm 1.5–2.5rem, up to 6rem between major sections.
- Radii — redesigned tight scale, replacing the old oversized 0.9-1.9rem set: `--radius-sm`(4px) inputs/small badges, `--radius-md`(8px) cards/dropdowns, `--radius-lg`(12px) large cards/feature tiles, `--radius-xl`(16px) large modals/sheets, `--radius-pill`(9999px) — reserved for **buttons, chips, tags only**, Spotify's signature pill shape. Cards stay tight (4-12px), never pill-shaped.
- Elevation is dark-first: dark mode communicates hierarchy via surface-lightness steps (§2), not shadow — `--shadow-sm: none` there, `--shadow-md`/`--shadow-lg` reserved for floating layers (dropdowns, modals) that must visually separate. Light mode keeps real shadows (`--shadow-sm/md/lg`, subtle).
- Motion tokens: `--motion-fast`(120ms) micro-interactions (button press), `--motion-base`(200ms) hovers/card elevation, `--motion-slow`(320ms) drawers/modals, `--motion-ease` (`cubic-bezier(0.4,0,0.2,1)`). Card hover = elevate to `--portal-card-elevated` + `translateY(-4px)`; button press = `scale(0.97)`. Always gate transform/motion inside `@media (prefers-reduced-motion: no-preference)`.
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

Color/typography/radius/motion system (§2-4) reskinned 2026-09-04 from a raw
token extraction of spotify.com (`design/spotify-design-system-*`), with
shadows/motion/breakpoints/component-state specs designed fresh where the
source was silent or broken (its radius scale and `--text-button` value were
discarded as non-monotonic/corrupt extraction artifacts — see
`C:\Users\Admin\.claude\plans\debes-pillar-la-carpeta-inherited-zebra.md` for
the full rationale and file-by-file rollout).

Layout/nav/component-inventory/states/images/a11y (§1, §5-10) remain from the
UI UX Pro Max research (EPG timeline, football live scores, streaming
discovery, mobile bottom nav, dark mode, skeleton/empty/error, nav overflow)
executed 2026-08-22 — those are structural, not color-driven, and were not
part of this reskin.
