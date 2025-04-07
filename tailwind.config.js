/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary color - Indigo
        primary: {
          DEFAULT: '#4F46E5',
          50: '#EBEAFD',
          100: '#D7D5FB',
          200: '#B0ABF7',
          300: '#8982F3',
          400: '#6158EF',
          500: '#4F46E5', // Main primary color
          600: '#2D23DD',
          700: '#221BB0',
          800: '#191483',
          900: '#100D56',
        },
        // Secondary color - Emerald Green
        secondary: {
          DEFAULT: '#059669',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669', // Main secondary color
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Text colors
        text: {
          primary: '#111827', // Gray-900
          secondary: '#6B7280', // Gray-500
          muted: '#9CA3AF', // Gray-400
          light: '#F9FAFB', // Gray-50
        },
        // Background colors
        primary: {
          bg: '#FFFFFF', // White
          'bg-alt': '#F9FAFB', // Gray-50
        },
        // Border colors
        border: {
          light: '#E5E7EB', // Gray-200
          DEFAULT: '#D1D5DB', // Gray-300
          dark: '#9CA3AF', // Gray-400
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
