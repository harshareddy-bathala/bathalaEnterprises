/**
 * Admin Design System Tokens
 * Single source of truth for spacing, timing, shadows, and colors
 * Used across all admin pages to ensure consistency
 */

// ============================================================================
// SPACING SCALE
// ============================================================================
export const SPACING = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

// ============================================================================
// TRANSITION TIMING
// ============================================================================
export const TRANSITION = {
  fast: '100ms', // Quick feedback (focus rings, color changes)
  base: '200ms', // Standard interactions (hover, scale, shadows)
  slow: '300ms', // Larger transitions (modals, page changes)
} as const;

export const EASING = {
  standard: 'ease-out', // ease-out-quart preferred, fallback to ease-out
  quickOut: 'cubic-bezier(0.165, 0.84, 0.44, 1)', // ease-out-quart equivalent
} as const;

// ============================================================================
// SHADOW SCALE
// ============================================================================
export const SHADOWS = {
  touch: '0 2px 4px rgba(0, 0, 0, 0.05)', // Subtle, barely perceptible
  medium: '0 8px 16px rgba(0, 0, 0, 0.08)', // Standard card hover shadow
  deep: '0 16px 32px rgba(0, 0, 0, 0.12)', // Modal/elevated surfaces
  focus: '0 0 0 3px rgba(184, 154, 94, 0.1)', // Focus ring shadow (brand accent color)
} as const;

// ============================================================================
// STATUS BADGE COLORS
// ============================================================================
export const STATUS_COLORS = {
  pending: {
    bgColor: '#fffbeb', // bg-amber-50
    textColor: '#92400e', // text-amber-900
    borderColor: '#fcd34d', // border-amber-300
    badgeColor: '#f59e0b', // amber-500
  },
  resolved: {
    bgColor: '#ecfdf3', // bg-green-50
    textColor: '#065f46', // text-green-900
    borderColor: '#6ee7b7', // border-green-300
    badgeColor: '#10b981', // green-500
  },
  urgent: {
    bgColor: '#fee2e2', // bg-red-50
    textColor: '#7f1d1d', // text-red-900
    borderColor: '#fca5a5', // border-red-300
    badgeColor: '#ef4444', // red-500
  },
  archived: {
    bgColor: '#f3f4f6', // bg-gray-100
    textColor: '#374151', // text-gray-700
    borderColor: '#d1d5db', // border-gray-300
    badgeColor: '#9ca3af', // gray-400
  },
} as const;

// ============================================================================
// INTERACTION CLASSES (for cn() helper)
// ============================================================================
export const INTERACTION_CLASSES = {
  cardHover: 'hover:-translate-y-1 hover:shadow-[var(--shadow-medium)] transition-all duration-200',
  cardHoverSubtle: 'hover:-translate-y-0.5 hover:shadow-[var(--shadow-touch)] transition-all duration-200',
  buttonHover: 'hover:scale-105 hover:shadow-[var(--shadow-medium)] transition-all duration-200',
  focusRing: 'focus:ring-2 focus:ring-[var(--admin-accent)] focus:ring-offset-2 focus:outline-none',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// ============================================================================
// COLOR PALETTE (existing admin colors)
// ============================================================================
export const ADMIN_COLORS = {
  bg: '#f5f4f2',
  surface: '#fcfcfb',
  border: '#e5e2db',
  text: '#1a1f2e',
  textMuted: '#6b7280',
  accent: '#b89a5e', // Gold
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type SpacingKey = keyof typeof SPACING;
export type TransitionKey = keyof typeof TRANSITION;
export type ShadowKey = keyof typeof SHADOWS;
export type StatusColorKey = keyof typeof STATUS_COLORS;
