# Guía de Estilos - Guía TV App

## 🎨 Paleta de Colores

### Colores Principales
- **Rojo TV**: `#ef4444` (red-500) - Color principal de la marca
- **Rojo Oscuro**: `#dc2626` (red-600) - Hover states y botones activos
- **Rojo Profundo**: `#b91c1c` (red-700) - Estados pressed

### Colores de Fondo
- **Fondo Principal**: `bg-gradient-to-br from-gray-900 via-gray-800 to-black`
- **Cards**: `bg-gray-800/50 backdrop-blur-sm` (Glass morphism)
- **Overlays**: `bg-gray-900/95 backdrop-blur-md`

### Colores de Texto
- **Texto Principal**: `text-white`
- **Texto Secundario**: `text-gray-400`
- **Texto de Acento**: `text-red-400`

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `xs:480px` - Teléfonos pequeños
- **Tablet**: `sm:640px` - Tablets portrait
- **Desktop Small**: `md:768px` - Tablets landscape / Laptops pequeñas
- **Desktop**: `lg:1024px` - Laptops / Desktops
- **Desktop Large**: `xl:1280px` - Desktops grandes
- **Ultra Wide**: `2xl:1536px` - Pantallas ultra wide

### Grid Systems
```html
<!-- Mobile: 2 columnas -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">

<!-- Stats: 2 en mobile, 4 en desktop -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
```

## 🎭 Componentes de UI

### Botones

#### Botón Primario
```html
<button class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg">
  Texto del botón
</button>
```

#### Botón Secundario
```html
<button class="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50">
  Texto del botón
</button>
```

#### Floating Action Button (Mobile)
```html
<button class="w-14 h-14 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-110">
  <svg class="w-6 h-6">...</svg>
</button>
```

### Cards

#### Card Principal
```html
<div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
  <!-- Contenido -->
</div>
```

#### Glass Card
```html
<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
  <!-- Contenido -->
</div>
```

### Estados de Carga

#### Spinner Principal
```html
<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
```

#### Shimmer Effect
```html
<div class="animate-pulse bg-gray-300 dark:bg-gray-600 rounded h-20"></div>
```

## 🎨 Efectos Visuales

### Gradientes
- **Texto de Marca**: `bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent`
- **Fondo Hero**: `bg-gradient-to-br from-gray-900 via-gray-800 to-black`
- **Botones**: `bg-gradient-to-r from-red-600 to-red-700`

### Sombras
- **Cards**: `shadow-2xl`
- **Glow Effect**: `hover:shadow-red-500/25`
- **Depth**: `shadow-xl hover:shadow-2xl`

### Transiciones
- **Rápida**: `transition-all duration-200`
- **Estándar**: `transition-all duration-300`
- **Suave**: `transition-all duration-500`

## 📐 Espaciado

### Padding/Margin Sistema
- **Móvil**: `p-4 sm:p-6`
- **Desktop**: `lg:p-8`
- **Secciones**: `py-12 lg:py-16`

### Gaps
- **Móvil**: `gap-4`
- **Desktop**: `lg:gap-6`

## 🔤 Tipografía

### Jerarquía de Títulos
```html
<!-- H1 - Título Principal -->
<h1 class="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">

<!-- H2 - Sección -->
<h2 class="text-2xl lg:text-3xl font-bold text-white">

<!-- H3 - Subsección -->
<h3 class="text-xl font-semibold text-white">
```

### Texto Corporativo
```html
<!-- Texto Principal -->
<p class="text-base lg:text-lg text-gray-300">

<!-- Texto Secundario -->
<p class="text-sm text-gray-400">

<!-- Texto Pequeño -->
<p class="text-xs text-gray-500">
```

## 🎯 Principios de Diseño

### 1. Mobile First
- Diseñar primero para móviles
- Usar breakpoints progresivos: `sm:` → `md:` → `lg:` → `xl:`

### 2. Consistencia
- Usar colores de la paleta definida
- Mantener espaciado consistente
- Aplicar mismas transiciones

### 3. Accesibilidad
- Contraste mínimo WCAG AA
- Focus states visibles
- ARIA labels en elementos interactivos

### 4. Performance
- Lazy loading en imágenes
- Transiciones optimizadas con GPU
- Reducir motion para usuarios sensibles

## 📱 Componentes Específicos de TV

### Channel Logo Container
```html
<div class="w-32 lg:w-40 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 border-r border-gray-600 p-3 flex items-center justify-center">
```

### Program Grid Item
```html
<div class="absolute border-r border-gray-600/30 cursor-pointer hover:bg-red-600/20 transition-all duration-200 group">
```

### Category Badge
```html
<span class="inline-block px-2 py-0.5 text-xs rounded-full truncate max-w-full leading-tight transition-all duration-200 hover:scale-105">
```

### Time Indicator
```html
<div class="absolute w-0.5 bg-gradient-to-b from-red-400 via-red-500 to-red-600 z-50 shadow-2xl shadow-red-500/50">
```

## 🚀 Optimizaciones

### Performance CSS
- Usar `transform` en lugar de cambiar `left/top`
- Aplicar `will-change: transform` a elementos animados
- GPU acceleration con `translateZ(0)`

### Responsive Images
```html
<img class="w-full h-full object-cover" loading="lazy" />
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

Esta guía asegura consistencia visual y experiencia de usuario óptima en todos los dispositivos.
