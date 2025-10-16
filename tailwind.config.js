/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      // Custom animations for TV Guide app
      animation: {
        fadeIn: "fadeIn .6s cubic-bezier(.74,.01,.81,.75)",
        slideUp: "slideUp 0.5s ease-out",
        slideDown: "slideDown 0.5s ease-out",
        scaleIn: "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },

      // Custom keyframes
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(239, 68, 68, 0.6)" },
        },
      },

      // Custom spacing for TV Grid layouts
      spacing: {
        '452': '452px',
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },

      // Custom translate values
      translate: {
        "-452": "-452px",
      },

      // Custom colors for TV Theme
      colors: {
        'tv-red': {
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
        },
        'tv-gray': {
          850: '#1a1f2e',
          950: '#0a0d14',
        }
      },

      // Custom gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'tv-hero': 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        'tv-card': 'linear-gradient(145deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)',
      },

      // Custom box shadows
      boxShadow: {
        'tv': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        'tv-glow': '0 20px 60px -12px rgba(239, 68, 68, 0.25)',
        'tv-card': '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
        'tv-button': '0 4px 15px rgba(239, 68, 68, 0.3)',
      },

      // Custom border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Custom backdrop blur
      backdropBlur: {
        '4xl': '72px',
      },

      // Custom z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Custom font sizes
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.75rem' }],
        '2.5xl': ['1.75rem', { lineHeight: '2rem' }],
      },

      // Custom aspect ratios
      aspectRatio: {
        '2/3': '2 / 3',
        '3/4': '3 / 4',
        '9/16': '9 / 16',
        '16/9': '16 / 9',
      },

      // Custom screens for better responsive control
      screens: {
        'xs': '480px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
    },
  },

  // Core plugins optimization
  corePlugins: {
    preflight: true,
    container: true,
  },

  // Plugins for additional functionality
  plugins: [
    // Plugin for line-clamp functionality
    function ({ addUtilities }) {
      const newUtilities = {
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
        '.line-clamp-4': {
          display: '-webkit-box',
          '-webkit-line-clamp': '4',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
      }
      addUtilities(newUtilities, ['responsive'])
    },

    // Plugin for glass morphism effects
    function ({ addUtilities }) {
      const glassUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
      }
      addUtilities(glassUtilities)
    },
  ],
}