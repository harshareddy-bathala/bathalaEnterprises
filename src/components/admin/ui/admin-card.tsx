/**
 * AdminCard Component
 * Unified card component used across all admin pages
 * Ensures consistent hover states, shadows, and interactions
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { INTERACTION_CLASSES } from '@/lib/admin-design-tokens';

interface AdminCardProps {
  /**
   * Visual variant of the card
   * - default: Standard card with hover lift and shadow
   * - metric: Larger metric display card (dashboard)
   * - compact: Smaller card with subtle hover effect
   */
  variant?: 'default' | 'metric' | 'compact';

  /**
   * Whether the card responds to hover/interaction
   * Set to false for static cards
   */
  interactive?: boolean;

  /**
   * Disabled state - reduces opacity and removes hover effects
   */
  disabled?: boolean;

  /**
   * Click handler for interactive cards
   */
  onClick?: () => void;

  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * Card content
   */
  children: React.ReactNode;
}

const AdminCard = React.forwardRef<HTMLDivElement, AdminCardProps>(
  (
    {
      variant = 'default',
      interactive = true,
      disabled = false,
      onClick,
      className,
      children,
    },
    ref,
  ) => {
    const baseStyles =
      'rounded-2xl border border-[var(--admin-border)] bg-white p-5 shadow-sm';

    const variantStyles = {
      default: 'min-h-[120px]',
      metric: 'p-6 min-h-[140px]',
      compact: 'p-4 min-h-[80px]',
    };

    const interactiveStyles = interactive
      ? variant === 'compact'
        ? INTERACTION_CLASSES.cardHoverSubtle
        : INTERACTION_CLASSES.cardHover
      : '';

    const disabledStyles = disabled ? INTERACTION_CLASSES.disabled : '';

    const cursorStyles = interactive && !disabled ? 'cursor-pointer' : '';

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          baseStyles,
          variantStyles[variant],
          interactiveStyles,
          disabledStyles,
          cursorStyles,
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

AdminCard.displayName = 'AdminCard';

export default AdminCard;
