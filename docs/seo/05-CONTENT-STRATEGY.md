# 05 — Editorial content strategy (2026-10-19)

**Evidence limits.** No Search Console or keyword-tool data is available, so there is **no search volume, difficulty or ranking-URL data below**. "Demand" is qualitative (evident recurring information needs); "competition" is a *hypothesis* (large Spanish TV guides, broadcaster sites, Xataka/Fotogramas-type media). Before writing any brief, validate with GSC queries (impressions with no matching page) and one manual SERP check; drop topics that fail.

## Positioning (what only GuíaTV can say)
GuíaTV owns three live datasets: **EPG for ~80 Spanish channels**, **TMDB+provider availability for Spain**, **football fixtures with broadcasters**. An article is worth publishing only if it *uses these data to answer a decision* (what to watch tonight / where to see X / which subscription to keep) and shows a verification date. Generic "best series on Netflix" lists compete with everyone and are already covered by the 7-post cluster — don't add more.

## Principles
1. One pillar per intent; update it instead of new dated posts. 2. Every claim with a dated source (official page, broadcaster, distributor). 3. Live components embedded (airings, availability) so the page stays correct. 4. No near-duplicates per platform/genre. 5. Mark opinion as opinion; no invented first-hand viewing.

## 30 topic opportunities (clusters → priority)
Priority P1 = ties to unique data and fills a gap vs. existing posts; P2 = good but needs validation; P3 = optional.

**A. Tonight / this week on Spanish TV (EPG-backed)**
1. Qué películas ponen esta noche en la TDT (daily, auto-assembled + editorial pick) — P1
2. Películas de la semana en TV en abierto, por canal — P1
3. Series que empiezan esta semana en TDT y cable — P1
4. Estrenos en TV en abierto del fin de semana — P2
5. Qué ver en familia en TV hoy (sin plataformas) — P2
6. Documentales de la semana en La 2, Canal Historia, Discovery — P2
7. Cine clásico en TV esta semana (TCM/La 2/Clan) — P3

**B. Football on TV (broadcaster-backed)**
8. Dónde ver LaLiga esta jornada: partido → canal (pillar, updated weekly) — P1
9. Dónde ver la Champions esta semana en España — P1
10. Fútbol gratis en abierto: qué partidos se ven sin pago — P1
11. Cómo ver LaLiga: qué plataforma contratar según tu equipo — P2
12. Selecciones y ventanas FIFA: dónde verlas (cuando toque) — P2
13. Calendario de TV de la Copa del Rey/Supercopa — P3

**C. Streaming platforms in Spain (availability-backed)**
14. Qué plataforma tiene cada serie/película popular hoy (tabla verificada) — P1
15. Precios de plataformas en España con fecha de verificación (rehacer `plataformas-streaming-mas-baratas`) — P1
16. Qué se va de Netflix/Max/Prime este mes (caducidades de catálogo) — P2
17. Estrenos del mes por plataforma (un pillar mensual) — P1
18. Cómo compartir cuenta/anuncios: planes con publicidad vs sin — P2
19. Comparativa Netflix vs Max vs Prime vs Disney+ por perfil de uso (consolidar los 5 "X vs Y") — P1
20. Qué ver gratis legalmente: RTVE Play, Atresplayer, Mitele, Pluto — P2

**D. Recommendations (selection with criteria)**
21. Series cortas (≤ 8 episodios) para ver en un fin de semana — P2
22. Películas para ver en familia por edad — P2
23. Thrillers/misterio disponibles hoy en plataformas — P3
24. Series españolas recientes y dónde verlas (rehacer `donde-ver-series-espanolas`) — P2
25. Anime en plataformas en España (Crunchyroll, Netflix, Prime) — P3

**E. TV channel guides (utility)**
26. Guía de canales TDT: qué emite cada uno y cómo sintonizarlos — P2
27. Canales infantiles en TDT: franjas y contenidos (existe; actualizar) — P3
28. Cómo ver la TDT sin antena/online (canales oficiales) — P2

**F. News with TV angle (only with a source and a "so what")**
29. Cambios de parrilla/estrenos anunciados por cadenas (nota breve con fuente oficial) — P2
30. Fechas de estreno de grandes producciones en plataformas (calendario oficial) — P2

## 10 priority briefs
Each brief: intent · unique value · must-have sources · format/length (a guide, not a quota) · update cadence · links in/out.

1. **Qué películas ponen esta noche en TV en abierto** — *intent:* decide tonight's film. *Value:* EPG film list per channel with start time, genre, runtime, platform alternative. *Sources:* GuíaTV EPG + TMDB; broadcaster programming pages. *Format:* evergreen hub + live module; editorial pick of the day (3–4 lines each). *Update:* daily (auto) + weekly editor pass. *Links:* `/programacion-tv/peliculas`, channel pages, platform comparator.
2. **Dónde ver LaLiga esta jornada** — match→broadcaster table, free vs paid, dated; source: LaLiga/Movistar/DAZN official schedules. Weekly. Links: `/deportes/futbol/partidos-hoy`, comparison of football subscriptions. *Replaces* `donde-ver-laliga-en-espana`, `como-ver-laliga-en-streaming-*` (301).
3. **Dónde ver la Champions esta semana** — same format; replaces 2 existing Champions posts.
4. **Precios de plataformas de streaming en España (verificado el …)** — table: plan, price, ads, resolution, simultaneous screens; official pricing pages only, promotions separated. Monthly. Replaces `plataformas-streaming-mas-baratas`, `cuanto-cuesta-streaming-espana`, `streaming-por-menos-de-10-euros`, two "comparativa-de-precios" posts.
5. **Netflix vs Max vs Prime Video vs Disney+: cuál te conviene** — decision matrix by use case (series, cine, fútbol, niños, precio); consolidates the six pairwise posts. Quarterly.
6. **Estrenos de streaming del mes** — pillar per month from distributor/platform press pages; one URL per month is fine *only if* each is substantively different; otherwise a single rolling page. Monthly.
7. **Qué plataforma tiene… (tabla de disponibilidad de 30 títulos populares)** — GuíaTV availability data, refreshed; clearly shows "visto en … el …". Weekly.
8. **Fútbol gratis en abierto** — which matches/competitions are on free channels this month; source: broadcaster press. Weekly in season.
9. **Series que empiezan esta semana** — EPG + platform premieres; editorial note on why watch. Weekly.
10. **Guía de canales de la TDT** — consolidated static guide (channel, owner, genre, number, how to tune); sources: official operators/CNMC. Annual review.

## Existing articles — action list (from the corpus audit)
- **Rewrite:** the 10 human stubs (see 03); `mejores-series-netflix` (141 words), `que-ver-hoy-en-tv-y-streaming` (275).
- **Consolidate + 301:** the 10-post "hoy-en-tv/dónde ver" cluster into briefs 1/2/3/8; the 7-post "mejores … españa" cluster + 2 plataformas posts into brief 5 and 7.
- **Update or retire (410):** Vuelta 2026 (2), Champions 2026-27 (1), "esta semana" posts, "septiembre" posts, `anoche-conquiste-tebas`, `katy-perry-…`, `harry-potter-…` unless an editor can show they serve a search need.
- **Fix:** raw Markdown (render repair deployed in code), truncated meta, own the images.

## Internal-linking rules
Every pillar links to the live GuíaTV page that proves its claim (channel, guide, platforms, football) in the first screen; live pages link back to the pillar ("Guía editorial"); no more than one pillar per intent; breadcrumbs `Inicio › Editorial › Categoría`. Use the `seo-cluster` / `mk-site-architecture` skills in the next session to map pillar↔spoke.

## Operating cadence
Daily: automated EPG modules (no new article). Weekly: football + premieres refresh (≈ 4 edits). Monthly: prices, month premieres, catalogue expiries. Quarterly: comparisons. Anything else is an exception that needs a documented search need.
