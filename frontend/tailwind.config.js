export default {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    transitionDuration: {
      DEFAULT: 'var(--motion-micro)',
    },
    transitionTimingFunction: {
      DEFAULT: 'var(--motion-standard)',
    },
    extend: {
      colors: {
        lime: {
          spark: '#B6FF2E',
          dim: '#8FCB3D',
          tint: '#EBFAC9',
          hover: '#8FCB3D',
        },
        graphite: '#23262F',
        steel: '#3A3E47',
        slate: {
          DEFAULT: '#545963',
          border: '#545963',
        },
        ash: '#7C8189',
        fog: '#B0B4BA',
        semantic: {
          success: '#14B8A6',
          warning: '#F5A623',
          error: '#EF4444',
          info: '#3B82F6',
        },
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#9ba3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#323744',
          800: '#2c303b',
          900: '#23262f',
          950: '#14171f',
        },
        obsidian: '#14171f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
