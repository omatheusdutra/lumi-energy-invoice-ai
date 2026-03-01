'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { type MonthlyTrendPoint } from '@/components/dashboard/monthly-trends-chart.client';

const MonthlyTrendsChart = dynamic(
  () =>
    import('@/components/dashboard/monthly-trends-chart.client').then(
      (mod) => mod.MonthlyTrendsChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[380px] w-full" />
        <Skeleton className="h-[380px] w-full" />
      </div>
    ),
  },
);

export function MonthlyTrendsChartLazy({ data }: { data: MonthlyTrendPoint[] }) {
  return <MonthlyTrendsChart data={data} />;
}
