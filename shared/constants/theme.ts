/**
 * QueueLess Design System Tokens
 * Common color palette, typography scales, spacing, shadows, and status badges
 * Shared between Admin Dashboard (Tailwind CSS) and Mobile App (React Native StyleSheets).
 */

export const colors = {
  // Brand Primary
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Standard Blue
    600: '#2563EB', // Primary Brand Blue
    700: '#1D4ED8',
    800: '#1E40AF', // Deep Brand Blue
    900: '#1E3A8A', // Dark Navy
    950: '#172554',
  },

  // Clean Neutral Surfaces & Text
  neutral: {
    white: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A', // Primary Charcoal Headings
    950: '#020617',
  },

  // Operational Status Colors
  status: {
    success: {
      light: '#ECFDF5',
      main: '#10B981',
      dark: '#059669',
      border: '#A7F3D0',
      text: '#065F46',
    },
    warning: {
      light: '#FFFBEB',
      main: '#F59E0B',
      dark: '#D97706',
      border: '#FDE68A',
      text: '#92400E',
    },
    danger: {
      light: '#FEF2F2',
      main: '#EF4444',
      dark: '#DC2626',
      border: '#FECACA',
      text: '#991B1B',
    },
    info: {
      light: '#EFF6FF',
      main: '#3B82F6',
      dark: '#2563EB',
      border: '#BFDBFE',
      text: '#1E40AF',
    },
  },

  // Crowd Occupancy Heatmap Scale
  occupancy: {
    normal: '#10B981',     // Green: < 60%
    moderate: '#3B82F6',   // Blue: 60-79%
    elevated: '#F59E0B',   // Amber: 80-94%
    critical: '#F97316',   // Orange: 95-100%
    overcrowded: '#EF4444', // Red: > 100%
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
  md: 10,
  lg: 14,
  xl: 20,
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
