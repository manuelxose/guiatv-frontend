# Football — page override

Overrides MASTER.md for `/deportes/futbol/**`.

## IA
Home → matches (today/live/calendar) → match detail → team / competition → news.
Contextual nav: Inicio, Partidos, Competiciones, Noticias.

## Match states (color NEVER the only channel)
- PRE-MATCH: kickoff time + date, competition label.
- LIVE: `--status-live` accent + text "En directo" + minute (tabular), one subtle pulse max.
- HALF TIME: "Descanso" + HT icon.
- FINISHED: "Finalizado" + FT.
- POSTPONED: `--status-warning` + "Aplazado".
- CANCELLED: muted + "Cancelado".
- Scoreboard announces updates via one `role="status"` atomic region.

## Match card
Competition → time/status → home crest+name → score → away crest+name → broadcast indicator (channel where available). Compact row variant for dense lists.

## Detail pages
- Match: sticky scoreboard, TV/broadcast info, related news.
- Team: crest/initials, upcoming + recent matches, standings context, related news.
- Competition: header, tabs (resumen/calendario/clasificación), standings table with `aria-sort` + tabular numbers.

## States
Keep the dedicated matches loading skeleton (never show empty before first resolve).
Empty: "No hay partidos para esta fecha" + action. Error: retry banner.
