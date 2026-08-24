# Home — page override

Overrides MASTER.md for `/`.

## Hierarchy (above the fold)
1. Contextual featured content (live now or tonight's lead) — compact hero, not full viewport.
2. Ahora en TV (live rail).
3. Empieza pronto / Esta noche.
4. Fútbol de hoy (if matches exist).
5. Qué ver / recomendaciones.
6. Popular.
7. Plataformas (provider row).
8. Editorial module.

## Rules
- No dead vertical space; hero ≤ 45vh on desktop, content-first on mobile.
- LCP image eager + preconnect (preserve existing optimization).
- Rails must show affordance (chevron) and be scrollable by touch; no swipe-only.
- Skeleton for rails on first load; editorial module last.
