# Asistente GuíaTV — readiness y operación

## Contrato y arquitectura

- El contrato HTTP/SSE es aditivo y se valida en el borde: historial acotado, roles permitidos, límite total y contexto de lanzamiento tipado.
- Las recomendaciones del proveedor generativo se resuelven de nuevo contra el catálogo interno; los elementos no resolubles se descartan.
- `Fútbol hoy` es determinista y procede de `FootballQueryService`, incluida la reconciliación de emisiones. No se pide al modelo que invente partidos.
- La respuesta conserva `intent`, `confidence`, `sections`, `actions`, `sources` y tarjetas de partido como campos opcionales compatibles.
- El flujo SSE expone un `requestId`, fases de progreso, cancelación real por `AbortController` y errores públicos no sensibles.

## UX y accesibilidad

- Móvil: diálogo modal de pantalla completa, compositor estable, áreas táctiles de 44 px, safe areas y acciones rápidas desplazables.
- Escritorio: panel lateral redimensionable; el asistente es la superficie primaria y Personas una acción secundaria.
- El diálogo atrapa el foco, se cierra con Escape y devuelve el foco al lanzador. Los estados se anuncian con `role=status`.
- Se respeta `prefers-reduced-motion`; las respuestas ya no simulan escritura. Sólo los tokens SSE aparecen progresivamente.

## Estados recuperables

`idle → connecting → retrieving → composing → streaming`, además de `recovering`, `cancelled`, `rate_limited`, `offline`, `login_required` y `unavailable`. Cancelación, offline, rate limit y fallo temporal conservan la conversación y ofrecen reintento.

## Seguridad y privacidad

- Nunca se registra el prompt o el historial completo; los logs incluyen identificadores y métricas de operación.
- El prompt de sistema trata usuario, historial y datos externos como datos no confiables, no como instrucciones.
- Los recordatorios requieren autenticación, título acotado y una fecha futura válida.
- No se escriben secretos ni identificadores sensibles en la telemetría del cliente.

## Observabilidad

Eventos de producto: `assistant_opened`, `assistant_closed`, `assistant_prompt_sent`, `assistant_generation_stopped`, `assistant_prompt_retried` y `assistant_recommendation_opened`. Métricas de servidor por petición: latencia al primer token, duración, recuento de resultados, finalización/cancelación y `requestId`.

## Presupuesto y medición

| Medida | Antes | Después | Resultado |
| --- | ---: | ---: | --- |
| Apertura del asistente, móvil (dev) | 918 ms | pendiente de captura final | validar tras build |
| Apertura del asistente, escritorio (dev) | 1089 ms | pendiente de captura final | validar tras build |
| Bundle inicial producción (raw) | sin baseline prod comparable | 1.07 MB | asistente diferido; Angular parcheado |
| Chunk diferido del shell de chat (raw) | 236.03 kB | 243.56 kB | +7.53 kB por estados/tarjeta fútbol y runtime Angular parcheado |

La diferencia del chunk es explícita y queda fuera del arranque. No se introdujo una optimización especulativa: se mantuvo el límite lazy ya existente y se eliminó una animación de layout detectada.

La auditoría de dependencias de producción pasó de 38 vulnerabilidades (incluida 1 crítica) a 5: 0 críticas, 2 altas y 3 moderadas, mediante Angular 20.3 parcheado y `npm audit fix` no destructivo. Las altas restantes requieren actualizaciones mayores de `sharp` y `nodemailer`; el árbol completo, incluido tooling de desarrollo, conserva 13 avisos (8 altos y 5 moderados). Deben tratarse como una migración separada con pruebas específicas; no se aplicó `--force`.

## Despliegue y rollback

1. Ejecutar build backend/frontend, pruebas backend y Playwright del shell/asistente.
2. Desplegar primero backend y después frontend: todos los campos nuevos son opcionales, por lo que una versión antigua del cliente ignora la extensión.
3. Verificar `/health`, una consulta SSE, `Fútbol hoy`, cancelación y reintento.
4. Observar errores, 429, cancelaciones y latencia al primer token durante el canary.
5. Rollback: revertir primero frontend; el backend aditivo sigue siendo compatible. Si hace falta, desactivar `AI_CHATBOT_ENABLED` para retirar el asistente sin afectar TV, catálogo, fútbol ni chat social.

Despliegue productivo completado el 25 de agosto de 2026 mediante la release unificada `20260825150252`. Durante la verificación se corrigieron la lista cerrada de hosts SSR, la confianza limitada en cabeceras del proxy, el `BootstrapContext` requerido por Angular 20 y un bypass de validación de host en respuestas cacheadas. API, SSR, MongoDB y Valkey quedaron activos; la matriz pública, el contenido SSR real, el cache hit y el rechazo de hosts ajenos se verificaron. Rollback recomendado: `20260824191713`.
