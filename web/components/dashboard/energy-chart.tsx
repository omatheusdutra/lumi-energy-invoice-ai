'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardDTO } from '@/lib/dashboard/dashboard-dto';

const EnergyChartDynamic = dynamic(
  () =>
    import('@/components/dashboard/energy-chart.client').then((module) => module.EnergyChartClient),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[390px] rounded-2xl" />,
  },
);

interface EnergyChartProps {
  data: DashboardDTO['series_energy'];
}

export function EnergyChart({ data }: EnergyChartProps) {
  return <EnergyChartDynamic data={data} />;
}
