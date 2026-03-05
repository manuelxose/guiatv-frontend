/** @type {import('tailwindcss').Config} */
module.exports = {
  /**
   * OPTIMIZACIÓN: Content paths para purgar CSS no utilizado
   * Esto reduce significativamente el tamaño del CSS en producción
   * Ahorro estimado: ~29 KiB
   */
  content: [
    './src/**/*.{html,ts,scss}',
    './src/app/**/*.{html,ts,scss}',
    // Incluir también archivos de componentes
    './src/app/components/**/*.{html,ts}',
    './src/app/pages/**/*.{html,ts}',
  ],
  
  /**
   * OPTIMIZACIÓN: Safelist para clases dinámicas que no deben purgarse
   * Solo incluir las que realmente se usan dinámicamente
   */
  safelist: [
    // Clases de grid dinámicas usadas en program-list
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'grid-cols-7',
    // Clases de opacidad dinámicas
    'opacity-0',
    'opacity-50',
    'opacity-100',
    // Clases de color dinámicas para badges
    {
      pattern: /bg-(red|green|blue|yellow|gray)-(400|500|600|700|800)/,
      variants: ['hover'],
    },
    // Clases de animación
    'animate-pulse',
    'animate-spin',
    'animate-ping',
  ],

  /**
   * Tema personalizado para Guía TV
   */
  theme: {
    extend: {
      /**
       * Colores personalizados
       */
      colors: {
        // Paleta principal
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Grises personalizados para mejor contraste
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      
      /**
       * Tipografía
       */
      fontFamily: {
        montserrat: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
      },
      
      /**
       * Aspect ratios personalizados
       */
      aspectRatio: {
        'channel': '84 / 55',
        'banner': '1920 / 800',
        'poster': '2 / 3',
        'thumbnail': '16 / 9',
      },
      
      /**
       * Animaciones personalizadas
       */
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      
      /**
       * Espaciado adicional
       */
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      /**
       * Z-index personalizados
       */
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      /**
       * Sombras personalizadas
       */
      boxShadow: {
        'glow': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-lg': '0 0 40px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  
  /**
   * Plugins
   */
  plugins: [
    // Plugin para line-clamp (truncado de texto)
    function({ addUtilities }) {
      addUtilities({
        '.line-clamp-1': {
          display: '-webkit-box',
          '-webkit-line-clamp': '1',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
      });
    },
  ],
  
  /**
   * OPTIMIZACIÓN: Deshabilitar variantes no utilizadas
   * Reduce el tamaño del CSS generado
   */
  corePlugins: {
    // Deshabilitar preflight si usas estilos base propios
    // preflight: false,
  },
  
  /**
   * Modo oscuro (clase-based para más control)
   */
  darkMode: 'class',
};