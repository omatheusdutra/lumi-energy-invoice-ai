import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <section className="space-y-6" aria-label="Carregando dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`dashboard-kpi-loading-${index}`} className="h-44 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>

      <Skeleton className="h-[440px] rounded-2xl" />
    </section>
  );
}
