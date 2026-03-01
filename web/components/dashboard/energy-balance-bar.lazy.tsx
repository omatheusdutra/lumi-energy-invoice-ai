'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyEnergyPoint } from '@/lib/dashboard/models';

const EnergyBalanceBarChart = dynamic(
  () =>
    import('@/components/dashboard/energy-balance-bar.client').then(
      (mod) => mod.EnergyBalanceBarChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[380px] w-full" />,
  },
);

export function EnergyBalanceBarLazy({ data }: { data: MonthlyEnergyPoint[] }) {
  return <EnergyBalanceBarChart data={data} />;
}
