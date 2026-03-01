import { Activity, BatteryCharging, LineChart, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPercent } from '@/lib/format';
import type { KpiMetric } from '@/lib/dashboard/models';

interface KpiCardsProps {
  metrics: KpiMetric[];
  loading: boolean;
  error?: string;
}

const metricIconMap: Record<KpiMetric['id'], LucideIcon> = {
  generated: LineChart,
  consumed: Zap,
  compensated: BatteryCharging,
  credits: Activity,
};

export function KpiCards({ metrics, loading, error }: KpiCardsProps) {
  if (loading) {
    return (
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Carregando KPI cards"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`kpi-skeleton-${index}`}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <InlineAlert
        variant="danger"
        title="Não foi possível carregar os indicadores"
        description={error}
      />
    );
  }

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Indicadores principais de energia"
    >
      {metrics.map((metric) => {
        const Icon = metricIconMap[metric.id];
        const trendPositive = metric.trendPercent >= 0;
        const trendColor = trendPositive ? 'text-sky-700' : 'text-amber-700';

        return (
          <Card
            key={metric.id}
            className="overflow-hidden border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
          >
            <CardHeader className="mb-0 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sky-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                  <CardTitle className="text-[2rem] leading-none tracking-tight text-sky-900">
                    {metric.value.toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    <span className="ml-1 text-sm font-medium text-slate-400">{metric.unit}</span>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <p className={`text-xs font-semibold ${trendColor}`}>
                {trendPositive ? '+' : ''}
                {formatPercent(metric.trendPercent)}
                <span className="ml-1.5 font-normal text-slate-500">
                  em relação ao mês anterior
                </span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
