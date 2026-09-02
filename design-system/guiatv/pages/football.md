# Football product — page override

Overrides `MASTER.md` for `/deportes/futbol/**`. The visual mode is Operate:
professional, dense, fast, editorial, and centered on the question “¿Dónde
puedo ver el partido?”. It must not resemble an admin dashboard.

## Information architecture and navigation

- `Fútbol` remains a normal primary destination in the global header and
  mobile bottom bar, matching TV, Qué ver, Plataformas, and Blog.
- Immediately below the header, reuse the canonical `PortalContextNav` pattern:
  breadcrumb hierarchy followed by pill-shaped section links. Do not create a
  football-only dropdown or a second visual language.
- The contextual menu contains Portada, En directo, Partidos de hoy,
  Calendario, Competiciones, Dónde ver, and Noticias. On narrow
  screens it uses the component's existing horizontal scroll and sticky state.
- Entity pages may use contextual tabs only for entity data: match
  (Resumen / Alineaciones / Estadísticas / Dónde ver), competition or team
  (Resumen / Partidos / Clasificación / Noticias). Hide unsupported tabs.
- Date, status, TV-provider, and competition choices are filters, not routes in
  a second application navigation bar. Preserve useful state in query params.

## Football home

Order answers by urgency:

1. compact title and live count; football results live in the app-wide search;
2. seven-day date navigator and quick filters;
3. live matches when present;
4. selected-day matches grouped by competition;
5. one non-duplicated featured match only when a defensible candidate exists;
6. upcoming fixtures distinct from the selected-day feed;
7. verified football editorial content;
8. utility rail: Dónde ver, Fútbol en TV, standings snapshot, competitions.

Desktop uses a fluid ~70/30 content-to-rail split across the global content surface. The
rail becomes normal document flow below 1024px. It is utility, never sidebar
navigation.

The global search includes football teams, competitions, matches, and verified
news. Do not mount a second football-only search control in this surface.

LaLiga is the default league on the home surface: it leads the featured
competition list and supplies the standings snapshot when provider data exists.

## Date navigator and filters

- Show seven nearby dates with previous/next controls and a native calendar
  picker. The selected day uses `aria-current="date"`.
- On mobile, only the date/chip tracks may scroll horizontally; the document
  itself must not overflow.
- Today is identifiable through text and border, not a saturated block.
- Quick filters begin with Todos, En directo, TV, Próximos, Finalizados. Add
  competition chips only when they are derived from the current payload.
- Provider selection writes `provider` to the URL and filters the match feed.

## Competition groups and match rows

- Group matches under one restrained competition header. Do not repeat the
  competition inside every row.
- Desktop row order: status/time · home · score · away · broadcaster.
- Mobile row uses stacked teams with a dedicated score column and keeps the
  confirmed broadcaster visible below the teams. Names truncate; they never
  collide with the score.
- Minimum row target is 44px; mobile rows may grow to preserve broadcast data.
- Crests are recognition aids, not dominant artwork. Reserve dimensions to
  prevent layout shift and fall back to initials on failure.
- Upcoming kickoff time dominates; live/final score dominates after kickoff.
  All numeric data uses tabular numerals.

## Status and score hierarchy

- PRE-MATCH: kickoff time + date, competition context.
- LIVE: `--football-live`, text “En directo” or minute, and score. Use at most
  one subtle pulse and disable it for reduced motion.
- HALF TIME: “Descanso”. FINISHED: “Finalizado”. POSTPONED: “Aplazado”.
  CANCELLED: “Cancelado”. Never communicate state by color alone.
- One polite, atomic live region per surface announces score snapshots. Never
  attach a live region to every match row.

## Broadcasts and providers

- `match.broadcasts` after backend reconciliation is canonical. Exclude
  low-confidence entries from factual provider summaries.
- Dedupe each provider to one count per match; do not count duplicate channel
  airings as duplicate fixtures.
- Affiliate calls to action are separate from factual broadcast labels and
  retain their disclosure. Commercial relationships never alter ranking or
  recommendation language.
- If no provider is confirmed, say so honestly or omit the provider module;
  never infer rights from an affiliate mapping.

## Responsive rules

- Validate 320, 360, 375, 390, 414, 430, 768, 1024, 1280, and 1440px.
- Touch targets are 44×44px where practical with 8px separation.
- No document-level horizontal overflow, clipped teams, overlapping scores,
  or hidden broadcast truth at small widths.
- The utility rail collapses below the match feed on tablet/mobile. Sticky
  behavior is desktop-only and accounts for the global header height.

## States

- Loading: geometry-matched competition/match skeletons with `aria-busy` and
  an accessible “Cargando partidos de fútbol” status.
- Empty: “No hay partidos programados para este día” plus calendar and news
  exits. Filtered empties provide a clear-filter action.
- Error: “Ahora mismo no podemos cargar los partidos” plus retry. The data
  layer must preserve error state rather than converting failures to empty.
- Omit unsupported standings, news, lineups, statistics, events, form, H2H, or
  players completely. Empty decorative shells and fabricated data are banned.

## Semantic football tokens

Use `--football-live`, `--football-score`, `--football-surface`,
`--football-surface-subtle`, `--football-border`, `--football-muted`,
`--football-provider`, `--football-win`, `--football-draw`, and
`--football-loss`. These alias the global light/dark token system; components
must not hardcode theme colors.
