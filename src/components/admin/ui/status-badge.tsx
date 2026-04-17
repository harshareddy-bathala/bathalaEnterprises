/**
 * StatusBadge Component
 * Unified status badge component used across admin pages (especially Messages)
 * Ensures consistent colors and styling for status indicators
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/admin-design-tokens';

interface StatusBadgeProps {
  /**
   * Status type - determines colors
   * - pending: Amber/orange for unread or awaiting response
   * - resolved: Green for completed/resolved
   * - urgent: Red for high priority/critical
   * - archived: Gray for inactive/archived
   */
  status: 'pending' | 'resolved' | 'urgent' | 'archived';

  /**
   * Badge display text
   */
  label: string;

  /**
   * Variant style
   * - badge: Small colored badge with background
   * - pill: Larger pill with more padding
   */
  variant?: 'badge' | 'pill';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, label, variant = 'badge', className }, ref) => {
    const colors = STATUS_COLORS[status];

    const baseStyles = 'inline-flex items-center rounded-full font-semibold whitespace-nowrap';

    const variantStyles = {
      badge: 'px-2.5 py-1 text-xs',
      pill: 'px-3 py-1.5 text-sm',
    };

    const colorStyles = `bg-[${colors.bgColor}] text-[${colors.textColor}] border border-[${colors.borderColor}]`;

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        style={{
          backgroundColor: colors.bgColor,
          color: colors.textColor,
          borderColor: colors.borderColor,
          borderWidth: '1px',
        }}
      >
        <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: colors.badgeColor }} />
        {label}
      </div>
    );
  },
);

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
