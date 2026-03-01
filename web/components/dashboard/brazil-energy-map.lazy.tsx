'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlantLocation } from '@/lib/dashboard/models';

const BrazilEnergyMap = dynamic(
  () =>
    import('@/components/dashboard/brazil-energy-map.client').then((mod) => mod.BrazilEnergyMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full" />,
  },
);

export function BrazilEnergyMapLazy({ plants }: { plants: PlantLocation[] }) {
  return <BrazilEnergyMap plants={plants} />;
}
