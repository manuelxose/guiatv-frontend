# Phase 3E: legacy page before / after (20 canary films)

**Fixture-based.** Inputs: the stored public payload of each legacy page (before) and the catalogue rows / airings rebuilt from committed TMDB checks (phase-3d fixtures). No production data was read. The schedule is the snapshot's own (today and tomorrow, catalogue row id injected), so it is reproduced, not extended.

| Film | Genres | Runtime | Original title | TMDB notice | Legacy schedule rows | Verified rows | Robots before → after | Synopsis / airings changed |
|---|---|---|---|---|---|---|---|---|
| /peliculas/la-cura-del-bienestar | 0 → 3 | yes | yes | yes | 2 | 2 | index → index | no |
| /peliculas/venganza-en-las-vegas | 0 → 1 | yes | yes | yes | 2 | 2 | index → index | no |
| /peliculas/dobles-vidas | 0 → 3 | yes | yes | yes | 1 | 1 | index → index | no |
| /peliculas/los-subdesarrollados | 0 → 1 | yes | — | yes | 1 | 1 | index → index | no |
| /peliculas/la-galaxia-del-terror | 0 → 4 | yes | yes | yes | 1 | 1 | index → index | no |
| /peliculas/jinetes-de-la-justicia | 0 → 4 | yes | yes | yes | 1 | 1 | index → index | no |
| /peliculas/el-exorcista-iii | 0 → 1 | yes | yes | yes | 1 | 1 | index → index | no |
| /peliculas/22-balas | 0 → 3 | yes | yes | yes | 1 | 1 | index → index | no |
| /peliculas/jurassic-world-dominion | 0 → 3 | yes | — | yes | 1 | 1 | index → index | no |
| /peliculas/como-se-escribe-amor | 0 → 2 | yes | yes | yes | 2 | 2 | index → index | no |
| /peliculas/bano-de-sangre-al-salir-el-sol | 0 → 1 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/amerigeddon | 0 → 2 | yes | — | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/las-catadoras-de-hitler | 0 → 2 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/morir-no-siempre-sale-bien | 0 → 1 | yes | — | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/el-valle-de-la-furia | 0 → 3 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/bats-murcielagos | 0 → 3 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/suzhou-river | 0 → 2 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/pecados-del-pasado | 0 → 4 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/tres-tejanos | 0 → 1 | yes | yes | yes | 0 | 0 | noindex → noindex | no |
| /peliculas/el-desafio-de-pancho-villa | 0 → 1 | yes | — | yes | 0 | 0 | noindex → noindex | no |

Totals: {"films":20,"gainGenres":20,"gainRuntime":20,"gainOriginalTitle":15,"gainAttribution":20,"withSchedule":10,"legacyScheduleRows":13,"verifiedScheduleRows":13,"robotsChanged":0,"synopsisChanged":0,"airingsChanged":0}
