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
        volt: {
          primary: '#00d992',
          'primary-soft': '#2fd6a1',
          'primary-deep': '#10b981',
          'on-primary': '#101010',
          canvas: '#101010',
          'canvas-soft': '#1a1a1a',
          hairline: '#3d3a39',
          'hairline-soft': '#b8b3b0',
          ink: '#f2f2f2',
          'ink-strong': '#ffffff',
          body: '#bdbdbd',
          mute: '#8b949e',
          'text-soft': '#f5f6f7',
        },
        lime: {
          spark: '#00d992',
          dim: '#2fd6a1',
          tint: '#d1fae5',
          hover: '#2fd6a1',
        },
        graphite: '#1a1a1a',
        steel: '#242424',
        slate: {
          DEFAULT: '#3d3a39',
          border: '#3d3a39',
        },
        ash: '#8b949e',
        fog: '#bdbdbd',
        semantic: {
          success: '#00d992',
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
          700: '#3d3a39',
          800: '#202020',
          900: '#1a1a1a',
          950: '#101010',
        },
        obsidian: '#101010',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'volt-glow': '0 0 20px -3px rgba(0, 217, 146, 0.25)',
      },
    },
  },
  plugins: [],
};
