# Autenticación con Google en GuíaTV (frontend + backend)

Este documento resume lo que se ha implementado para el inicio de sesión con Google, cómo configurarlo y qué pasos seguir a continuación.

## Resumen de la implementación (frontend + backend)
- **Frontend (Angular, SSR-aware)**  
  - `src/app/services/auth.service.ts`: carga Google Identity solo en navegador, intercambia el `idToken` por JWT en backend, maneja storage con guardas de SSR.  
  - `src/app/services/user.service.ts`: estado de usuario (perfil, actividad, amigos, watchlist), aplica sesión, sincroniza `/v2/auth/me`, y evita `localStorage` en SSR.  
  - `src/app/pages/auth/login/*`: pantalla de inicio de sesión con CTA “Continuar con Google”, formularios (email placeholder y quick profile).  
  - `src/app/pages/user-area/*`: área privada con dashboard (estado “viendo ahora”, recomendaciones, actividad, amigos, watchlist, privacidad/avisos).  
  - `src/app/components/menu` / `nav-bar`: menús con entradas “Iniciar sesión” y “Mi cuenta”, botón de logout, estados activos y colores.  
  - Entornos `src/environments/environment*.ts` incluyen `GOOGLE_CLIENT_ID`.

- **Backend (Express + MongoDB)**  
  - Modelo y repositorio de usuarios: `backend/src/infrastructure/database/models/User.model.ts`, `backend/src/infrastructure/repositories/MongoUserRepository.ts` (upsert por `googleId`/email, `lastLoginAt`).  
  - Servicio `AuthService` (`backend/src/domain/services/AuthService.ts`): verifica idToken con `google-auth-library`, genera JWT con `jsonwebtoken`, usa Mongo para persistir usuario.  
  - Rutas de auth: `backend/src/presentation/routes/auth.routes.ts` + controlador `AuthController`.  
    - `POST /v2/auth/google` → `{ user, token }`  
    - `GET /v2/auth/me` → usuario desde JWT  
    - `POST /v2/auth/logout` → confirmación (cliente descarta token)  
  - Container/servidor cableados: `config/container.ts` registra `authService`, `authController`; `server/index.ts` inyecta en `createV2Routes`.  
  - CORS (`corsMiddleware`) permite localhost y lista en `ALLOWED_ORIGINS`.

## Configuración necesaria
1) **Google Cloud Console (OAuth Web client)**
   - Añade en “Authorized JavaScript origins” el origen exacto desde el que navegas:  
     - Dev típico: `http://localhost:4200` (añade también otros puertos/URLs que uses).  
     - Prod: tu dominio HTTPS.
   - Para Google Identity (GSI/FedCM) no necesitas redirect URIs si usas el flujo actual.

2) **Variables de entorno**
   - Frontend: `src/environments/environment.ts` y `environment.prod.ts`  
     - `GOOGLE_CLIENT_ID=<tu_client_id>.apps.googleusercontent.com`
   - Backend: `backend/.env`  
     - `GOOGLE_CLIENT_ID=<el mismo client_id>`  
     - `JWT_SECRET=<clave_segura>`  
     - `ALLOWED_ORIGINS=http://localhost:4200,...` (origines adicionales si aplica)

3) **Dependencias ya instaladas**
   - Backend: `google-auth-library`, `jsonwebtoken`, `@types/jsonwebtoken`.

## Cómo funciona el flujo
1) El frontend invoca Google Identity. Si el usuario autoriza, recibe un `credential` (idToken).
2) Se envía `idToken` a `POST /v2/auth/google`.
3) El backend verifica el idToken contra Google, upserta el usuario en Mongo y devuelve un JWT propio + datos del usuario.
4) El frontend guarda el JWT (solo en navegador), marca sesión activa y puede pedir `/v2/auth/me` con `Authorization: Bearer <token>`.

## Inventario de archivos añadidos/modificados (usuario + auth)
- Frontend:
  - `src/app/services/auth.service.ts`
  - `src/app/services/user.service.ts`
  - `src/app/pages/auth/login/login.component.{ts,html,scss}`
  - `src/app/pages/user-area/user-area.component.{ts,html,scss}`
  - Menús y nav: `src/app/components/menu/*`, `src/app/components/nav-bar/*`
  - Rutas: `src/app/app.routes.ts` (añade `/iniciar-sesion`, `/mi-cuenta`)
  - Entornos: `src/environments/environment*.ts` (GOOGLE_CLIENT_ID)
- Backend:
  - Modelo usuario: `backend/src/infrastructure/database/models/User.model.ts`
  - Repo usuario: `backend/src/infrastructure/repositories/MongoUserRepository.ts`
  - Servicio: `backend/src/domain/services/AuthService.ts`
  - Controlador y rutas: `backend/src/presentation/controllers/AuthController.ts`, `.../routes/auth.routes.ts`, `.../routes/index.ts`
  - Contenedor/servidor: `backend/src/config/container.ts`, `backend/src/server/index.ts`
  - Config: `backend/.env` (`GOOGLE_CLIENT_ID`, `JWT_SECRET`, `ALLOWED_ORIGINS`)

## Pasos para probar en local
1) Configura el origen `http://localhost:4200` en el cliente de Google.
2) Rellena `GOOGLE_CLIENT_ID` en frontend y backend; define `JWT_SECRET` en `backend/.env`.
3) Arranca backend: `cd backend && npm start`.
4) Arranca frontend: `npm run dev:non-ssr` (o el comando que uses).
5) Entra a `/iniciar-sesion` y usa “Continuar con Google”. Debe retornar a `/mi-cuenta` con sesión activa.

## Siguientes pasos recomendados
1) **Reforzar seguridad y expiración**
   - Añadir invalidación/rotación de tokens (lista de revocación o expiraciones más cortas + refresh).
   - Añadir middleware de guard para proteger rutas privadas en el backend.

2) **Persistir perfil ampliado**
   - Guardar campos sociales (bio, géneros favoritos, estado “viendo ahora”) en Mongo y exponerlos en `/v2/auth/me`.
   - Añadir endpoints para actualizar perfil, privacidad y notificaciones.

3) **Protección de UI**
   - Añadir route guards en Angular para `/mi-cuenta`.
   - Mostrar estado de sesión en header/menú y CTA de logout.

4) **Producción**
   - Configurar orígenes HTTPS reales en Google Cloud.
   - Ajustar `API_BASE_URL`, `SITE_URL` y `ALLOWED_ORIGINS` para el dominio final.
   - Revisar logs y métricas de los endpoints de auth.

5) **Mejoras UX**
   - Manejar errores de FedCM/GSI (red bloqueada, CORS de Google) con mensajes claros y fallback a “login con ventana popup” si se desea.

## Roadmap adicional (mejoras a futuro)
- **Roles y permisos**: añadir roles básicos (user/admin) en JWT y middleware de autorización en backend.
- **Refresh tokens y revocación**: emitir refresh token (httpOnly), rotación y lista de revocados para cierre de sesión server-side.
- **Persistencia completa de perfil**: endpoint PUT/PATCH `/auth/me` para bio, géneros, estado “viendo ahora”, privacidad y notificaciones, con validación.
- **Sincronización de actividad**: endpoints para recomendaciones, listas y actividad social persistente en Mongo (hoy mock local).
- **Tests y observabilidad**: tests e2e del flujo de login, métricas y alertas en endpoints `/auth/*`.
- **CSRF/CSP endurecido**: añadir cabeceras CSP estrictas, SameSite/Lax en cookies si se usa refresh token, y protección CSRF en formularios.
- **Multi-IDP opcional**: soporte a otros proveedores (Apple/GitHub) reutilizando la capa JWT actual.

## Diagnóstico rápido de errores GSI/FedCM
- `network error / CORS` en `accounts.google.com`: el origen no está autorizado o la red bloquea el dominio. Revisa “Authorized JavaScript origins” y prueba en red sin proxy.
- JWT inválido en `/auth/me`: comprueba `JWT_SECRET` y que el token se envía en `Authorization: Bearer <token>`.
