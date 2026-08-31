# Revisión del corpus editorial — 31 de agosto de 2026

## Resultado

Se revisó el inventario de 15 piezas de la semilla editorial aprobada. La mayor debilidad no era la falta de longitud, sino la distancia entre algunos títulos y la respuesta ofrecida: había comparaciones sin precios, rankings sin criterio visible y recomendaciones que remitían a la aplicación sin explicar qué debía decidir el lector.

Además de mejorar las tres piezas curatoriales iniciales, se reescribieron los 22 candidatos con investigación específica y se tramitaron por la ruta real POST draft → PUT → aprobación protegida. El resultado verificado es 22/22 `publish + approved`, 22/22 URLs SSR públicas y 22/22 entradas en el sitemap editorial. No se mutaron estados directamente ni se desactivaron salvaguardas.

## Artículos mejorados

1. **Qué ver hoy en TV y streaming** (`que-ver-hoy-en-tv-y-streaming`)
   - Explica el criterio de decisión por tiempo, emisión, plataforma y fútbol.
   - Enlaza la respuesta a la parrilla EPG, guía de canales, plataformas y fútbol de GuíaTV.
   - Declara que horarios y derechos deben comprobarse en la vista viva.
2. **Plataformas de streaming más baratas** (`plataformas-streaming-mas-baratas`)
   - Añade una tabla de precios comprobados para España y separa planes con anuncios, catálogo incluido y alquileres/compras.
   - Da una recomendación accionable por perfil y propone rotación mensual.
   - Evita inventar el precio de Max cuando su fuente oficial indica que depende del plan y proveedor.
3. **Mejores series de Netflix para empezar hoy** (`mejores-series-netflix`)
   - Sustituye la apariencia de ranking automático por criterios editoriales explícitos.
   - Explica qué se verifica en GuíaTV y qué afirmaciones de popularidad no se hacen sin fuente localizada.
   - Añade metodología, autoría y enlace al centro de ayuda oficial de Netflix.

## Fuentes y verificación

La comprobación factual de precios, condiciones y catálogo regional se hizo el **31/08/2026**:

- [Netflix España](https://www.netflix.com/es/n/9878a145-7b3e-4568-a660-338d1b5f7d5d) y [Centro de ayuda de Netflix](https://help.netflix.com/es-es/node/412).
- [Disney+ España](https://www.disneyplus.com/es-es).
- [Ayuda oficial de Prime Video](https://www.primevideo.com/help/?language=dpb58f0815496d414184ce48423eec73c8dp&nodeId=GD5REBNJD74BURF6).
- [Centro de ayuda de Max](https://help.max.com/es-es/answer/detail/000002543).
- Para horarios y disponibilidad operativa: lectura interna EPG/catálogo de GuíaTV, enlazada desde las propias piezas.

Las cifras son una fotografía editorial y deben revisarse cuando cambien las páginas de los proveedores. Las promociones temporales no se presentan como precio normal.

## Reconciliación de los 22 candidatos

La matriz [editorial-matrix-2026-08-31.md](editorial-matrix-2026-08-31.md) contiene el título, slug, recuento visible, intención, fuentes, valor GuíaTV, autor, revisor, estado, URL y sitemap de cada artículo. La colisión `que-ver-en-familia-este-fin-de-semana` se resolvió actualizando el registro aprobado existente, sin crear un duplicado. Las otras 21 piezas se crearon como borradores y se aprobaron después de la actualización editorial.

## Gaps restantes

- Los precios, derechos, horarios, catálogos y estrenos son volátiles y requieren una nueva fecha de verificación en cada actualización.
- La suite E2E local quedó bloqueada en el build del web server por contención de procesos; las 22 páginas sí pasaron comprobación SSR pública directa.
- La suite backend tuvo un fallo intermitente en un test existente de concurrencia EPG; la repetición aislada pasó 2/2. No se modificó ese área no relacionada.
- La aprobación sigue siendo una decisión editorial humana: cualquier actualización futura debe pasar por la revisión configurada antes de considerarse publicación pública.

## Próximos artículos recomendados

1. Mantener las guías diarias de TV y fútbol mediante una tarea editorial fechada que revalide EPG y derechos.
2. Actualizar precios de plataformas solo desde páginas oficiales españolas, separando promociones de tarifas normales.
3. Revisar periódicamente las cestas de títulos de cine/series en GuíaTV para retirar disponibilidad caducada.
4. Añadir nuevas piezas solo cuando resuelvan una intención distinta y tengan evidencia propia; no crear variaciones de keywords.
