/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#142B4A',
          50: '#F0F4F8',
          100: '#D9E3EE',
          200: '#B3C8DD',
          300: '#8CADCC',
          400: '#5A8BB5',
          500: '#346B99',
          600: '#23527D',
          700: '#1A3F63',
          800: '#142B4A',
          900: '#0E1E34',
          950: '#08111E',
        },
        primary: {
          DEFAULT: '#142B4A',
          hover: '#1D3B64',
        },
        secondary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        surface: '#FFFFFF',
        appBg: '#F7F9FC',
        textMain: '#172033',
        textMuted: '#64748B',
        borderSoft: '#E5EAF1',
        success: {
          DEFAULT: '#16A36A',
          light: '#F0FDF4',
          border: '#BBF7D0',
        },
        warning: {
          DEFAULT: '#D99A25',
          light: '#FFFBEB',
          border: '#FDE68A',
        },
        danger: {
          DEFAULT: '#DC4C4C',
          light: '#FEF2F2',
          border: '#FECACA',
        },
        brown: {
          DEFAULT: '#8B5A2B',
          50: '#FBF7F4',
          100: '#F4ECE4',
          200: '#E6D4C3',
          300: '#D5B89F',
          400: '#C49B7A',
          500: '#8B5A2B',
          600: '#75461E',
          700: '#5F3514',
          800: '#4A260C',
          900: '#331705',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(20, 43, 74, 0.04), 0 1px 3px 0 rgba(20, 43, 74, 0.06)',
        card: '0 2px 4px 0 rgba(20, 43, 74, 0.04), 0 4px 12px 0 rgba(20, 43, 74, 0.05)',
        elevated: '0 10px 25px -3px rgba(20, 43, 74, 0.08), 0 4px 6px -2px rgba(20, 43, 74, 0.03)',
      },
    },
  },
  plugins: [],
}
