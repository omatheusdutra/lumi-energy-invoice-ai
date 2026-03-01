import { memo } from 'react';
import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipInfo } from '@/components/ui/tooltip';
import { formatCurrency, formatKwh, formatPercent } from '@/lib/format';
import type { DashboardDTO } from '@/lib/dashboard/dashboard-dto';
import { cn } from '@/lib/utils';

export type DashboardKpi = DashboardDTO['kpis'][number];

interface KpiCardProps {
  item: DashboardKpi;
}

function normalizeSeries(values: number[]): number[] {
  if (values.length >= 2) {
    return values;
  }

  const lastValue = values.at(0) ?? 0;
  return [lastValue, lastValue];
}

function buildSparklinePath(values: number[], width: number, height: number): string {
  const safeValues = normalizeSeries(values);
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const span = Math.max(max - min, 1);
  const step = width / (safeValues.length - 1);

  return safeValues
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function formatValue(item: DashboardKpi): string {
  if (item.unit === 'R$') {
    return formatCurrency(item.value);
  }
  return formatKwh(item.value);
}

function trendTone(value: number | null): 'up' | 'down' | 'flat' {
  if (value === null || value === 0) {
    return 'flat';
  }
  return value > 0 ? 'up' : 'down';
}

function KpiCardComponent({ item }: KpiCardProps) {
  const sparklinePath = buildSparklinePath(item.sparkline, 220, 42);
  const tone = trendTone(item.trendPercent);

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-sky-100/80 bg-white/88 p-0 shadow-[0_18px_40px_-30px_rgba(6,46,90,0.65)] backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-sky-100/65 blur-2xl transition group-hover:scale-110" />
      <CardContent className="relative space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-[1.95rem] font-semibold tracking-tight text-[#0a2340]">
              {formatValue(item)}
            </p>
          </div>
          <TooltipInfo content={item.formula} side="left" ariaLabel={`Formula de ${item.label}`} />
        </div>

        <div className="rounded-xl border border-sky-100/90 bg-sky-50/45 p-3">
          <svg
            viewBox="0 0 220 42"
            className="h-[42px] w-full"
            role="img"
            aria-label={`Sparkline de ${item.label}`}
          >
            <path
              d={sparklinePath}
              className="fill-none stroke-sky-600"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
              tone === 'up' &&
                'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/45',
              tone === 'down' &&
                'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/45',
              tone === 'flat' &&
                'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800',
            )}
          >
            {tone === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {tone === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {tone === 'flat' ? <Equal className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.trendPercent === null
              ? 'Sem histórico suficiente'
              : formatPercent(item.trendPercent)}
          </span>

          <p className="text-xs text-slate-500">Impacto do período monitorado</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const KpiCard = memo(KpiCardComponent);
