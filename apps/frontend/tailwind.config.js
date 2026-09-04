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
        // Spotify-inspired reskin — legacy red primary/gray surface scales
        // removed (confirmed unused: no bg-primary-*/surface-*/font-montserrat
        // in any template). Component styling reads --portal-*/--accent-*
        // custom properties directly rather than Tailwind color utilities;
        // this block stays for any future ad-hoc Tailwind color usage.
        primary: {
          50: '#e9fcef',
          100: '#c8f7d7',
          200: '#93eeb0',
          300: '#5fe589',
          400: '#3ddb6c',
          500: '#1ed760',
          600: '#1db954',
          700: '#169c46',
          800: '#0f7534',
          900: '#0a4f23',
          950: '#052912',
        },
        surface: {
          50: '#fdfdfd',
          100: '#eeeeee',
          200: '#cbcbcb',
          300: '#b3b3b3',
          400: '#7c7c7c',
          500: '#4d4d4d',
          600: '#272727',
          700: '#252525',
          800: '#1f1f1f',
          900: '#181818',
          950: '#121212',
        },
      },

      /**
       * Tipografía
       */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
        'glow': '0 0 20px rgba(30, 215, 96, 0.3)',
        'glow-lg': '0 0 40px rgba(30, 215, 96, 0.4)',
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