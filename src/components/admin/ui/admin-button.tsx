/**
 * AdminButton Component
 * Unified button component used across all admin pages
 * Ensures consistent hover states, focus rings, and disabled states
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { INTERACTION_CLASSES } from '@/lib/admin-design-tokens';

interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * - primary: Main action button (blue/accent color)
   * - secondary: Secondary action button (gray)
   * - danger: Destructive action button (red)
   * - subtle: Text-only button with hover background
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'subtle';

  /**
   * Size variant
   * - sm: Small (icon buttons, compact layouts)
   * - md: Medium (standard buttons)
   * - lg: Large (prominent CTAs)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state - shows spinner and disables button
   */
  isLoading?: boolean;

  /**
   * Custom className to override defaults
   */
  className?: string;

  /**
   * Button content
   */
  children: React.ReactNode;
}

const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--admin-accent)]';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variantStyles = {
      primary:
        'bg-[var(--admin-accent)] text-white shadow-sm hover:scale-105 hover:shadow-[var(--shadow-medium)] disabled:opacity-50 disabled:cursor-not-allowed',
      secondary:
        'bg-[#f3f1ed] text-[var(--admin-text)] shadow-sm hover:bg-[#e9e7e0] hover:scale-105 hover:shadow-[var(--shadow-medium)] disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105 hover:shadow-[var(--shadow-touch)] disabled:opacity-50 disabled:cursor-not-allowed',
      subtle:
        'text-[var(--admin-text)] hover:bg-[#f3f1ed] hover:text-[var(--admin-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    };

    const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          disabledStyles,
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

AdminButton.displayName = 'AdminButton';

export default AdminButton;
