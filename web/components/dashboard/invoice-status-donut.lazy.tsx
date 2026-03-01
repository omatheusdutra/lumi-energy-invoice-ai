'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { InvoiceStatusSlice } from '@/lib/dashboard/models';

const InvoiceStatusDonut = dynamic(
  () =>
    import('@/components/dashboard/invoice-status-donut.client').then(
      (mod) => mod.InvoiceStatusDonut,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[380px] w-full" />,
  },
);

export function InvoiceStatusDonutLazy({ data }: { data: InvoiceStatusSlice[] }) {
  return <InvoiceStatusDonut data={data} />;
}
