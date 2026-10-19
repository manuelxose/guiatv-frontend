# Consolidation map — proposal only (2026-10-19)

Nothing here has been unpublished, redirected or edited. Source: `artifacts/seo/editorial-audit-post-deploy.json` (52 posts, 35 blocking) plus slugs/titles. Decisions belong to the editor (Max Nova); low traffic alone is not a reason to delete (the whole site had 8 clicks in 16 months, so traffic cannot rank these posts).

Principle: one URL per search intent. Where a live tool page already answers the intent better than a static post, the post is redundant. A 301 is proposed only when a canonical target exists and the old URL has no unique value; the sitemap and internal links follow the redirect.

| Intent | Posts today | Proposed canonical | Action |
|---|---|---|---|
| Champions on TV in Spain | `donde-ver-la-champions-league-2026-27-…`, `donde-ver-champions-league-en-espana` | draft 01 | rewrite → 301 both to the new slug |
| LaLiga on TV/streaming | `como-ver-laliga-en-streaming-en-espana-guia-2026`, `como-ver-laliga-en-streaming-plataformas-precios-y-canales`, `donde-ver-laliga-en-espana` | draft 02 | rewrite → 301 the others |
| LaLiga operators | `movistar-plus-vs-dazn` | keep, link from draft 02 | add sources (flagged: no external link) |
| La Vuelta 2026 | `donde-ver-la-vuelta-2026-…-opcio…`, `como-ver-la-vuelta-2026-en-tv-y-streaming-…` | one post or archive | event ended; merge into one dated archive page or 301 to `/deportes` hub; editor decides |
| Free sport on TV | `donde-ver-deporte-gratis-en-tv-…`, `deporte-en-abierto-programacion-de-esport3-…` | the first | merge; verify channels' current schedule |
| Streaming prices | `comparativa-de-precios-de-plataformas-…`, `comparativa-de-plataformas-de-streaming-en-espana-precios-y-catalogo`, `cuanto-cuesta-streaming-espana`, `streaming-por-menos-de-10-euros`, `plataformas-streaming-mas-baratas` (105 w) | one «precios» guide, prices copied from provider pages on publication day; `/comparador-streaming` as the tool | merge 5 → 1, 301 |
| Which platform to choose | `mejor-plataforma-streaming-familias`, `mejores-plataformas-para-series`, `mejores-plataformas-para-peliculas`, `que-plataforma-tiene-mas-peliculas` (79 w) | keep the first three if each has distinct picks; 301 the thin one | edit |
| Versus pages | `netflix-vs-max-espana`, `netflix-vs-prime-video-espana`, `max-vs-disney-plus-espana` | keep (distinct intents) | add sources; shorten Netflix-vs-Prime title (71 chars) |
| Platform rankings | `mejores-series-netflix` (141 w), `mejores-series-max` (75 w) vs `mejores-series-max-espana`; `mejores-peliculas-prime-video` (116 w) vs `…-prime-video-espana`; `mejores-series-disney-plus` (79 w), `mejores-series-movistar-plus` (73 w), `mejores-animes-crunchyroll` (73 w) | the longer `-espana` version where one exists | merge thin → long; others need a human-written list with real titles or retire |
| Monthly/weekly releases | `mejores-series-de-estreno-en-septiembre-2026-…`, `las-mejores-peliculas-…-septiembre-de-2…`, `estrenos-streaming-del-mes`, `estrenos-en-streaming-esta-semana`, `estrenos-de-cine-de-la-semana-…` | one evergreen «estrenos» hub updated by a person | expired; archive as noindex or 301 to the hub |
| «Hoy en TV» | `futbol-hoy-en-tv`, `series-hoy-en-tv`, `peliculas-hoy-en-tv`, `que-ver-hoy-en-tv-y-streaming`, `como-saber-que-ver-esta-noche`, `que-ver-esta-noche-en-la-tdt` (195 w), `que-ver-en-familia-este-fin-de-semana` | live pages `/deportes/futbol/partidos-hoy`, `/programacion-tv/series`, `/programacion-tv/peliculas`, `/programacion-tv/que-ver-hoy` | these are the main near-duplicate cluster (Jaccard 0.35–0.45); 301 to the live pages |
| TDT channels | `canales-de-cine-en-tdt-guia-completa-…`, `mejores-canales-tdt-para-cine-y-series` (87 w), `canales-infantiles-en-tdt-…` | first and third keep; 301 the thin one | edit |
| Event/item pages | `anoche-conquiste-tebas`, `katy-perry-the-lifetimes-tour-live-from-paris`, `harry-potter-y-la-piedra-filosofal`, `donde-ver-series-espanolas` (171 w) | editor | no evidence of demand; likely retire |

## Mechanics when approved
Redirects: no blog-slug redirect table exists yet in the repo — it needs one small change (backend `BlogController` slug lookup → 301 to `redirectTo`) plus removal from `sitemap-blog.xml` (already driven by `PUBLIC_EDITORIAL_FILTER`). Not built now because nothing is approved.

## Image provenance
17 posts hotlink `auctorio.com` images with no ownership record: replace with owned or licensed images before re-approval.
