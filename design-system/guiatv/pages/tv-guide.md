# TV Guide / EPG — page override

Overrides MASTER.md for `/programacion-tv/guia-canales`, `/canales/:id`, channel browsing.

## Desktop grid (epg-grid)
- Sticky channel column left + sticky time header top; compensate scroll padding.
- Program width ∝ duration; cells show title + start/end; current programme differentiated with `--accent-live-soft` tint + live dot; now line in `--status-live`.
- Row heights consistent (no ragged cards); tabular-nums times.
- Hover/focus = opacity/shadow shift 150ms; whole cell clickable; detail via modal/detail route without losing navigation context.

## Mobile
- NEVER a compressed grid. Vertical "now/next" list per channel: channel logo + name, current programme dominant (progress + start/end), next programmes below.
- Fast scanning: date chips row ("Hoy / Mañana / …"), "Ahora" jump, category filter chips ≥44px.
- Programme opens bottom-sheet/detail with close; back preserves scroll state.

## Channel list
- Current programme dominates (title + progress + time), logo high quality, next programme secondary, category badge optional; favorite/watchlist if present.

## States
- Loading: geometry-matched skeleton rows (channel row height ≈ 76px mobile / 56px desktop).
- Empty: "Sin emisiones para esta selección" + limpiar filtros action.
- Error: retry + offline note.
