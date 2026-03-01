import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
