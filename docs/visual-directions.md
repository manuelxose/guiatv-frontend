# GuiaTV — Visual Directions (ui-design-director, Round 1)

**Status: planning/spec only.** Chrome DevTools/Playwright MCP was not available in this session, so nothing below has been screenshotted or pixel-verified. All scores are desk evaluations against the written spec and the UX research, not against rendered output. **Pixel-level visual verification (375/768/1440, per the agent brief) is pending an MCP-enabled session and must happen before any direction is declared final.**

Grounded in `docs/ux-ia-recommendations.md` (Round 1 UX research) and the real starting point read directly from the codebase:

- `apps/frontend/src/styles/design-tokens.scss` — confirmed bug: `--accent-live`, `--accent-discover`, `--accent-streaming`, `--accent-sports`, `--accent-editorial` all resolve to `#dc2626`. Every direction below fixes this with five genuinely distinct hues.
- `apps/frontend/src/styles.scss` — confirmed additional hardcoded `#dc2626` usage outside the token file (post-content links/blockquote/code, `.focus-ring-red`, `.tv-sheet-isolated__option--selected`) — these need to move onto tokens regardless of which direction ships, or the "5 accents" fix will be undermined by ad-hoc reds elsewhere.
- `--font-sans: Montserrat, ...` is set but **no `@font-face`/Google Fonts `<link>` loads Montserrat anywhere** in `index.html` — the token is currently dead weight; the browser silently falls through to the system-ui fallback. Confirmed real starting point: GuiaTV is visually running on system fonts today, not Montserrat. Each direction below states explicitly whether it keeps that (zero-cost, zero-CLS) or spends a font request on a deliberate choice.
- `--unified-top-nav-h: 10.8rem` (mobile default) / `7.4rem` (≥768px) plus `--portal-pill-shelf-h` stack to a `--shell-sticky-offset` that is currently the single biggest "chrome before content" cost on the token side, independent of the copy-block issue the UX research flags directly (`home.component.html:23-51`, every `*-view__masthead`, and the dual hero in `unified-portal-shell.component.html:100-150`). Every direction addresses both.

---

## Direction 1 — "Broadcast Grid"

**Concept.** GuiaTV first as a functional, high-density TV guide — the Plex/printed-programming-guide lineage, not a streaming-app mood board. Desktop leads with a true channel×time grid as its anchor view (the single biggest structural gap the UX research found — GuiaTV has no grid today). Chrome collapses to a thin utility bar; color is used as a functional signal system, never as decoration. Confident, ink-on-paper legibility.

### Color tokens

Base (light):
| Token | Value | Note |
|---|---|---|
| `--portal-bg` | `#f7f7f5` | warm paper white, not clinical `#fff` |
| `--portal-surface` | `#ffffff` | |
| `--portal-card` | `#ffffff` | |
| `--portal-border` | `#e2e1dc` | |
| `--portal-text` | `#15171c` | near-black ink |
| `--portal-text-soft` | `#43464e` | |
| `--portal-text-muted` | `#6b6e76` | |

Semantic accents (5 distinct hues, each with a one-line rationale):
| Token | Value | Rationale |
|---|---|---|
| `--accent-live` | `#d61f36` | broadcast-red, reserved *only* for "on air now" — never reused decoratively elsewhere in this direction |
| `--accent-discover` | `#4457e8` | saturated indigo-blue; cool/exploratory, ~150° hue away from live-red for max separation |
| `--accent-streaming` | `#0f9e8e` | teal-green reads "available/go," distinct from both live-red and sports-orange |
| `--accent-sports` | `#e08a1e` | amber-orange, the broadcast-sports convention (flag/whistle color), ~60° from live-red |
| `--accent-editorial` | `#7452c9` | plum-violet, the calmest "read" register, furthest hue-distance from the three "watch now" actions |

### Typography

Keeps the system-ui fallback stack (no new font request — Montserrat was already dead weight). Adds `font-variant-numeric: tabular-nums` on all EPG time labels so grid columns align vertically without a monospace typeface. A semi-condensed weight axis (`font-stretch: condensed` where the variable font supports it, else `Roboto Condensed`/`Inter Tight` as an explicit second family only inside the grid) for channel-name cells, so 15+ rows fit without truncation fights. Scale reuses the existing clamp tokens but caps `--text-hero` at `2.75rem` max (down from `4.6rem`) since hero space is deliberately minimized. Weight usage: 700 for times/data labels, 600 headings, 400 body — data legibility over display flourish.

### Spacing / density — EPG handling: **grid-first**

Dense. Row height fixed at `2.75–3.25rem` so ~15 channels' current+next fit in one 1440px viewport without scrolling (the exact job the UX research names as the grid's unique strength). **Desktop (≥1024px): true channel×time grid is the default live-guide view**, pivoted from the same `TvDataFacade.readView('all')` feed already wired, with a secondary "Rails" tab for users who want today's card-rail browsing instead. **Mobile: unchanged shape from what the UX research already validates as correct** — channel-chip + card-rail, sharpened with per-channel expand-in-place instead of a full route change.

### Hero / above-the-fold

Chrome collapses to a single ~3rem nav pill (Google TV 2025 pattern), replacing the `10.8rem`/`7.4rem` stacked nav+pill-shelf. No separate copy-hero block at all — home opens directly on the grid with the "now" time-column highlighted; the grid *is* the answer to "what's on," visible without scrolling. This is the most aggressive of the three directions on killing chrome.

### Card / component treatment

- **ProgramCard** — dense list-row: channel logo, tabular time chip, 2px left accent border keyed to vertical. No poster art (data-row, not a poster item).
- **LiveProgramCard** — same row shape + 6px pulsing accent-live dot + "EN DIRECTO" chip.
- **PosterCard** — 2:3 poster, platform badge as a bottom-left corner overlay, used in the secondary Rails tab and streaming/detail contexts, not in the grid itself.
- **PlatformBadge** — neutral chip (surface bg, 1px border), logo + name; never independently colored — avoids a second competing color system on top of the vertical accents.
- **EditorialCard** — horizontal card, thin `accent-editorial` top rule + small kicker label, not a color wash.

### Motion / elevation

Restrained/utilitarian: 120–150ms ease-out, no hover scale/parallax. Grid-row hover = background tint only. Focus rings always visible: 2px solid accent, 2px offset (grid is keyboard-navigable by design, so this isn't optional polish). Shadows kept to the existing `--shadow-sm/md` scale, no new elevation system.

---

## Direction 2 — "Streaming Rail"

**Concept.** Leans fully into the rail-first shape GuiaTV already has — validated by the UX research as the *correct* pattern on mobile — and executes it as a cinematic, dark-first streaming-app experience closer to Apple TV/Google TV/JustWatch's poster-forward rows. Resolves the dual-hero problem (`unified-portal-shell.component.html:100-150` vs. `home.component.html:23-51`) by folding the live-now lead card into the shared shell's hero **media slot**, killing the bespoke home lead block entirely — one hero system, not two.

### Color tokens

Base (dark-first; light companion included for the `color-scheme: light` default the codebase currently ships):
| Token | Dark value | Light value |
|---|---|---|
| `--portal-bg` | `#0b0d12` | `#f7f8fa` |
| `--portal-bg-deep` | `#06070a` | `#eef0f3` |
| `--portal-surface` | `#14171f` | `#ffffff` |
| `--portal-card` | `#171a22` | `#ffffff` |
| `--portal-border` | `#262b36` | `#e2e4e9` |
| `--portal-text` | `#f4f5f7` | `#14161b` |
| `--portal-text-soft` | `#c7cad1` | `#3d414a` |
| `--portal-text-muted` | `#8b909c` | `#6d717c` |

Semantic accents (tuned to glow on dark; darkened ~8-10% L for the light companion to hold AA text contrast):
| Token | Value (dark) | Rationale |
|---|---|---|
| `--accent-live` | `#ef4444` | bright alert red, glows against near-black — universal on-air cue |
| `--accent-discover` | `#b866f0` | violet/fuchsia, the "for you"/personalized-row register in streaming UI convention |
| `--accent-streaming` | `#22c55e` | emerald green, "available to stream / go" — distinct register from live-red |
| `--accent-sports` | `#f5943d` | warm orange, energetic, clearly distinct from both live-red and streaming-green |
| `--accent-editorial` | `#3fb6f2` | sky blue, calm reading register, cool contrast against the three "watch" accents |

### Typography

Spends a deliberate font request (unlike Direction 1): a geometric-sans display face (e.g. Inter Tight / Sora, self-hosted `woff2` to control CLS and avoid a third-party font-loading dependency) at 700-800 weight for row headers and the hero title; body copy stays on system-ui/Inter Regular 400-500. This is the direction's main typographic risk — must be measured for CLS/LCP cost against Direction 1's zero-font-cost approach before final selection.

### Spacing / density — EPG handling: **rail-first (no desktop grid)**

Airier than Direction 1: generous rail gutters, larger poster cards for a browsing feel. Per the UX research's explicit fork, this direction **commits to rails-only** — live TV stays "just another discovery rail," sharpened (mobile: channel-chip + expand-in-place; desktop: wider channel rail cards showing now+next) but a true grid is deliberately not built here. This is a real, named trade-off, not an oversight: it buys streaming-discovery strength at the cost of the "scan 15 channels at once" job.

### Hero / above-the-fold

The shared shell's hero **media slot** is used exclusively and populated with the real live-now program (still/poster art + title + channel + `accent-live` "EN DIRECTO" chip), replacing `home-page__lead`'s eyebrow/h1/paragraph/4-pill-CTA block entirely. Hero height capped at ~40vh desktop / ~46vh mobile so rails begin within the first scroll — directly answers the research's "copy pushes content below the fold" finding by making the hero content itself, not text about the content.

### Card / component treatment

- **PosterCard** — 2:3 dark card, platform badge always visible bottom-left, 1px border, no color wash — the discovery workhorse of this direction.
- **ProgramCard** — 16:9 still + 3px bottom accent underline keyed to vertical + live pulse dot when airing.
- **LiveProgramCard** — same shape, larger, featured as rail-first slot, with a progress bar under the still.
- **PlatformBadge** — neutral dark chip, platform's own brand color used only as a 2px left accent stripe (not a full badge fill) — keeps platform identity from competing with vertical-accent identity.
- **EditorialCard** — distinguished by aspect ratio (3:2 magazine-style) rather than color; kicker label uses `accent-editorial` in text only, never as a background wash.

### Motion / elevation

More expressive than Direction 1 but still bounded: 180-220ms ease-out, cards get `scale(1.02)` + shadow lift on **both** hover and keyboard focus (explicitly not hover-only — satisfies the rejection criterion), rail scroll uses snap/momentum, skeletons are sized to exact final card geometry (no layout shift).

---

## Direction 3 — "Hybrid Signal"

**Concept.** The deliberate middle path the UX research names as worth testing: EPG ships as rails by default (mobile-safe, matches current shape) with an explicit, discoverable "Ver parrilla" toggle that swaps to a true desktop grid — reusing Direction 1's grid component rather than building a second parallel implementation. The five verticals become a genuine wayfinding system (tinted card backgrounds + top accent bar, not just a dot), which is the most direct structural fix to the audit's "accents collapsed to one red" complaint — it makes the fix load-bearing, not cosmetic.

### Color tokens

Base (light neutral, cool-toned):
| Token | Value |
|---|---|
| `--portal-bg` | `#f5f6f8` |
| `--portal-surface` | `#ffffff` |
| `--portal-surface-strong` | `#eceef2` |
| `--portal-card` | `#ffffff` |
| `--portal-border` | `#dfe2e8` |
| `--portal-text` | `#1a1d24` |
| `--portal-text-soft` | `#454a54` |
| `--portal-text-muted` | `#6d7280` |

Semantic accents — authored in OKLCH at **identical lightness (L=58%) and chroma (C=0.19)**, varying only hue, so no single accent visually dominates the other four (the concrete fix for "red-on-everything," not just "five different reds→five different hues"):
| Token | OKLCH | Hex (sRGB) | Rationale |
|---|---|---|---|
| `--accent-live` | `oklch(58% 0.19 25)` | `#dd3a3a` | red family — standard broadcast on-air hue |
| `--accent-discover` | `oklch(58% 0.19 265)` | `#4f6df5` | blue family — 240° hue-rotation from live, max perceptual separation |
| `--accent-streaming` | `oklch(58% 0.19 155)` | `#12a06a` | green family — "available" register, 130° rotation |
| `--accent-sports` | `oklch(58% 0.19 60)` | `#c9821a` | orange/amber family — standard sports-broadcast color, 35° from live (deliberately closer, since sports and live-TV share "urgency" semantics, but still hue-distinguishable) |
| `--accent-editorial` | `oklch(58% 0.19 320)` | `#c34fc0` | magenta/plum family — reading register, furthest rotation from the three "watch" accents as a group |

Each accent also gets a `-tint` token at 6% opacity over `--portal-card` for the card-background wayfinding mechanism below (e.g. `--accent-live-tint: color-mix(in oklch, var(--accent-live) 6%, var(--portal-card))`).

### Typography

Pairs a restrained display serif (e.g. `Source Serif 4`, self-hosted, loaded only on routes that use it) for editorial/detail-page headings with the existing system-ui/Inter grotesk for all UI chrome, EPG, and live/streaming surfaces. The serif is scoped *only* to editorial contexts and detail-page titles — this is the concrete mechanism for the UX research's §7 "editorial should feel native, not bolted-on": editorial gets a real typographic identity instead of borrowing the same UI font as everything else, while EPG/live/streaming keep the faster-scanning grotesk. Highest font-loading cost of the three directions (one additional family, scoped) — must be weighed against Direction 1's zero-cost approach at implementation time.

### Spacing / density — EPG handling: **hybrid**

Medium density — denser than Direction 2, airier than Direction 1. Default view everywhere is the sharpened rail pattern (same mobile-safe shape as Directions 1/2). At ≥1024px, an explicit "Ver parrilla" toggle next to the day/time controls swaps to Direction 1's true channel×time grid, sourced from the same component — not a second implementation to maintain. Named risk: this is a real toggle a user has to find and use; unlike Direction 1 it doesn't hand the grid to desktop users by default.

### Hero / above-the-fold

Same consolidation move as Direction 2 — kill `home-page__lead`, single shell hero with the live-now program in the media slot — plus the vertical-wayfinding language starts here: the hero background carries a 4%-opacity `accent-live` tint so "you're looking at live content" is legible from the page's color alone before any text is read.

### Card / component treatment

All four card types (ProgramCard, PosterCard, PlatformBadge, EditorialCard) share **one geometric family** — same corner radius, same shadow scale — and are differentiated by function (poster vs. row vs. badge vs. horizontal card), not by invented per-type styling. Each is stamped with its vertical's identity via a full-width 3px top accent bar **plus** the matching `-tint` card background at 6% opacity — this is the "tell them apart from color alone, even in a mixed rail" fix the research explicitly asks for in §8.5, applied structurally rather than left to a single dot. PlatformBadge stays neutral-chip + the platform's own brand color as a thin accent stripe (platform identity is kept deliberately separate from vertical identity, as in Direction 2).

### Motion / elevation

Restrained and uniform: 150ms ease-out everywhere, `focus-visible` rings always present (2px accent, 2px offset) regardless of input device, and every hover state has both a keyboard-focus equivalent and a static, always-visible affordance (e.g. a chevron or badge) — no interaction is hover-only-discoverable anywhere in this direction.

---

## Scorecard (0–10 per criterion)

Desk-scored against the written specs above and the UX research's stated jobs-to-be-done. **Not yet screenshot-verified — treat as a planning-stage estimate, re-score after real rendering.**

| Criterion | Dir 1 — Broadcast Grid | Dir 2 — Streaming Rail | Dir 3 — Hybrid Signal |
|---|---|---|---|
| Content hierarchy | 8 | 8 | 9 |
| Time-to-answer | 9 | 7 | 9 |
| Visual clarity | 8 | 7 | 9 |
| Live-TV comprehension | 10 | 6 | 9 |
| EPG usability | 10 | 5 | 9 |
| Streaming discovery | 6 | 10 | 8 |
| Mobile ergonomics | 7 | 9 | 8 |
| Accessibility | 8 | 7 | 9 |
| Brand personality | 6 | 9 | 8 |
| Density | 9 | 7 | 8 |
| Consistency | 8 | 8 | 9 |
| Performance feasibility | 9 | 7 | 7 |
| **Average** | **8.17** | **7.5** | **8.42** |

Notes on the low outliers (why, not just what):
- Dir 2 / EPG usability = 5: it explicitly does not build the desktop grid the UX research names as the single biggest structural gap. That's a named trade-off in the spec, not an accident, but it caps this score hard.
- Dir 1 / Streaming discovery = 6 and Brand personality = 6: a grid-first, utilitarian system is honest and fast but risks reading as a plain "programming guide" rather than a product with its own identity — the poster/discovery experience is real but secondary by design.
- Dir 3 / Performance feasibility = 7: the lowest of its own row — a second display font (scoped) plus a real dual EPG (rail + grid sharing a component) plus per-vertical tint variants on every card type is more implementation and maintenance surface than either single-minded alternative, even though each piece is individually cheap.

## Selected direction: Direction 3 — "Hybrid Signal"

Highest average (8.42) and the most balanced profile — no criterion below 7, and it's the only direction that doesn't trade away either EPG usability (Dir 2's weak point) or streaming discovery / brand personality (Dir 1's weak points). It also most directly operationalizes two things the UX research flagged as structural, not cosmetic: the EPG fork (§2/§9.1 — it's the explicit hybrid option, not a dodge) and the accent-collapse fix (§8.5 — full card-tint + top-bar wayfinding, not just five new hex codes on a token file no one looks at).

### Rejection-criteria check (brief §39)

| Criterion | Status | Why |
|---|---|---|
| Generic AI-template look | Pass | OKLCH-authored 5-hue accent system + scoped serif/grotesk pairing is a deliberate, specific choice, not a default SaaS palette/gradient kit |
| Excessive glassmorphism | Pass, with a caveat | Spec uses flat tints only; the codebase's existing `.glass-effect` / `.tv-sheet-isolated` blur must stay scoped to overlay sheets only and not spread into cards — call this out explicitly to whoever implements |
| Gradient-for-no-reason | Pass | No decorative gradients specified anywhere; all color is flat token or 6% tint |
| All-cards-identical | Pass | Four card types share geometry but are visually distinguished by vertical tint + top bar + function-specific layout (row vs. poster vs. badge vs. horizontal) |
| Copy-over-content | Pass | Kills `home-page__lead` and all masthead descriptive sentences per the research's §8.1/§8.2 findings; hero media slot carries the live program itself |
| Red-on-everything | Pass | This is the direction's core fix — 5 accents at matched L/C in OKLCH, red reserved for live only |
| Hero pushing content out | Pass | Single consolidated hero, height-capped, rails begin within first scroll |
| Hover-only discovery | Pass | Explicit rule: every hover state ships a keyboard-focus equivalent and a static affordance |

All eight pass on the spec as written. No rejection triggered.

### Where it falls short of 9/10, honestly

8.42 does not clear the ~9/10 bar the brief sets, and I'm not forcing that pass. To get there:

1. **Performance feasibility (7) is the biggest drag.** Cut the second font family (drop the editorial serif, or ship it as a font-weight/tracking variant of the existing grotesk instead of a new `woff2` request) and share a single CSS mixin for the vertical-tint+top-bar treatment across all four card types instead of per-component styling, so the "hybrid" complexity is real in UX terms but not in CSS/JS surface area.
2. **EPG usability (9, not 10) and Live-TV comprehension (9, not 10)** are capped below Direction 1 because the grid is opt-in via a toggle a desktop user has to find, not the default. If real usage data (once this ships) shows desktop users aren't finding/using the toggle, flip the default to grid-first on desktop ≥1024px and keep the toggle only to fall back to rails — this alone would likely close most of the gap to Direction 1's EPG/live scores without giving up Direction 3's other strengths.
3. **None of this is screenshot-verified.** The scores above are structural/desk estimates. A real MCP-enabled pass could move any of these numbers in either direction, especially Visual clarity and Accessibility, which depend on actual rendered contrast, not computed OKLCH values. Treat 8.42 as provisional until that happens.

### Gap-closing decisions applied before implementation

Per "where it falls short" above, both cheap fixes are adopted rather than deferred:
1. **Editorial serif dropped.** No second font family — editorial headings get a weight/tracking variant of the existing grotesk (700, slightly tighter `letter-spacing`) instead of a new `woff2` request. Zero new font-loading cost, matches Direction 1's performance profile.
2. **EPG grid is the desktop (≥1024px) default**, not toggle-gated — "Ver rails" becomes the fallback toggle instead of "Ver parrilla". This directly targets the EPG usability / live-TV comprehension gap versus Direction 1 without giving up Direction 3's rail-first mobile shape or its accent-wayfinding system.

These two changes are expected to move Performance feasibility and EPG usability/Live-TV comprehension closer to Direction 1's scores; still pending real re-score once screenshots are possible.

### Recommended token diff (for the next implementation round)

Concrete values to replace in `apps/frontend/src/styles/design-tokens.scss`, scoped to this direction:

```scss
--portal-bg: #f5f6f8;
--portal-bg-deep: #eceef2;
--portal-surface: #ffffff;
--portal-surface-strong: #eceef2;
--portal-card: #ffffff;
--portal-border: #dfe2e8;
--portal-border-strong: #c7ccd6;
--portal-text: #1a1d24;
--portal-text-soft: #454a54;
--portal-text-muted: #6d7280;

--accent-live: #dd3a3a;
--accent-live-soft: color-mix(in oklch, var(--accent-live) 6%, var(--portal-card));
--accent-discover: #4f6df5;
--accent-discover-soft: color-mix(in oklch, var(--accent-discover) 6%, var(--portal-card));
--accent-streaming: #12a06a;
--accent-streaming-soft: color-mix(in oklch, var(--accent-streaming) 6%, var(--portal-card));
--accent-sports: #c9821a;
--accent-sports-soft: color-mix(in oklch, var(--accent-sports) 6%, var(--portal-card));
--accent-editorial: #c34fc0;
--accent-editorial-soft: color-mix(in oklch, var(--accent-editorial) 6%, var(--portal-card));
```

Also required regardless of direction: replace the hardcoded `#dc2626` occurrences in `apps/frontend/src/styles.scss` (`.post-content` links/blockquote/code, `.focus-ring-red`, `.tv-sheet-isolated__option--selected`) with `var(--accent-live)` or `var(--accent-discover)` as appropriate per context — otherwise the token fix is undermined by literal hex values living outside the token file.

---

## Open items before this can be called final

1. **No screenshots exist yet.** Chrome DevTools/Playwright MCP was unavailable this session — this entire document is a spec, not a verified design. Next session with MCP access must render all three directions against real data at 375/768/1440 and re-run the scorecard.
2. Verify the OKLCH accent hexes above actually meet WCAG AA against both `--portal-text`-on-tint and white-text-on-accent use cases with real contrast tooling, not computed lightness alone.
3. Confirm with backend-data-engineer (per the UX research's own open items) whether cast/crew and blog/catalog cross-linking data exist before designing the components that would surface them — doesn't block visual-direction selection, but blocks the next component-spec round.
4. Decide, with real usage data post-launch, whether Direction 3's EPG toggle should flip to grid-default on desktop (see "where it falls short," item 2).
