# Mi GuíaTV — page override

Overrides MASTER.md for `/perfil`, `/comunidad`.

## Hierarchy (nav order, `UserAreaComponent.sectionTabs`)
1. Resumen (`overview`) — completion meter, "Esta noche para ti" rail, quick-link cards, recent history preview.
2. Mi TV (`tv`).
3. Deportes (`sports`).
4. Biblioteca (`library`) — listas, favoritos, historial.
5. Comunidad (`community`).
6. Asistente (`assistant`).
7. Cuenta (`account`).

Desktop and mobile share one nav source (`visibleTabs`) — never build a separate desktop shortcut list that covers fewer destinations than the mobile grid.

## Defaults
- `/perfil` with no `?tab=` → **Resumen**.
- `/comunidad` with no `?tab=` → **Comunidad**. These are two distinct entry URLs sharing `UserAreaComponent`; do not unify their defaults.
- `?tab=streaming` and `?tab=notifications` are legacy aliases for `account` (same `<app-user-settings>` destination) — kept for backward compatibility via `mapLegacyTab`, never re-introduced as separate nav entries.

## Card wayfinding (`card-vertical-accent`, `styles/_card-accent.scss`)
| Surface | `data-vertical` |
|---|---|
| Overview → Guardado card | `discover` |
| Overview → Tu televisión card | `live` |
| Overview → Comunidad card | `streaming` |
| Overview → Asistente card | `editorial` |
| Overview → Deportes card | `sports` |
| Mi TV chips | `live` |
| Deportes chips | `sports` |
| Asistente knowledge panel | `editorial` |
| Comunidad activity cards | `editorial` |
| Biblioteca — list/favorite cards | `discover` |
| Historial rows | `live`/`discover`/`streaming` by content type (program/movie/series) |

Components with only a Tailwind inline template (no `styleUrls`) replicate the mixin's exact CSS output (absolute 3px top bar + `-soft` background) with utility classes instead of adding a new `.scss` file; components that already `@use`/`@include` the real mixin inline (see `CatalogCardComponent` for the precedent) keep doing so.

## Known limitations (do not silently "fix" without a product/backend decision)
- `PersonalizationPreferencesComponent` (Mi TV / Deportes) shows raw catalogue IDs, not display names/logos — no frontend service resolves channel/team/competition IDs yet.
- `UserContentInteraction` has no poster/image field — Historial rows use a type badge, not an image.
- `CommunityListCardComponent`'s link always points at `/perfil` (no per-list detail route exists).
- Admin's inline activity table uses illustrative rows, not a real feed — do not fabricate one without a real activity source.
