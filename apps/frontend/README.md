# Guía TV - Angular 20 SSR

Una aplicación Angular 20 con Server-Side Rendering (SSR) optimizada para desarrollo y producción.

## 🚀 Desarrollo con SSR y Auto-reload

### Comando único para desarrollar con SSR:

```bash
npm run dev:ssr
```

Este comando:
- ✅ Mata procesos anteriores en el puerto 4200 automáticamente
- ✅ Construye la aplicación inicial con SSR
- ✅ Inicia el modo watch para detectar cambios
- ✅ Reinicia el servidor automáticamente cuando hay cambios
- ✅ Sirve la aplicación en http://localhost:4200

### Scripts disponibles:

```bash
npm start           # Desarrollo cliente (sin SSR)
npm run build       # Build producción cliente
npm run build:ssr   # Build producción con SSR
npm run serve:ssr   # Build y servir SSR (una vez)
npm run dev:ssr     # Desarrollo SSR con auto-reload
npm test            # Ejecutar tests
```

## ⚡ Características

- **Auto-reload**: Cambios detectados automáticamente
- **Puerto único**: Todo en localhost:4200
- **Proceso único**: Un solo comando para todo
- **Optimizado**: Dependencias mínimas necesarias
- **Compatible**: Funciona en Windows con PowerShell

## 📁 Estructura simplificada

- `server.ts` - Servidor Express optimizado (68 líneas)
- `start-ssr-dev.js` - Script de desarrollo con auto-reload
- Configuración Angular en `angular.json` y `tsconfig.*.json`

## 🛑 Detener desarrollo

Presiona `Ctrl+C` para detener todos los procesos automáticamente.

## 🔧 Tecnologías

- Angular 20
- Angular SSR
- Express.js
- TypeScript
- RxJS

## 🚀 Desarrollo

### Servidor de desarrollo (CSR)
```bash
npm start
```
Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias algún archivo fuente.

### Servidor de desarrollo SSR
```bash
# Terminal 1: Build with watch mode
npm run dev:ssr

# Terminal 2: Serve the built application
node dist/guiatv/server/main.server.mjs
```
Inicia el servidor SSR en modo desarrollo. El primer comando construye la aplicación y observa cambios, el segundo sirve la aplicación. Navega a `http://localhost:4200/`.

## 🏗️ Construcción

### Construcción estándar
```bash
npm run build
```

### Construcción SSR
```bash
npm run build:ssr
```
Construye la aplicación con SSR habilitado. Los artefactos se almacenan en el directorio `dist/`.

### Servir aplicación SSR construida
```bash
npm run serve:ssr
```
Construye y sirve la aplicación SSR optimizada para producción.

## 🔧 Scripts disponibles

- `npm start` - Servidor de desarrollo (client-side)
- `npm run build` - Construcción para producción
- `npm run build:ssr` - Construcción SSR
- `npm run serve:ssr` - Construcción y servicio SSR (one-time)
- `npm run dev:ssr` - Construcción SSR con modo watch (observa cambios)
- `npm run dev:ssr:serve` - Construcción y servicio SSR (one-time)
- `npm run prerender` - Pre-renderizado de rutas estáticas
- `npm test` - Ejecutar pruebas unitarias

### Flujo de desarrollo SSR recomendado

1. **Terminal 1**: `npm run dev:ssr` (observa cambios y reconstruye)
2. **Terminal 2**: `node dist/guiatv/server/main.server.mjs` (sirve la aplicación)
3. Reinicia el comando del Terminal 2 después de cada reconstrucción para ver los cambios

## 📋 Características

- ✅ Angular 20 con SSR optimizado
- ✅ Servidor Express.js simplificado
- ✅ Recarga automática en desarrollo
- ✅ Configuración mínima y eficiente
- ✅ Compatible con Firebase Hosting/Functions

## 🛠️ Tecnologías

- Angular 20
- Angular SSR
- Express.js
- TypeScript
- RxJS
