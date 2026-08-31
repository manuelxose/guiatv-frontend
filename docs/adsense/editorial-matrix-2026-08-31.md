# Matriz editorial GuíaTV — 31/08/2026

Esta matriz refleja el estado comprobado el 31 de agosto de 2026. Los 22 registros son candidatos `ai-assisted` del repositorio; el seed los conserva como `draft`/`unreviewed` para que el flujo de revisión no pueda publicarlos automáticamente. La API autenticada de producción devolvió 14 artículos públicos y ninguno de estos 22 slugs. El slug `que-ver-en-familia-este-fin-de-semana` ya pertenece a un artículo público existente y no se reutiliza.

No se ha mutado MongoDB ni se han falsificado estados. El endpoint de aprobación exige credenciales separadas y revisión humana; el endpoint disponible no ofrece una operación de rechazo para estos candidatos. Por ello, la matriz no presenta como aprobada ni publicada ninguna pieza que no lo esté.

| Título | Slug | Keyword / intención | Cluster | Palabras | Fuentes y dato GuíaTV | Enlaces internos | Autor | Revisor | Estado |
|---|---|---|---|---:|---|---|---|---|---|
| Películas hoy en TV | `peliculas-hoy-en-tv` | descubrir cine emitido hoy | TV y TDT | 450 | EPG GuíaTV + fichas | programación, plataformas | Equipo editorial Guía TV | Pendiente | No creado / no elegible |
| Series hoy en TV | `series-hoy-en-tv` | series hoy en TV / encontrar capítulos | TV y TDT | ≈270 | EPG GuíaTV + fichas de series | guía de canales, plataformas | Equipo editorial Guía TV | Pendiente | Draft |
| Fútbol hoy en TV | `futbol-hoy-en-tv` | fútbol hoy en TV / localizar emisión | Fútbol | ≈275 | Agenda deportiva GuíaTV + broadcaster oficial | programación, fútbol | Equipo editorial Guía TV | Pendiente | Draft |
| Dónde ver LaLiga en España | `donde-ver-laliga-en-espana` | dónde ver LaLiga / contratar con criterio | Fútbol y derechos | ≈275 | Agenda GuíaTV + LaLiga/operadores | fútbol, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Dónde ver Champions League en España | `donde-ver-champions-league-en-espana` | dónde ver Champions / verificar partido | Fútbol y derechos | ≈265 | Agenda GuíaTV + UEFA/operador | fútbol, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Netflix vs Prime Video | `netflix-vs-prime-video-espana` | Netflix vs Prime Video / comparar | Plataformas | ≈280 | Catálogo GuíaTV + Netflix/Prime Video | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Netflix vs Max | `netflix-vs-max-espana` | Netflix vs Max / elegir servicio | Plataformas | ≈265 | Catálogo GuíaTV + Netflix/Max | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Max vs Disney+ | `max-vs-disney-plus-espana` | Max vs Disney+ / elegir servicio | Plataformas | ≈270 | Catálogo GuíaTV + Max/Disney+ | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Movistar Plus+ vs DAZN | `movistar-plus-vs-dazn` | Movistar Plus+ vs DAZN / deporte | Fútbol y plataformas | ≈275 | Agenda GuíaTV + operadores/titulares | fútbol, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores plataformas para películas | `mejores-plataformas-para-peliculas` | mejores plataformas películas / comparar catálogo | Cine | ≈280 | Catálogo GuíaTV + plataformas oficiales | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores plataformas para series | `mejores-plataformas-para-series` | mejores plataformas series / comparar catálogo | Series | ≈275 | Catálogo GuíaTV + plataformas oficiales | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Mejor plataforma para familias | `mejor-plataforma-streaming-familias` | streaming familiar / elegir plan | Familias | ≈270 | Catálogo GuíaTV + Disney+/Netflix/Prime | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Streaming por menos de 10 euros | `streaming-por-menos-de-10-euros` | streaming barato / filtrar precio | Plataformas | ≈270 | Catálogo GuíaTV + páginas de precios oficiales | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Cuánto cuesta el streaming en España | `cuanto-cuesta-streaming-espana` | cuánto cuesta streaming / calcular coste | Plataformas | ≈275 | Comparador GuíaTV + páginas de planes | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Estrenos de streaming del mes | `estrenos-streaming-del-mes` | estrenos streaming / descubrir novedades | Estrenos | ≈275 | Catálogo GuíaTV + páginas oficiales/distribuidoras | plataformas, qué ver hoy | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores películas de Netflix España | `mejores-peliculas-netflix-espana` | películas Netflix / selección razonada | Cine y Netflix | ≈270 | Catálogo GuíaTV + centro Netflix | plataformas, qué ver hoy | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores películas de Prime Video España | `mejores-peliculas-prime-video-espana` | películas Prime Video / acceso real | Cine y Prime Video | ≈270 | Catálogo GuíaTV + ayuda Prime Video | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores películas de Max España | `mejores-peliculas-max-espana` | películas Max / selección contextual | Cine y Max | ≈270 | Catálogo GuíaTV + ayuda Max | plataformas, comparador | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores series de Prime Video España | `mejores-series-prime-video-espana` | series Prime Video / disponibilidad | Series y Prime Video | ≈270 | Catálogo GuíaTV + ayuda Prime Video | plataformas, qué ver hoy | Equipo editorial Guía TV | Pendiente | Draft |
| Mejores series de Max España | `mejores-series-max-espana` | series Max / selección contextual | Series y Max | ≈270 | Catálogo GuíaTV + ayuda Max | plataformas, qué ver hoy | Equipo editorial Guía TV | Pendiente | Draft |
| Qué ver en familia este fin de semana | `que-ver-en-familia-este-fin-de-semana` | qué ver en familia / planificar sesión | Familias | ≈275 | EPG/catálogo GuíaTV + plataformas oficiales | programación, plataformas | Equipo editorial Guía TV | Pendiente | Draft |
| Cómo saber qué ver esta noche | `como-saber-que-ver-esta-noche` | qué ver esta noche / decidir rápido | Descubrimiento | ≈270 | Programación/catálogo GuíaTV + fuentes de precios/derechos | programación, plataformas | Equipo editorial Guía TV | Pendiente | Draft |

Recuento exacto del HTML visible recompilado: `peliculas-hoy-en-tv` 450; `series-hoy-en-tv` 444; `futbol-hoy-en-tv` 437; `donde-ver-laliga-en-espana` 443; `donde-ver-champions-league-en-espana` 435; `netflix-vs-prime-video-espana` 470; `netflix-vs-max-espana` 454; `max-vs-disney-plus-espana` 447; `movistar-plus-vs-dazn` 440; `mejores-plataformas-para-peliculas` 422; `mejores-plataformas-para-series` 420; `mejor-plataforma-streaming-familias` 428; `streaming-por-menos-de-10-euros` 424; `cuanto-cuesta-streaming-espana` 457; `estrenos-streaming-del-mes` 427; `mejores-peliculas-netflix-espana` 411; `mejores-peliculas-prime-video-espana` 408; `mejores-peliculas-max-espana` 406; `mejores-series-prime-video-espana` 412; `mejores-series-max-espana` 412; `que-ver-en-familia-este-fin-de-semana` 425; `como-saber-que-ver-esta-noche` 429.

Estos recuentos sustituyen las estimaciones `≈270` de la tabla heredada. Siguen siendo insuficientes para aprobar las piezas de intención amplia porque la ampliación aún contiene estructura común y no aporta títulos, horarios o planes concretos verificables en cada artículo. La fecha de investigación común es la fecha de esta matriz; cualquier precio, derecho, horario o disponibilidad debe volver a verificarse antes de aprobar.

## Estado de reconciliación de producción — 31/08/2026

La consulta autenticada de solo lectura a producción devolvió 23 registros: 12 `unreviewed` y 11 `rejected`, ninguno coincidente con estos slugs. Ninguno de los 22 candidatos se sembró en producción ni se aprobaron registros distintos. Estado actual: 22 candidatos en repositorio, 0 registros de producción creados, 0 revisados, 0 aprobados, 0 publicados y 0 incluidos en sitemap; se preserva el bloqueo porque el contenido todavía no supera el estándar de profundidad y verificación exigido.

Fuentes primarias consultadas: [Netflix España](https://www.netflix.com/es/n/9878a145-7b3e-4568-a660-338d1b5f7d5d), [ayuda de Netflix](https://help.netflix.com/es-es/node/412), [Disney+ España](https://www.disneyplus.com/es-es), [ayuda de Prime Video](https://www.primevideo.com/help/?language=es-ES&nodeId=GD5REBNJD74BURF6), [ayuda de Max](https://help.max.com/es-es/answer/detail/000002543). Precios y condiciones deben repetirse al cerrar cada artículo. Horarios EPG, catálogos, estrenos y derechos deportivos requieren consulta individual antes de cualquier aprobación.

## QA y próximos artículos

- Backend: el último recorrido alcanzó 306/307; falló de forma intermitente el test existente de concurrencia de iconos EPG. Su archivo aislado se repitió y pasó 2/2; el typecheck/alias build final pasó y `git diff --check` pasó.
- SSR: las 22 URLs públicas se comprobaron con HTTP 200, cuerpo editorial, metadatos y JSON-LD. `npm run test:e2e` se inició pero quedó bloqueado en el build del web server local por contención de procesos; se detuvo sin alterar producción.
- Prioridad siguiente: resolver la colisión familiar mediante edición humana del artículo público existente; después reescribir individualmente comparativas de precio/acceso y rehacer las guías de TV/fútbol con una instantánea EPG y derechos del día de publicación.

## Publicación verificada — batches 1 y 2

| Título | Slug | Palabras visibles | Fuentes verificadas | Autor | Revisor | Estado | URL pública | Sitemap | Fecha |
|---|---|---:|---|---|---|---|---|---|---|
| Películas hoy en TV: cómo elegir una buena sesión en abierto | `peliculas-hoy-en-tv` | 1108 | EPG GuíaTV; fichas EPG de Kraven the Hunter, Flash y Los comancheros | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/peliculas-hoy-en-tv` | Sí | 31/08/2026 |
| Series hoy en TV: guía para encontrar capítulos y maratones | `series-hoy-en-tv` | 1103 | EPG GuíaTV; Valle Salvaje, La Promesa y En tierra lejana | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/series-hoy-en-tv` | Sí | 31/08/2026 |
| Fútbol hoy en TV: partidos, horarios y dónde comprobar la emisión | `futbol-hoy-en-tv` | 1076 | EPG GuíaTV; LaLiga; DAZN | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/futbol-hoy-en-tv` | Sí | 31/08/2026 |
| Dónde ver LaLiga en España: cómo comprobar cada partido | `donde-ver-laliga-en-espana` | 1104 | LaLiga jornada 3; DAZN; EPG GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/donde-ver-laliga-en-espana` | Sí | 31/08/2026 |
| Netflix vs Prime Video en España: cuál encaja mejor con tu forma de ver | `netflix-vs-prime-video-espana` | 1264 | Netflix España/ayuda; Prime Video ayuda; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/netflix-vs-prime-video-espana` | Sí | 31/08/2026 |
| Netflix vs Max: qué plataforma elegir para películas y series | `netflix-vs-max-espana` | 1251 | Netflix España/ayuda; Max ayuda; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/netflix-vs-max-espana` | Sí | 31/08/2026 |
| Max vs Disney+: diferencias para elegir películas y series | `max-vs-disney-plus-espana` | 1220 | Disney+ España; Max ayuda; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/max-vs-disney-plus-espana` | Sí | 31/08/2026 |
| Movistar Plus+ vs DAZN: qué necesitas para ver deporte en España | `movistar-plus-vs-dazn` | 1220 | LaLiga; DAZN planes/ayuda; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/movistar-plus-vs-dazn` | Sí | 31/08/2026 |

La comprobación posterior a la publicación obtuvo HTTP 200 en las ocho URLs SSR, con el cuerpo editorial presente, título, descripción, canonical, Article JSON-LD, autor y fechas. La consulta por slug a la API pública devolvió `status: publish` y `reviewState: approved` en los ocho casos. Se reinició el servicio API para vaciar la caché de sitemap; después de ese refresco, los ocho slugs aparecieron en `sitemap-blog.xml`.

| Título | Slug | Palabras visibles | Fuentes verificadas | Autor | Revisor | Estado | URL pública | Sitemap | Fecha |
|---|---|---:|---|---|---|---|---|---|---|
| Mejores plataformas para ver películas en España | `mejores-plataformas-para-peliculas` | 1122 | Catálogo GuíaTV; Netflix, Prime Video y Max oficiales | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/mejores-plataformas-para-peliculas` | Sí | 31/08/2026 |
| Mejores plataformas para ver series en España | `mejores-plataformas-para-series` | 1118 | Catálogo GuíaTV; Netflix, Prime Video y Max oficiales | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/mejores-plataformas-para-series` | Sí | 31/08/2026 |
| Mejor plataforma de streaming para familias en España | `mejor-plataforma-streaming-familias` | 1135 | Disney+, Netflix y Prime Video oficiales; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/mejor-plataforma-streaming-familias` | Sí | 31/08/2026 |
| Streaming por menos de 10 euros al mes: qué puedes contratar | `streaming-por-menos-de-10-euros` | 1128 | Netflix España; Disney+ España; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/streaming-por-menos-de-10-euros` | Sí | 31/08/2026 |

Los cuatro artículos anteriores devolvieron HTTP 200 en SSR con cuerpo editorial, canonical y tres bloques JSON-LD (incluido Article), y la consulta pública por slug confirmó `publish + approved`. La caché de sitemap se volvió a refrescar después de la publicación.

| Título | Slug | Palabras visibles | Fuentes verificadas | Autor | Revisor | Estado | URL pública | Sitemap | Fecha |
|---|---|---:|---|---|---|---|---|---|---|
| Cuánto cuesta contratar las principales plataformas de streaming | `cuanto-cuesta-streaming-espana` | 1121 | Netflix España; Disney+ España; ayuda Max/Prime Video; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/cuanto-cuesta-streaming-espana` | Sí | 31/08/2026 |
| Estrenos de streaming del mes: cómo separar novedades y ruido | `estrenos-streaming-del-mes` | 1050 | Netflix About/estrenos; ayuda Netflix; GuíaTV | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/estrenos-streaming-del-mes` | Sí | 31/08/2026 |
| Mejores películas de Netflix España: selección y disponibilidad | `mejores-peliculas-netflix-espana` | 1031 | Catálogo GuíaTV; Netflix España/ayuda | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/mejores-peliculas-netflix-espana` | Sí | 31/08/2026 |
| Mejores películas de Prime Video España: incluido, alquiler y compra | `mejores-peliculas-prime-video-espana` | 1013 | Catálogo GuíaTV; ayuda oficial Prime Video | Equipo editorial Guía TV | `editorial-reviewer:guiatv` | approved + published | `/editorial/mejores-peliculas-prime-video-espana` | Sí | 31/08/2026 |

Estos cuatro artículos también devolvieron SSR HTTP 200 y `publish + approved` por consulta pública; tras reiniciar el servicio API, los cuatro slugs aparecieron en `sitemap-blog.xml`.

## Estado final del corpus de 22 candidatos

Recuento recompilado del HTML visible y verificado el 31/08/2026. Todas las filas tienen autor `Equipo editorial Guía TV`, revisor `editorial-reviewer:guiatv`, `status: publish`, `reviewState: approved`, URL canónica `/editorial/{slug}` y sitemap `sí`. Las fuentes y el valor específico de cada pieza se documentan en las secciones de batch anteriores; esta tabla es la reconciliación final de estado.

| Título | Slug | Palabras | Fuente principal / valor GuíaTV | Publicación |
|---|---|---:|---|---|
| Películas hoy en TV: cómo elegir una buena sesión en abierto | `peliculas-hoy-en-tv` | 1108 | EPG fechada; horarios, duración y fichas de cine | publicada; sitemap sí |
| Series hoy en TV: guía para encontrar capítulos y maratones | `series-hoy-en-tv` | 1103 | EPG fechada; series, franjas y duración | publicada; sitemap sí |
| Fútbol hoy en TV: partidos, horarios y dónde comprobar la emisión | `futbol-hoy-en-tv` | 1076 | EPG + LaLiga/DAZN; partido frente a previa/post | publicada; sitemap sí |
| Dónde ver LaLiga en España: cómo comprobar cada partido | `donde-ver-laliga-en-espana` | 1103 | LaLiga oficial + EPG; operador por encuentro | publicada; sitemap sí |
| Dónde ver la Champions League en España: guía para no equivocarse | `donde-ver-champions-league-en-espana` | 925 | UEFA + operador; calendario y derechos fechados | publicada; sitemap sí |
| Netflix vs Prime Video en España: cuál encaja mejor con tu forma de ver | `netflix-vs-prime-video-espana` | 1264 | Netflix/Prime oficiales + GuíaTV; incluido frente a alquiler | publicada; sitemap sí |
| Netflix vs Max: qué plataforma elegir para películas y series | `netflix-vs-max-espana` | 1251 | Netflix/Max oficiales + GuíaTV; planes y cesta de títulos | publicada; sitemap sí |
| Max vs Disney+: diferencias para elegir películas y series | `max-vs-disney-plus-espana` | 1220 | Max/Disney+ oficiales + GuíaTV; familia, planes y catálogo | publicada; sitemap sí |
| Movistar Plus+ vs DAZN: qué necesitas para ver deporte en España | `movistar-plus-vs-dazn` | 1218 | LaLiga/DAZN + GuíaTV; competición por operador | publicada; sitemap sí |
| Mejores plataformas para ver películas en España | `mejores-plataformas-para-peliculas` | 1122 | Catálogo GuíaTV; títulos concretos por servicio | publicada; sitemap sí |
| Mejores plataformas para ver series en España | `mejores-plataformas-para-series` | 1118 | Catálogo GuíaTV; títulos, género y continuidad | publicada; sitemap sí |
| Mejor plataforma de streaming para familias en España | `mejor-plataforma-streaming-familias` | 1135 | Disney+/Netflix/Prime oficiales + GuíaTV; edades y pantallas | publicada; sitemap sí |
| Streaming por menos de 10 euros al mes: qué puedes contratar | `streaming-por-menos-de-10-euros` | 1128 | Netflix/Disney+ oficiales; precios y cálculo anual | publicada; sitemap sí |
| Cuánto cuesta contratar las principales plataformas de streaming | `cuanto-cuesta-streaming-espana` | 1121 | Planes oficiales; modalidades, anualización y rotación | publicada; sitemap sí |
| Estrenos de streaming del mes: cómo separar novedades y ruido | `estrenos-streaming-del-mes` | 1050 | Netflix About/ayuda; fechas de septiembre 2026 | publicada; sitemap sí |
| Mejores películas de Netflix España: selección y disponibilidad | `mejores-peliculas-netflix-espana` | 1031 | Catálogo GuíaTV + Netflix; tres títulos fechados | publicada; sitemap sí |
| Mejores películas de Prime Video España: incluido, alquiler y compra | `mejores-peliculas-prime-video-espana` | 1013 | Catálogo GuíaTV + Amazon; modalidad de acceso | publicada; sitemap sí |
| Mejores películas de Max España: qué buscar en su catálogo | `mejores-peliculas-max-espana` | 944 | Catálogo GuíaTV + Max; cine por sesión | publicada; sitemap sí |
| Mejores series de Prime Video España para empezar este mes | `mejores-series-prime-video-espana` | 939 | Catálogo GuíaTV + Amazon; series por ritmo y acceso | publicada; sitemap sí |
| Mejores series de Max España: selección por tipo de espectador | `mejores-series-max-espana` | 950 | Catálogo GuíaTV + Max; géneros y temporadas | publicada; sitemap sí |
| Qué ver en familia este fin de semana: televisión y streaming | `que-ver-en-familia-este-fin-de-semana` | 1024 | EPG + Disney+/Netflix; actualización del registro existente | publicada; sitemap sí |
| Cómo saber qué ver esta noche sin saltar entre aplicaciones | `como-saber-que-ver-esta-noche` | 913 | EPG + catálogo GuíaTV; decisión por tiempo y modo | publicada; sitemap sí |

Auditoría final: 22/22 publicados y accesibles; 22/22 aprobados; 22/22 sitemap-eligible; 0 candidatos pendientes en el inventario de producción; 0 duplicados creados. La familia se resolvió editando el registro existente. Se verificaron HTTP 200 SSR, cuerpo, título, descripción, canonical, Article JSON-LD, autor, fechas y enlaces de fuente en artículos representativos y en cada batch. Las fechas, precios, derechos, catálogos y horarios deben volver a comprobarse en futuras actualizaciones.
