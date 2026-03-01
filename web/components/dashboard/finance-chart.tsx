'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardDTO } from '@/lib/dashboard/dashboard-dto';

const FinanceChartDynamic = dynamic(
  () =>
    import('@/components/dashboard/finance-chart.client').then(
      (module) => module.FinanceChartClient,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[390px] rounded-2xl" />,
  },
);

interface FinanceChartProps {
  data: DashboardDTO['series_finance'];
}

export function FinanceChart({ data }: FinanceChartProps) {
  return <FinanceChartDynamic data={data} />;
}
