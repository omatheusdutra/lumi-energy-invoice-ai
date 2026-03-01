import { AlertTriangle, CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/security/sanitize';

interface InlineAlertProps {
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantMap = {
  info: {
    icon: CircleAlert,
    className: 'border-primary/40 bg-primary/10 text-foreground',
  },
  success: {
    icon: CircleCheck,
    className: 'border-success/40 bg-success/10 text-foreground',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning/40 bg-warning/10 text-foreground',
  },
  danger: {
    icon: AlertTriangle,
    className: 'border-danger/40 bg-danger/10 text-foreground',
  },
} as const;

export function InlineAlert({ title, description, variant = 'info', className }: InlineAlertProps) {
  const { icon: Icon, className: variantClass } = variantMap[variant];
  const safeTitle = sanitizeText(title);
  const safeDescription = description ? sanitizeText(description) : undefined;

  return (
    <div
      className={cn('rounded-md border p-3', variantClass, className)}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{safeTitle}</p>
          {safeDescription ? (
            <p className="text-sm text-muted-foreground">{safeDescription}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
