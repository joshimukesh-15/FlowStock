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
        citrus: {
          DEFAULT: '#E4FD97',
          hover: '#d5f57a',
          active: '#c3e65c',
          muted: 'rgba(228, 253, 151, 0.12)',
          border: 'rgba(228, 253, 151, 0.28)',
          text: '#080813',
        },
        frozen: {
          DEFAULT: '#A0BDDB',
          hover: '#b4cce3',
          muted: 'rgba(160, 189, 219, 0.12)',
          border: 'rgba(160, 189, 219, 0.25)',
          deep: '#789ec3',
        },
        iris: {
          DEFAULT: '#080813',
          canvas: '#080813',
          surface: '#121224',
          raised: '#181832',
          overlay: '#202040',
          border: '#202138',
          'border-strong': '#2c2d4c',
          hairline: '#202138',
        },
        lime: {
          spark: '#E4FD97',
          dim: '#d5f57a',
          tint: '#f4fee0',
          hover: '#d5f57a',
        },
        graphite: '#121224',
        steel: '#181832',
        slate: {
          DEFAULT: '#202138',
          border: '#202138',
        },
        ash: '#7e889b',
        fog: '#c2cbda',
        semantic: {
          success: '#E4FD97',
          warning: '#F5A623',
          error: '#EF4444',
          info: '#A0BDDB',
        },
        brand: {
          50: '#f6f8fb',
          100: '#edf2f8',
          200: '#d8e2ec',
          300: '#b8c9dc',
          400: '#94aac2',
          500: '#6d88a6',
          600: '#4e6784',
          700: '#2c2d4c',
          800: '#181832',
          900: '#121224',
          950: '#080813',
        },
        obsidian: '#080813',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'citrus-glow': '0 2px 20px -2px rgba(228, 253, 151, 0.35)',
        'frozen-glow': '0 2px 20px -2px rgba(160, 189, 219, 0.25)',
      },
    },
  },
  plugins: [],
};
