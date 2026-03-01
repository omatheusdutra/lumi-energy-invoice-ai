'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const offset = 10;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let resolvedSide: TooltipSide = side;

    if (side === 'top' && anchorRect.top - tooltipRect.height - offset < margin) {
      resolvedSide = 'bottom';
    } else if (
      side === 'bottom' &&
      anchorRect.bottom + tooltipRect.height + offset > viewportHeight - margin
    ) {
      resolvedSide = 'top';
    } else if (side === 'left' && anchorRect.left - tooltipRect.width - offset < margin) {
      resolvedSide = 'right';
    } else if (
      side === 'right' &&
      anchorRect.right + tooltipRect.width + offset > viewportWidth - margin
    ) {
      resolvedSide = 'left';
    }

    let top = 0;
    let left = 0;

    if (resolvedSide === 'top' || resolvedSide === 'bottom') {
      top =
        resolvedSide === 'top'
          ? anchorRect.top - tooltipRect.height - offset
          : anchorRect.bottom + offset;
      left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

      left = Math.max(margin, Math.min(left, viewportWidth - tooltipRect.width - margin));
    } else {
      top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
      left =
        resolvedSide === 'left'
          ? anchorRect.left - tooltipRect.width - offset
          : anchorRect.right + offset;

      top = Math.max(margin, Math.min(top, viewportHeight - tooltipRect.height - margin));
    }

    setPosition({ top, left });
  }, [side]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={anchorRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      <span
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!open}
        style={{ top: position.top, left: position.left }}
        className={cn(
          'pointer-events-none fixed z-[80] w-max max-w-[260px] rounded-md border border-slate-700/70 bg-slate-900 px-2.5 py-1.5 text-xs font-medium leading-relaxed text-white shadow-xl transition-opacity duration-150',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}

interface TooltipInfoProps {
  content: ReactNode;
  className?: string;
  side?: TooltipSide;
  ariaLabel?: string;
}

export function TooltipInfo({
  content,
  className,
  side = 'top',
  ariaLabel = 'Mais informacoes',
}: TooltipInfoProps) {
  return (
    <Tooltip content={content} side={side} className={className}>
      <button
        type="button"
        aria-label={ariaLabel}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
