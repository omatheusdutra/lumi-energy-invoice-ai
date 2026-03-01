'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyEnergyPoint } from '@/lib/dashboard/models';

const EnergyAreaChart = dynamic(
  () =>
    import('@/components/dashboard/energy-area-chart.client').then((mod) => mod.EnergyAreaChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full" />,
  },
);

export function EnergyAreaChartLazy({ data }: { data: MonthlyEnergyPoint[] }) {
  return <EnergyAreaChart data={data} />;
}
