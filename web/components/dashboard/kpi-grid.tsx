import { memo } from 'react';
import type { DashboardDTO } from '@/lib/dashboard/dashboard-dto';
import { KpiCard } from '@/components/dashboard/kpi-card';

interface KpiGridProps {
  items: DashboardDTO['kpis'];
}

function KpiGridComponent({ items }: KpiGridProps) {
  return (
    <section
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      aria-label="Indicadores principais do dashboard"
    >
      {items.map((item) => (
        <KpiCard key={item.id} item={item} />
      ))}
    </section>
  );
}

export const KpiGrid = memo(KpiGridComponent);
