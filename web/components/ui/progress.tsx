import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={normalized}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Upload progress"
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
