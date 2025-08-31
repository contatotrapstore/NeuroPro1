/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NeuroIA Lab Brand Colors - Clean Green Palette
        'neuro': {
          // Primary colors
          primary: '#2D5A1F',       // Verde principal
          'primary-hover': '#3D7A2F', // Verde hover
          'primary-light': '#4A9A3F',  // Verde claro
          'primary-dark': '#1A3A0F',   // Verde escuro
          
          // Semantic colors
          success: '#10B981',       // Verde sucesso
          warning: '#F59E0B',       // Laranja aviso
          error: '#EF4444',         // Vermelho erro
          info: '#3B82F6',          // Azul informação
          
          // Gray scale
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          }
        },
        
        // Individual Assistant Colors
        'assistant': {
          'psicoplano': '#0E1E03',
          'neurocase': '#1A3A0F', 
          'guia-etico': '#7C3AED',
          'sessao-map': '#DC2626',
          'clin-replay': '#EA580C',
          'cogniti-map': '#0891B2',
          'mind-route': '#2D5A1F',
          'thera-track': '#0E1E03',
          'neuro-laudo': '#6366F1',
          'psico-test': '#EC4899',
          'thera-focus': '#F59E0B',
          'psico-base': '#8B5CF6',
          'mind-home': '#1A3A0F',
          'clin-price': '#EF4444'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'display': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      }
    },
  },
  plugins: [],
}