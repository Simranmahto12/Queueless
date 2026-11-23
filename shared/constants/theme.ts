/**
 * QueueLess Design System Tokens
 * Common color palette, typography scales, spacing, shadows, and status badges
 * Shared between Admin Dashboard (Tailwind CSS) and Mobile App (React Native StyleSheets).
 */

export const colors = {
  // Brand Foundation
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
    800: '#142B4A', // Primary Navy
    900: '#0E1E34',
    950: '#08111E',
  },

  blue: {
    DEFAULT: '#2563EB',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Secondary Blue
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Clean Neutral Surfaces & Text
  neutral: {
    white: '#FFFFFF',
    bg: '#F7F9FC',
    card: '#FFFFFF',
    border: '#E5EAF1',
    textMain: '#172033',
    textSecondary: '#64748B',
    50: '#F7F9FC',
    100: '#F1F5F9',
    200: '#E5EAF1',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#172033',
  },

  // Operational Status Colors
  status: {
    success: {
      light: '#F0FDF4',
      main: '#16A36A',
      dark: '#117A50',
      border: '#BBF7D0',
      text: '#166534',
    },
    warning: {
      light: '#FFFBEB',
      main: '#D99A25',
      dark: '#B45309',
      border: '#FDE68A',
      text: '#92400E',
    },
    danger: {
      light: '#FEF2F2',
      main: '#DC4C4C',
      dark: '#B91C1C',
      border: '#FECACA',
      text: '#991B1B',
    },
    info: {
      light: '#EFF6FF',
      main: '#2563EB',
      dark: '#1D4ED8',
      border: '#BFDBFE',
      text: '#1E40AF',
    },
  },

  // Crowd Occupancy Heatmap Scale
  occupancy: {
    normal: '#16A36A',     // Green: < 60%
    moderate: '#2563EB',   // Blue: 60-79%
    elevated: '#D99A25',   // Amber: 80-94%
    critical: '#EA580C',   // Orange: 95-100%
    overcrowded: '#DC4C4C', // Red: > 100%
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
